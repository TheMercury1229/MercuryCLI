#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import { intro, isCancel, outro, select } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../../../lib/token.js";
import prisma from "../../../lib/db.js";
import { ChatService } from "../../../service/chat.service.js";
import { runAgentMode } from "../../modes/agent/orchestrator.js";
import { runAskMode } from "../../modes/ask/orchestrator.js";
import { runPlanMode } from "../../modes/plan/orchestrator.js";

/**
 * @typedef {Object} DbContext
 * @property {string} conversationId
 * @property {string} userId
 * @property {(content: string) => Promise<void>} saveUserMessage
 * @property {(content: string) => Promise<void>} saveAssistantMessage
 * @property {(title: string) => Promise<void>} updateTitle
 * @property {() => Promise<Array<{role: string, content: string}>>} getMessages
 */

async function wakeupCommand() {
  intro(chalk.bold.cyan("Mercury AI"));

  // ── Auth (unchanged logic) ────────────────────────────────────────────────
  const token = await getStoredToken();
  if (!token?.access_token) {
    console.log(chalk.red("✗ Not logged in. Run: mercury-cli login"));
    process.exit(1);
  }

  const spinner = yoctoSpinner({ text: "Authenticating..." }).start();
  const user = await prisma.user.findFirst({
    where: {
      sessions: { some: { token: token.access_token } },
    },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    spinner.error("User not found. Please ensure you are logged in correctly.");
    process.exit(1);
  }
  spinner.success(`Welcome back, ${chalk.bold(user.name || user.email)}!`);

  // ── Mode select ───────────────────────────────────────────────────────────
  const mode = await select({
    message: "What would you like to do?",
    options: [
      { value: "ask",   label: "Ask",   hint: "answer questions about your codebase" },
      { value: "agent", label: "Agent", hint: "autonomously edit files with staged approval" },
      { value: "plan",  label: "Plan",  hint: "generate a plan and run it step by step" },
    ],
  });

  if (isCancel(mode)) {
    outro(chalk.dim("Goodbye!"));
    return;
  }

  // ── DB: create conversation + build dbContext ──────────────────────────────
  const chatService = new ChatService();
  const conversation = await chatService.getOrCreateConversation(user.id, mode);

  /** @type {DbContext} */
  const dbContext = {
    conversationId: conversation.id,
    userId: user.id,
    saveUserMessage: async (content) => {
      await chatService.addMessage(
        conversation.id,
        "user",
        typeof content === "string" ? content : JSON.stringify(content)
      );
    },
    saveAssistantMessage: async (content) => {
      await chatService.addMessage(
        conversation.id,
        "assistant",
        typeof content === "string" ? content : JSON.stringify(content)
      );
    },
    updateTitle: async (title) => {
      await chatService.updateTitle(conversation.id, user.id, title);
    },
    getMessages: async () => {
      const msgs = await chatService.getConversationMessages(conversation.id);
      return chatService.formatMessagesForAI(msgs);
    },
  };

  // ── Dispatch ──────────────────────────────────────────────────────────────
  if (mode === "ask")   await runAskMode(dbContext);
  if (mode === "agent") await runAgentMode(dbContext);
  if (mode === "plan")  await runPlanMode(dbContext);

  outro(chalk.dim("Goodbye!"));
}

export const wakeup = new Command("wakeup")
  .description("Start Mercury AI")
  .action(wakeupCommand);
