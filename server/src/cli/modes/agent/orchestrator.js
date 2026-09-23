import { isCancel, text } from "@clack/prompts";
import chalk from "chalk";
import { defaultAgentConfig } from "./types.js";
import { ActionTracker } from "./action-tracker.js";
import { ToolExecutor } from "./tool-executor.js";
import { createAgentTools } from "./agent-tools.js";
import { stepCountIs, ToolLoopAgent } from "ai";
import { getAgentModel } from "../../../config/agent-model.js";
import { renderTerminalMarkdown } from "../../terminal-md.js";
import { runApprovalFlow } from "./approval.js";

/**
 * @param {import("../../commands/ai/wakeup.js").DbContext} [dbContext]
 */
export async function runAgentMode(dbContext) {
  console.log(chalk.bold("\nAgent Mode\n"));

  const goal = await text({
    message: "What would you like the agent to do?",
    placeholder: "Concrete task for this codebase.",
  });
  if (isCancel(goal) || !goal.trim()) return;

  // Persist user goal
  if (dbContext) {
    await dbContext.saveUserMessage(goal.trim());
    await dbContext.updateTitle(goal.trim().slice(0, 60));
  }

  const config = defaultAgentConfig();
  const tracker = new ActionTracker();
  const executor = new ToolExecutor(tracker, config);
  const tools = createAgentTools(executor);

  const agent = new ToolLoopAgent({
    model: getAgentModel(),
    stopWhen: stepCountIs(40),
    instructions: [
      `Workspace root: ${config.codebasePath}`,
      "All mutations are staged until approved by the user.",
    ].join("\n"),
    tools,
  });

  const result = await agent.generate({
    prompt: goal.trim(),
    onStepFinish: ({ toolCalls }) => {
      for (const call of toolCalls) {
        const preview = JSON.stringify(call.input).slice(0, 160);
        console.log(
          chalk.green("✓"),
          chalk.bold(String(call.toolName)),
          chalk.dim(preview + (preview.length > 160 ? "..." : ""))
        );
      }
    },
  });

  if (result.text?.trim()) {
    console.log("\n" + renderTerminalMarkdown(result.text) + "\n");
  }

  const ok = await runApprovalFlow(tracker);

  if (!ok) {
    executor.clearStaging();
    if (dbContext) {
      await dbContext.saveAssistantMessage(
        JSON.stringify({ summary: "No changes applied — cancelled or nothing to stage.", approved: false, changes: [] })
      );
    }
    return;
  }

  const { errors } = executor.applyApprovedFromTracker();

  // Build summary of what changed for DB
  const approvedActions = tracker.getActions().filter((a) => a.status === "approved");
  const changesSummary = approvedActions
    .filter((a) => ["file_create","file_modify","file_delete","folder_create","tool_execute"].includes(a.type))
    .map((a) => `${a.path} (${a.type})`);

  if (errors.length > 0) {
    console.log(chalk.red("\nErrors applying changes:"));
    for (const err of errors) console.log(chalk.red(`  • ${err}`));
  } else {
    console.log(chalk.green("\n✓ Changes applied successfully.\n"));
  }

  if (dbContext) {
    await dbContext.saveAssistantMessage(
      JSON.stringify({
        summary: errors.length > 0
          ? `Applied with ${errors.length} error(s).`
          : `Applied ${changesSummary.length} change(s) successfully.`,
        approved: true,
        changes: changesSummary,
        errors,
      })
    );
  }

  executor.clearStaging();
}
