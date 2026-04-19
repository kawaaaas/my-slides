#!/usr/bin/env node
// CDKアプリエントリーポイント（後続タスクで実装）
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";

const app = new cdk.App();
// PipelineStackは後続タスクで追加
app.synth();
