import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";
import { Api } from "./constructs/api";
import { Cdn } from "./constructs/cdn";
import { Database } from "./constructs/database";
import { Storage } from "./constructs/storage";

export interface SlideViewerStackProps extends cdk.StackProps {
  /** カスタムドメイン名 */
  readonly domainName?: string;
  /** ACM証明書ARN（us-east-1のCloudFront用） */
  readonly certificateArn?: string;
}

export class SlideViewerStack extends cdk.Stack {
  /** CloudFront Distribution（キャッシュ無効化で使用） */
  public readonly distribution: cloudfront.IDistribution;
  /** DynamoDBテーブル */
  public readonly table: dynamodb.ITable;

  constructor(scope: Construct, id: string, props?: SlideViewerStackProps) {
    super(scope, id, props);

    // ストレージ
    const storage = new Storage(this, "Storage");

    // データベース
    const database = new Database(this, "Database");
    this.table = database.table;

    // API
    const api = new Api(this, "Api", {
      table: database.table,
    });

    // CDN
    const cdn = new Cdn(this, "Cdn", {
      bucket: storage.bucket,
      functionUrl: api.functionUrl,
      table: database.table,
      domainName: props?.domainName,
      certificateArn: props?.certificateArn,
    });
    this.distribution = cdn.distribution;

    // 出力
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: cdn.distribution.distributionDomainName,
      description: "CloudFront Distribution ドメイン名",
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: storage.bucket.bucketName,
      description: "S3バケット名",
    });

    new cdk.CfnOutput(this, "FunctionUrlEndpoint", {
      value: api.functionUrl.url,
      description: "Lambda Function URL エンドポイント",
    });
  }
}
