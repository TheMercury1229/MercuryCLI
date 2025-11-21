import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../../../lib/token.js";
import prisma from "../../../lib/db.js";
import { select } from "@clack/prompts";
import { startChatWithAI } from "../../chat/chatwithai.js";
import { startToolChat } from "../../chat/chatwithtools.js";

export async function wakeupCommand() {
  const token = getStoredToken();
  if (!token) {
    console.log(
      chalk.red(
        "You must be logged in to wake up the AI service. Please run 'mercury-cli login' first."
      )
    );
    process.exit(1);
  }

  const spinner = yoctoSpinner({ text: "Waking up the AI service..." });
  spinner.start();
  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: {
          token: token.access_token,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });
  spinner.stop();
  if (!user) {
    console.log(
      chalk.red("User not found. Please ensure you are logged in correctly.")
    );
    process.exit(1);
  }
  console.log(
    chalk.green(
      `AI service is awake and ready to assist you, ${user.name || user.email}!`
    )
  );

  const choice = await select({
    message: "Select an Option:",
    options: [
      {
        value: "chat",
        label: "Chat with AI",
        hint: "Start a conversation with the AI",
      },
      {
        value: "tool",
        label: "Use AI Tool",
        hint: "Chat with tools (e.g. Google Search,Code execution)",
      },
      {
        value: "agent",
        label: "Agentic Mode",
        hint: "Advanced AI agent",
      },
    ],
  });
  switch (choice) {
    case "chat":
      startChatWithAI("chat");
      break;
    case "tool":
      startToolChat("tool");
      break;
    case "agent":
      console.log(chalk.blue("Starting agentic mode..."));
      break;
    default:
      console.log(chalk.red("Invalid choice. Exiting."));
      process.exit(1);
  }
}
export const wakeup = new Command("wakeup")
  .description("Wake up the AI service and prepare for interaction")
  .action(wakeupCommand);
