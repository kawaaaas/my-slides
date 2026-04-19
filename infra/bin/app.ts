#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

// コンテキストから設定値を取得
const repositoryName =
  app.node.tryGetContext("repositoryName") ?? "owner/slides-kawaaaas";
const connectionArn = app.node.tryGetContext("connectionArn") ?? "";
const domainName = app.node.tryGetContext("domainName") ?? "slides.kawaaaas";
const certificateArn = app.node.tryGetContext("certificateArn");

new PipelineStack(app, "SlidesPipeline", {
  repositoryName,
  connectionArn,
  domainName,
  certificateArn,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
  },
});

app.synth();
