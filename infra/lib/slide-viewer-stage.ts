import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { SlideViewerStack } from "./slide-viewer-stack";

export interface SlideViewerStageProps extends cdk.StageProps {
  /** カスタムドメイン名 */
  readonly domainName?: string;
  /** ACM証明書ARN（us-east-1のCloudFront用） */
  readonly certificateArn?: string;
}

/** デプロイステージ */
export class SlideViewerStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: SlideViewerStageProps) {
    super(scope, id, props);

    new SlideViewerStack(this, "SlideViewer", {
      domainName: props?.domainName,
      certificateArn: props?.certificateArn,
      env: {
        account: props?.env?.account,
        region: props?.env?.region ?? "ap-northeast-1",
      },
    });
  }
}
