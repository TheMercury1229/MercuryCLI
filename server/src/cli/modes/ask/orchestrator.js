import { confirm, isCancel, text } from "@clack/prompts";
import chalk from "chalk";
import { defaultAgentConfig } from "../agent/types.js";
import { ActionTracker } from "../agent/action-tracker.js";
import { ToolExecutor } from "../agent/tool-executor.js";
import { createAskTools } from "./ask-tools.js";
import { createWebTools } from "../web-tools.js";
import { stepCountIs, ToolLoopAgent } from "ai";
import { getAgentModel } from "../../../config/agent-model.js";
import { renderTerminalMarkdown } from "../../terminal-md.js";

/**
 * @param {import("../../commands/ai/wakeup.js").DbContext} [dbContext]
 */
export async function runAskMode(dbContext) {
  console.log(chalk.bold("\nAsk Mode\n"));

  // ── Multi-turn loop ────────────────────────────────────────────────────────
  while (true) {
    const question = await text({
      message: "What do you want to ask?",
      placeholder: "Ask anything about your codebase…",
    });
    if (isCancel(question) || !question.trim()) break;

    // Persist question
    if (dbContext) {
      await dbContext.saveUserMessage(question.trim());
      // Set title from first question only
      const msgs = await dbContext.getMessages();
      if (msgs.filter((m) => m.role === "user").length <= 1) {
        await dbContext.updateTitle(question.trim().slice(0, 60));
      }
    }

    const config = defaultAgentConfig();
    // Ask mode: read-only (no mutations)
    config.tools.allowShellExecution = false;
    config.tools.allowFileModification = false;
    config.tools.allowFileCreation = false;
    config.tools.allowFolderCreation = false;

    const tracker = new ActionTracker();
    const executor = new ToolExecutor(tracker, config);
    const hasWeb = !!process.env.FIRECRAWL_API_KEY;

    const tools = {
      ...createAskTools(executor),
      ...(hasWeb ? createWebTools(tracker) : {}),
    };

    // Load prior conversation messages from DB for multi-turn context
    const priorMessages = dbContext ? await dbContext.getMessages() : [];

    const agent = new ToolLoopAgent({
      model: getAgentModel(),
      stopWhen: stepCountIs(20),
      tools,
      instructions: [
        `Workspace root: ${config.codebasePath}`,
        "Read-only mode. You may read files and answer questions. Do not modify anything.",
        hasWeb
          ? "Web tools are available (web_search/web_crawl/fetch_url). Use only when needed."
          : "No web tools available.",
      ].join("\n"),
    });

    const messages =
      priorMessages.length > 0
        ? [...priorMessages, { role: "user", content: question.trim() }]
        : undefined;

    const result = await agent.generate({
      ...(messages ? { messages } : { prompt: question.trim() }),
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

    const answer = result.text?.trim() || "No answer generated.";
    console.log("\n" + renderTerminalMarkdown(answer) + "\n");

    // Persist answer
    if (dbContext) {
      await dbContext.saveAssistantMessage(answer);
    }

    // Ask to continue or exit
    const continueAsking = await confirm({
      message: "Ask another question?",
      initialValue: true,
    });
    if (isCancel(continueAsking) || !continueAsking) break;
  }
}
