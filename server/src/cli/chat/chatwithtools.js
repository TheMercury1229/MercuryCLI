import chalk from "chalk";
import boxen from "boxen";
import {
  text,
  isCancel,
  cancel,
  intro,
  outro,
  multiselect,
} from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../../service/ai.service.js";
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from "../../lib/token.js";
import prisma from "../../lib/db.js";
import {
  getEnabledTools,
  toggleTool,
  availableTools,
  getEnabledToolNames,
  resetTools,
  enableTools,
} from "../../config/tool.config.js";

marked.use(
  markedTerminal({
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.bold.underline,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline,
  })
);

const aiService = new AIService();
const chatService = new ChatService();

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

async function selectTools() {
  const toolOptions = availableTools.map((tool) => ({
    value: tool.id,
    label: tool.name,
    hint: tool.description,
  }));
  const selectedTools = await multiselect({
    message: chalk.cyan(
      "Select the tools you want to enable for this session:"
    ),
    options: toolOptions,
    required: false,
  });
  if (isCancel(selectedTools)) {
    cancel(chalk.yellow("Tool selection cancelled. Exiting..."));
    process.exit(0);
  }

  enableTools(selectedTools);
  if (selectedTools.length === 0) {
    console.log(chalk.yellow("No tools selected. Proceeding without tools."));
  } else {
    console.log(
      boxen(
        chalk.green(
          `Enabled tools:\n${selectedTools
            .map((id) => {
              const tool = availableTools.find((t) => t.id === id);
              return `- ${tool.name}: ${tool.description}`;
            })
            .join("\n")}`
        ),
        {
          padding: 1,
          margin: { top: 1, bottom: 1 },
          borderStyle: "round",
          borderColor: "green",
          title: "🔨 Mercury AI - Tool Calling Mode",
          titleAlignment: "center",
        }
      )
    );
  }

  return selectedTools.length > 0;
}

function displayMessages(messages) {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { top: 1, bottom: 1, left: 0, right: 20 },
        borderStyle: "round",
        borderColor: "blue",
        title: "👤 You",
        titleAlignment: "left",
      });
      console.log(userBox);
    } else if (msg.role === "assistant") {
      const renderedContent = marked.parse(msg.content);
      const assistantBox = boxen(renderedContent, {
        padding: 1,
        margin: { top: 1, bottom: 1, left: 20, right: 0 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 MercuryAI",
        titleAlignment: "left",
      });
      console.log(assistantBox);
    }
  });
}

async function saveMessage(conversationId, role, content) {
  return await chatService.addMessage(conversationId, role, content);
}

async function updateConversationTitle(
  conversationId,
  userInput,
  messageCount
) {
  if (messageCount === 1 && userInput) {
    const title = userInput.slice(0, 50) + (userInput.length > 50 ? "..." : "");
    await chatService.updateTitle(conversationId, title);
  }
}

async function chatLoop(conversation) {
  const enabledToolNames = getEnabledToolNames();
  const helpBox = boxen(
    `${chalk.green.bold("💬 Type Your Message and press Enter")}\n${chalk.gray(
      "💬 AI has access to :"
    )}${
      enabledToolNames.length > 0 ? enabledToolNames.join(",") : "No tools"
    }\n${chalk.gray(
      "❓ Type 'help' for assistance or 'exit' to quit."
    )}\n${chalk.gray("🛠️  Press Ctrl+C to quit anytime")}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
      dimBorder: true,
    }
  );
  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.cyan("Your message:"),
      placeholder: "Type your message here...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Message cannot be empty.";
        }
      },
    });
    if (isCancel(userInput) || userInput.toLowerCase() === "exit") {
      cancel(boxen(chalk.yellow("Exiting chat. Goodbye!")));
      break;
    }

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { left: 2, top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "👤 You",
      titleAlignment: "left",
    });
    console.log(userBox);
    await saveMessage(conversation.id, "user", userInput);

    // Get updated messages after saving user input
    const messages = await chatService.getConversationMessages(conversation.id);

    const enabledTools = getEnabledTools();
    const aiResponse = await getAIResponse(
      conversation.id,
      messages,
      enabledTools
    );
    await saveMessage(conversation.id, "assistant", aiResponse);
    await updateConversationTitle(
      conversation.id,
      userInput,
      messages?.length || 0
    );
  }
}
async function getAIResponse(
  conversationId,
  messages = null,
  enabledTools = []
) {
  const spinner = yoctoSpinner({
    text: "✨ MercuryAI is thinking...",
    color: "cyan",
  }).start();
  console.log("\n");
  const dbMessages = await chatService.getConversationMessages(conversationId);
  const aiMessages = chatService.formatMessagesForAI(dbMessages);
  const tools = getEnabledTools();
  let fullResponse = "";
  let isFirstChunk = true;
  const toolCallDetected = [];
  try {
    const result = await aiService.sendMessage(
      aiMessages,
      (chunk) => {
        if (isFirstChunk) {
          spinner.stop();
          console.log("\n");
          const header = chalk.green.bold("🤖 MercuryAI: ");
          console.log(header);
          console.log(chalk.gray("-".repeat(50)));
          isFirstChunk = false;
        }
        fullResponse += chunk;
      },
      tools,
      (toolCall) => {
        toolCallDetected.push(toolCall);
      }
    );
    if (toolCallDetected.length > 0) {
      console.log("\n");
      const toolCallBox = boxen(
        toolCallDetected
          .map(
            (tc) =>
              `${chalk.yellow.bold("🛠️ Tool Call:")} ${chalk.white(
                tc.toolName
              )} \n: ${chalk.gray("Args:")}${JSON.stringify(
                tc.toolArgs,
                null,
                2
              )}`
          )
          .join("\n\n"),
        {
          padding: 1,
          margin: { top: 1, bottom: 1 },
          borderStyle: "round",
          borderColor: "yellow",
          title: "🛠️ Tool Calls",
        }
      );
      console.log(toolCallBox);
    }
    if (result.toolResults && result.toolResults.length > 0) {
      const toolResultBox = boxen(
        result.toolResults
          .map(
            (tr) =>
              `${chalk.green("✅ Tool Result:")} ${chalk.white(
                tr.toolName
              )} \n: ${chalk.gray("Result:")}${JSON.stringify(
                tr.result,
                null,
                2
              ).slice(0, 600)}`
          )
          .join("\n\n"),
        {
          padding: 1,
          margin: { top: 1, bottom: 1 },
          borderStyle: "round",
          borderColor: "green",
          title: "✅ Tool Results",
        }
      );
      console.log(toolResultBox);
    }
    console.log("\n");
    const renderedMarkdown = marked.parse(fullResponse);
    console.log(renderedMarkdown);
    console.log(chalk.gray("-".repeat(50)));
    spinner.stop();
    return result.content;
  } catch (error) {
    spinner.error("Failed to get response from MercuryAI.");
    throw error;
  }
}
async function initConversation(userId, conversationId = null, mode = "tool") {
  const spinner = yoctoSpinner({
    text: "Initializing conversation...",
  }).start();
  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    mode
  );
  const enabledToolNames = getEnabledToolNames();
  spinner.success("Conversation initialized !");
  const toolsDisplay =
    enabledToolNames.length > 0
      ? `\n${chalk.gray("Active Tools:")} ${enabledToolNames.join(", ")}`
      : `\n${chalk.gray("No tools active.")}`;

  const conversationIntro = boxen(
    `${chalk.green.bold("☁️ Conversation")}: ${
      conversation.title
    }\n${chalk.gray("Mode: " + conversation.mode)}${toolsDisplay}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "green",
      title: "🔨 Mercury AI - Tool Calling Mode",
      titleAlignment: "center",
    }
  );
  console.log(conversationIntro);
  if (conversation.messages?.length > 0) {
    console.log(chalk.yellow("📜 Previous Messages:\n"));
    displayMessages(conversation.messages);
  }
  return conversation;
}

export async function startToolChat(conversationId = null) {
  try {
    intro(chalk.bold.cyan("🔨 Mercury AI - Tool Calling Mode"), {
      padding: 1,
      borderStyle: "double",
      borderColor: "cyan",
    });

    const user = await getUserFromToken();
    await selectTools();

    const conversation = await initConversation(
      user.id,
      conversationId,
      "tool"
    );
    await chatLoop(conversation);

    resetTools();
    outro(chalk.green.bold("👋 Goodbye! Thanks for using Mercury AI."));
  } catch (error) {
    const errorBox = boxen(
      chalk.red.bold("Error: ") + chalk.white(error.message),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "red",
      }
    );
    console.log(errorBox);
    process.exit(1);
  }
}
