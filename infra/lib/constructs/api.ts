import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";

export interface ApiProps {
  /** DynamoDBテーブル */
  readonly table: dynamodb.ITable;
}

/** API用Lambda Function + Function URL */
export class Api extends Construct {
  public readonly functionUrl: lambda.IFunctionUrl;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const rootDir = path.join(__dirname, "..", "..", "..");

    const apiFunction = new nodejs.NodejsFunction(this, "Function", {
      functionName: "slides-kawaaaas-api",
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(rootDir, "lambda", "api", "index.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    // DynamoDBへの読み取り権限を付与
    props.table.grantReadData(apiFunction);

    // Function URLを作成
    this.functionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });
  }
}
