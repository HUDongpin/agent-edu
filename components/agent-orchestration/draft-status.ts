import type { AgentOrchestrationDraftStatus } from "@/lib/agent-orchestration/draft-persistence";
import {
  isChinese,
  label,
  type Labels,
} from "./interaction-helpers";

export function draftStatusText(
  labels: Labels,
  status: AgentOrchestrationDraftStatus,
): string {
  const chinese = isChinese(labels);
  switch (status) {
    case "editing":
      return label(labels, "draftEditing", chinese ? "编辑中" : "Editing");
    case "saving":
      return label(labels, "draftSaving", chinese ? "正在保存…" : "Saving…");
    case "draft-saved":
      return label(labels, "draftSaved", chinese ? "草稿已保存" : "Draft saved");
    case "evidence-accepted":
      return label(
        labels,
        "evidenceAccepted",
        chinese ? "证据已接受" : "Evidence accepted",
      );
    default:
      return "";
  }
}
