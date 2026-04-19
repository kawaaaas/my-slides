import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cr from "aws-cdk-lib/custom-resources";
import { execSync } from "child_process";
import { Construct } from "constructs";
import * as path from "path";

export interface CdnProps {
  /** S3バケット */
  readonly bucket: s3.IBucket;
  /** Lambda Function URL */
  readonly functionUrl: lambda.IFunctionUrl;
  /** DynamoDBテーブル（Lambda@Edge用） */
  readonly table: dynamodb.ITable;
  /** カスタムドメイン名 */
  readonly domainName?: string;
  /** ACM証明書ARN */
  readonly certificateArn?: string;
}

/** CloudFront Distribution + Lambda@Edge + BucketDeployment */
export class Cdn extends Construct {
  public readonly distribution: cloudfront.IDistribution;

  constructor(scope: Construct, id: string, props: CdnProps) {
    super(scope, id);

    const rootDir = path.join(__dirname, "..", "..", "..");

    // Lambda@Edge: OGP用（us-east-1リージョン）
    const ogpFunction = new cloudfront.experimental.EdgeFunction(
      this,
      "OgpEdgeFunction",
      {
        functionName: "slides-kawaaaas-ogp-edge",
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(path.join(rootDir, "lambda", "ogp"), {
          bundling: {
            image: lambda.Runtime.NODEJS_22_X.bundlingImage,
            local: {
              tryBundle(outputDir: string) {
                const entryPath = path.join(
                  rootDir,
                  "lambda",
                  "ogp",
                  "index.ts",
                );
                execSync(
                  `npx esbuild ${entryPath} --bundle --platform=node --target=node22 --outfile=${outputDir}/index.js --external:@aws-sdk/client-dynamodb --external:@aws-sdk/lib-dynamodb`,
                  { stdio: "inherit" },
                );
                return true;
              },
            },
            command: ["bash", "-c", "echo 'Docker bundling fallback'"],
            user: "root",
          },
        }),
        timeout: cdk.Duration.seconds(5),
        memorySize: 128,
      },
    );

    // Lambda@EdgeにDynamoDB読み取り権限を付与
    props.table.grantReadData(ogpFunction);

    // S3オリジン（OAC経由）
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(
      props.bucket as s3.Bucket,
    );

    // Lambda Function URLオリジン
    const apiOrigin = new origins.FunctionUrlOrigin(props.functionUrl);

    // ディストリビューション設定
    const distributionProps: cloudfront.DistributionProps = {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        edgeLambdas: [
          {
            functionVersion: ogpFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        "/api/*": {
          origin: apiOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, "ApiCachePolicy", {
            cachePolicyName: "slides-kawaaaas-api-cache",
            defaultTtl: cdk.Duration.minutes(5),
            maxTtl: cdk.Duration.minutes(10),
            minTtl: cdk.Duration.seconds(0),
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        "/assets/*": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
    };

    // カスタムドメインとACM証明書が指定されている場合に設定
    if (props.domainName && props.certificateArn) {
      const certificate =
        cdk.aws_certificatemanager.Certificate.fromCertificateArn(
          this,
          "Certificate",
          props.certificateArn,
        );
      Object.assign(distributionProps, {
        domainNames: [props.domainName],
        certificate,
      });
    }

    this.distribution = new cloudfront.Distribution(
      this,
      "Distribution",
      distributionProps,
    );

    // BucketDeployment: 静的サイトのデプロイ
    const siteDeploy = new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [s3deploy.Source.asset(path.join(rootDir, "website", "dist"))],
      destinationBucket: props.bucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
      exclude: ["slides/*"],
    });

    // スライドアセットのデプロイ
    const slideAssetsDeploy = new s3deploy.BucketDeployment(
      this,
      "DeploySlideAssets",
      {
        sources: [s3deploy.Source.asset(path.join(rootDir, "slides"))],
        destinationBucket: props.bucket,
        destinationKeyPrefix: "slides/",
        distribution: this.distribution,
        distributionPaths: ["/slides/*"],
        exclude: ["metadata.ts"],
      },
    );

    // デプロイ後のCloudFrontキャッシュ無効化（AwsCustomResource）
    // 全デプロイ完了後に包括的なキャッシュ無効化を実行する
    const invalidation = new cr.AwsCustomResource(
      this,
      "CloudFrontInvalidation",
      {
        onCreate: {
          service: "CloudFront",
          action: "createInvalidation",
          parameters: {
            DistributionId: (this.distribution as cloudfront.Distribution)
              .distributionId,
            InvalidationBatch: {
              CallerReference: `invalidation-${Date.now()}`,
              Paths: {
                Quantity: 1,
                Items: ["/*"],
              },
            },
          },
          physicalResourceId: cr.PhysicalResourceId.of(
            `cf-invalidation-${Date.now()}`,
          ),
        },
        onUpdate: {
          service: "CloudFront",
          action: "createInvalidation",
          parameters: {
            DistributionId: (this.distribution as cloudfront.Distribution)
              .distributionId,
            InvalidationBatch: {
              CallerReference: `invalidation-${Date.now()}`,
              Paths: {
                Quantity: 1,
                Items: ["/*"],
              },
            },
          },
          physicalResourceId: cr.PhysicalResourceId.of(
            `cf-invalidation-${Date.now()}`,
          ),
        },
        policy: cr.AwsCustomResourcePolicy.fromStatements([
          new iam.PolicyStatement({
            actions: ["cloudfront:CreateInvalidation"],
            resources: [
              `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${(this.distribution as cloudfront.Distribution).distributionId}`,
            ],
          }),
        ]),
      },
    );

    // キャッシュ無効化はデプロイ完了後に実行する
    invalidation.node.addDependency(siteDeploy);
    invalidation.node.addDependency(slideAssetsDeploy);
  }
}
