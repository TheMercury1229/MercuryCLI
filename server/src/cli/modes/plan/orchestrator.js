import chalk from "chalk";
import { confirm, isCancel, text } from "@clack/prompts";
import { generatePlan } from "./planner.js";
import { printPlan, selectSteps } from "./selection.js";
import { defaultAgentConfig } from "../agent/types.js";
import { ActionTracker } from "../agent/action-tracker.js";
import { ToolExecutor } from "../agent/tool-executor.js";
import { createAgentTools } from "../agent/agent-tools.js";
import { createWebTools } from "../web-tools.js";
import { stepCountIs, ToolLoopAgent } from "ai";
import { getAgentModel } from "../../../config/agent-model.js";
import { renderTerminalMarkdown } from "../../terminal-md.js";
import { runApprovalFlow } from "../agent/approval.js";

/**
 * @param {string} goal
 * @param {import("./types.js").PlanStep} step
 */
function stepPrompt(goal, step) {
  return [`Goal: ${goal}`, `Step: ${step.title}`, step.description].join("\n");
}

/**
 * @param {import("../../commands/ai/wakeup.js").DbContext} [dbContext]
 */
export async function runPlanMode(dbContext) {
  console.log(chalk.bold("\nPlan Mode\n"));

  const goal = await text({ message: "What would you like to plan today?" });
  if (isCancel(goal) || !goal.trim()) return;

  // Persist goal
  if (dbContext) {
    await dbContext.saveUserMessage(goal.trim());
    await dbContext.updateTitle(goal.trim().slice(0, 60));
  }

  const plan = await generatePlan(goal.trim());
  printPlan(plan);

  // Persist generated plan
  if (dbContext) {
    await dbContext.saveAssistantMessage(
      JSON.stringify({ type: "plan", researchSummary: plan.researchSummary, steps: plan.steps })
    );
  }

  const selected = await selectSteps(plan);
  if (selected.length === 0) return;

  const proceed = await confirm({
    message: `Execute ${selected.length} selected steps?`,
    initialValue: true,
  });
  if (isCancel(proceed) || !proceed) return;

  // Persist step selection
  if (dbContext) {
    await dbContext.saveUserMessage(
      JSON.stringify({ type: "selection", selected: selected.map((s) => s.id) })
    );
  }

  const config = defaultAgentConfig();
  const tracker = new ActionTracker();
  const executor = new ToolExecutor(tracker, config);
  const hasWeb = !!process.env.FIRECRAWL_API_KEY;
  const tools = {
    ...createAgentTools(executor),
    ...(hasWeb ? createWebTools(tracker) : {}),
  };

  for (const step of selected) {
    console.log(chalk.cyan(`\nExecuting step: ${step.title}\n`));

    const agent = new ToolLoopAgent({
      model: getAgentModel(),
      stopWhen: stepCountIs(20),
      tools,
    });

    const result = await agent.generate({
      prompt: stepPrompt(goal.trim(), step),
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
  }

  const ok = await runApprovalFlow(tracker);
  if (!ok) {
    executor.clearStaging();
    if (dbContext) {
      await dbContext.saveAssistantMessage(
        JSON.stringify({ type: "result", summary: "Cancelled — no changes applied.", applied: false })
      );
    }
    return;
  }

  const { errors } = executor.applyApprovedFromTracker();

  const approvedActions = tracker.getActions().filter((a) => a.status === "approved");
  const changesSummary = approvedActions
    .filter((a) => ["file_create","file_modify","file_delete","folder_create","tool_execute"].includes(a.type))
    .map((a) => `${a.path} (${a.type})`);

  if (errors.length > 0) {
    console.log(chalk.red("\nSome operations reported errors:\n"));
    for (const e of errors) console.log(chalk.red(`  • ${e}`));
  } else {
    console.log(chalk.green("\n✓ Applied.\n"));
  }

  if (dbContext) {
    await dbContext.saveAssistantMessage(
      JSON.stringify({
        type: "result",
        summary: errors.length > 0
          ? `Applied with ${errors.length} error(s). ${changesSummary.length} changes.`
          : `${changesSummary.length} changes applied successfully.`,
        applied: true,
        changes: changesSummary,
        errors,
      })
    );
  }

  executor.clearStaging();
}
