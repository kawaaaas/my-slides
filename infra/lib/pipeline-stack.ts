import * as cdk from "aws-cdk-lib";
import { pipelines } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { SlideViewerStage } from "./slide-viewer-stage";

export interface PipelineStackProps extends cdk.StackProps {
  /** GitHubリポジトリ（owner/repo形式） */
  readonly repositoryName: string;
  /** GitHubブランチ名 */
  readonly branchName?: string;
  /** GitHub接続ARN（CodeStar Connections） */
  readonly connectionArn: string;
  /** カスタムドメイン名 */
  readonly domainName?: string;
  /** ACM証明書ARN */
  readonly certificateArn?: string;
}

/** CDK Pipelineスタック */
export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // CDK Pipeline定義
    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: "slides-kawaaaas-pipeline",
      synth: new pipelines.ShellStep("Synth", {
        input: pipelines.CodePipelineSource.connection(
          props.repositoryName,
          props.branchName ?? "main",
          {
            connectionArn: props.connectionArn,
          },
        ),
        commands: ["npm ci", "npm run build:web", "npx cdk synth"],
        primaryOutputDirectory: "cdk.out",
      }),
      selfMutation: true,
      dockerEnabledForSynth: true,
    });

    // デプロイステージを追加
    pipeline.addStage(
      new SlideViewerStage(this, "Production", {
        domainName: props.domainName,
        certificateArn: props.certificateArn,
        env: {
          account: props.env?.account,
          region: props.env?.region ?? "ap-northeast-1",
        },
      }),
    );
  }
}
