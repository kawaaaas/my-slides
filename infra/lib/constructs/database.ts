import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { slides } from "../../../slides/metadata";

/** DynamoDBテーブル + メタデータ投入 */
export class Database extends Construct {
  public readonly table: dynamodb.ITable;

  /** テーブルARN（権限付与用） */
  public readonly tableArn: string;

  /** テーブル名 */
  public readonly tableName: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const table = new dynamodb.Table(this, "SlideMetadataTable", {
      tableName: "SlideMetadata",
      partitionKey: {
        name: "urlPath",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.table = table;
    this.tableArn = table.tableArn;
    this.tableName = table.tableName;

    // メタデータ投入（AwsCustomResource）
    slides.forEach((slide, index) => {
      new cr.AwsCustomResource(this, `PutSlideMetadata${index}`, {
        onCreate: {
          service: "DynamoDB",
          action: "putItem",
          parameters: {
            TableName: table.tableName,
            Item: {
              urlPath: { S: slide.urlPath },
              date: { S: slide.date },
              title: { S: slide.title },
              description: { S: slide.description },
              type: { S: slide.type },
              s3Path: { S: slide.s3Path },
              thumbnailPath: { S: slide.thumbnailPath },
              ...(slide.totalPages !== undefined && {
                totalPages: { N: String(slide.totalPages) },
              }),
            },
          },
          physicalResourceId: cr.PhysicalResourceId.of(
            `slide-metadata-${slide.urlPath}`,
          ),
        },
        onUpdate: {
          service: "DynamoDB",
          action: "putItem",
          parameters: {
            TableName: table.tableName,
            Item: {
              urlPath: { S: slide.urlPath },
              date: { S: slide.date },
              title: { S: slide.title },
              description: { S: slide.description },
              type: { S: slide.type },
              s3Path: { S: slide.s3Path },
              thumbnailPath: { S: slide.thumbnailPath },
              ...(slide.totalPages !== undefined && {
                totalPages: { N: String(slide.totalPages) },
              }),
            },
          },
          physicalResourceId: cr.PhysicalResourceId.of(
            `slide-metadata-${slide.urlPath}`,
          ),
        },
        policy: cr.AwsCustomResourcePolicy.fromStatements([
          new iam.PolicyStatement({
            actions: ["dynamodb:PutItem"],
            resources: [table.tableArn],
          }),
        ]),
      });
    });
  }
}
