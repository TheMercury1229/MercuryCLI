import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, cancel, outro, intro, confirm } from "@clack/prompts";
import { AIService } from "../../service/ai.service.js";
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from "../../lib/token.js";
import yoctoSpinner from "yocto-spinner";
import prisma from "../../lib/db.js";
import { generateApplication } from "../../config/agent.config.js";

const aiService = new AIService();
const chatService = new ChatService(aiService);

async function getUserFromToken() {
  const token = await getStoredToken();
  if (!token || !token.access_token) {
    throw new Error(
      "You must be logged in to chat with AI. Please run 'mercury-cli login' first."
    );
  }
  const spinner = yoctoSpinner({ text: "Authenticating user..." });
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
  if (!user) {
    spinner.error("User not found. Please ensure you are logged in correctly.");
    process.exit(1);
  }
  spinner.success("Welcome back, " + (user.name || user.email) + "! 👋");
  return user;
}

async function initConversation(userId, conversationId = null, mode = "agent") {
  const spinner = yoctoSpinner({ text: "Initializing conversation..." });
  spinner.start();
  const conversation = await chatService.getOrCreateConversation(
    userId,
    mode,
    conversationId
  );
  spinner.success("Conversation initialized.");
  const conversationInfo = boxen(
    `${chalk.bold.green("Conversation")}: ${chalk.white(
      conversation.title
    )} \n${chalk.green("Mode:" + " " + mode)}\n${chalk.green(
      "Mode:" + " AI Agent"
    )}\n${chalk.green("Working Directory:" + " " + process.cwd())}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "magenta",
      title: "💬 Agent Mode",
      titleAlignment: "center",
    }
  );
  console.log(conversationInfo);
  return conversation;
}

async function saveMessage(conversationId, role, content) {
  return await chatService.addMessage(conversationId, role, content);
}

async function agentLoop(conversation, user) {
  const helpBox = boxen(
    `${chalk.magenta.bold("What can the agent do?")}\n\n` +
      `${chalk.gray(
        "- Generate complete applications based on your description."
      )}\n` +
      `${chalk.gray("- Create all necessary files and folders.")}\n` +
      `${chalk.gray("- Include setup instructions and commands.")}\n` +
      `${chalk.gray(
        "- Generate production-ready code with best practices."
      )}\n\n` +
      `${chalk.yellow.bold("Examples:")}\n` +
      `${chalk.gray('- "Build a todo app with react and tailwindcss."')}\n` +
      `${chalk.gray(
        '- "Create a blog application using next.js and markdown."'
      )}\n`,
    +`${chalk.gray(
      '- Make a weather app with React and OpenWeather API."'
    )}\n` + `${chalk.gray('Type "exit" to end the session.')} ')}`,
    {
      padding: 1,
      borderStyle: "round",
      borderColor: "magenta",
      title: "🛠️ Agent Capabilities",
      titleAlignment: "center",
    }
  );
  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.magenta("Describe the application you want to create:"),
      placeholder: "Describe the application....",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Please provide a valid application description.";
        }
        // if (value.trim().length < 10) {
        //   return "Please provide a more detailed description (at least 10 characters).";
        // }
      },
    });
    if (isCancel(userInput) || userInput.toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Agent session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      break;
    }
    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "magenta",
      title: "📝 Your Description",
      titleAlignment: "left",
    });
    console.log(userBox);

    await saveMessage(conversation.id, "user", userInput);
    try {
      const result = await generateApplication(
        userInput,
        aiService,
        process.cwd()
      );
      if (result && result.success) {
        const responseMsg =
          `Generated application: ${result.folderName}\n` +
          `File Created:${result.files.length}\n` +
          `Setup Commands:\n${result.commands.join("\n")}`;

        await saveMessage(conversation.id, "assistant", responseMsg);

        const continuePrompt = await confirm({
          message: chalk.yellow(
            "Application generation completed. Do you want to create another application?"
          ),
          initialValue: true,
        });
        if (!continuePrompt || isCancel(continuePrompt)) {
          console.log(chalk.yellow("\nExiting agent mode. Goodbye! 👋"));
          break;
        }
      } else {
        throw new Error("Generation returned unsuccessful.");
      }
    } catch (error) {
      const errorMsg = `Error generating application: ${error.message}`;
      await saveMessage(conversation.id, "assistant", errorMsg);
      console.log(chalk.red(errorMsg));
      // const retryPrompt = await confirm({
      //   message: chalk.yellow(
      //     "Do you want to try describing the application again?"
      //   ),
      //   initialValue: true,
      // });
      // if (!retryPrompt || isCancel(retryPrompt)) {
      //   console.log(chalk.yellow("\nExiting agent mode. Goodbye! 👋"));
      //   break;
      // }
    }
  }
}

export async function startChatWithAIAgent(conversationId = null) {
  try {
    intro(
      boxen(
        chalk.bold.magenta("Mercury AI - Agent Mode\n\n") +
          chalk.gray("Autonomous application generator"),
        {
          padding: 1,
          borderStyle: "double",
          borderColor: "magenta",
        }
      )
    );

    const user = await getUserFromToken();
    const shouldContinue = await confirm({
      message: chalk.yellow(
        "The agent will create files and folders in the current directory.Continue?"
      ),
      initialValue: true,
    });
    if (isCancel(shouldContinue) || !shouldContinue) {
      cancel(chalk.red("Operation cancelled by the user."));
      process.exit(0);
    }

    const conversation = await initConversation(
      user.id,
      conversationId,
      "agent"
    );
    await agentLoop(conversation, user);
    outro(chalk.green("Thank you for using Mercury AI!"));
  } catch (error) {
    console.log(
      boxen(chalk.red(`Error:${error.message}`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
      })
    );
    process.exit(1);
  }
}
