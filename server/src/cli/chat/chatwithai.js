import chalk from "chalk";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { intro, isCancel, outro, text } from "@clack/prompts";
import boxen from "boxen";
import { AIService } from "../../service/ai.service.js";
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from "../../lib/token.js";
import prisma from "../../lib/db.js";
import yoctoSpinner from "yocto-spinner";
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

function displayMessages(messages) {
  if (!messages || !Array.isArray(messages)) return;

  messages.forEach((message) => {
    if (!message) return;

    if (message.role === "user") {
      const userBox = boxen(chalk.white(message.content || ""), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: "👤 You",
        titleAlignment: "left",
      });
      console.log(userBox);
    } else {
      const renderedContent = marked.parse(message.content || "");
      const aiBox = boxen(renderedContent, {
        padding: 1,
        margin: { right: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 MercuryAI",
        titleAlignment: "left",
      });
      console.log(aiBox);
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

async function getAIResponse(conversationId, messages = null) {
  const spinner = yoctoSpinner({
    text: "✨ MercuryAI is thinking...",
    color: "cyan",
  }).start();

  let dbMessages = messages;
  if (!dbMessages) {
    dbMessages = await chatService.getConversationMessages(conversationId);
  }

  if (!dbMessages || dbMessages.length === 0) {
    spinner.error("No messages found in conversation.");
    throw new Error("No messages to process");
  }

  const aiMessages = await chatService.formatMessagesForAI(dbMessages);

  if (!aiMessages || !Array.isArray(aiMessages) || aiMessages.length === 0) {
    spinner.error("Failed to format messages for AI.");
    throw new Error("Invalid message format");
  }

  let fullResponse = "";
  let isFirstChunk = true;
  try {
    const result = await aiService.sendMessage(aiMessages, async (chunk) => {
      fullResponse += chunk;
      if (isFirstChunk) {
        spinner.stop();
        console.log("\n");
        const header = chalk.green.bold("🤖 MercuryAI: ");
        console.log(header);
        console.log(chalk.gray("-".repeat(50)));
        isFirstChunk = false;
      }
    });
    const renderedMarkdown = marked.parse(fullResponse);
    console.log(renderedMarkdown);
    console.log(chalk.gray("-".repeat(50)));
    return result?.content || "";
  } catch (error) {
    spinner.error("Failed to get response from MercuryAI.");
    throw error;
  }
}

async function chatLoop(conversation) {
  const helpBox = boxen(
    `${chalk.gray("✅ Type your message and press Enter")}\n${chalk.gray(
      "❓ Markdown formatting is supported in responses"
    )}\n${chalk.gray('🚪 Type "exit" to end the chat')}\n${chalk.gray(
      "✨ Press Ctrl+C to quit anytime"
    )}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
      dimBorder: true,
    }
  );
  console.log(helpBox);
  while (true) {
    const userInput = await text({
      message: chalk.blue("Your Message:"),
      placeholder: "Type your message here...",
      validate(value) {
        if (!value || typeof value !== "string" || value.trim().length === 0) {
          return "Message cannot be empty.";
        }
      },
    });
    if (isCancel(userInput) || userInput.toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      break;
    }

    await saveMessage(conversation.id, "user", userInput);

    // Get updated messages after saving user input
    const messages = await chatService.getConversationMessages(conversation.id);

    const aiResponse = await getAIResponse(conversation.id, messages);
    await saveMessage(conversation.id, "assistant", aiResponse);
    await updateConversationTitle(
      conversation.id,
      userInput,
      messages?.length || 0
    );
  }
}
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

async function initConversation(userId, mode = "chat", conversationId = null) {
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
    )} \n${chalk.gray("Mode:" + " " + mode)}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "green",
      title: "💬 Chat Session",
      titleAlignment: "center",
    }
  );
  console.log(conversationInfo);
  if (conversation?.messages && conversation.messages.length > 0) {
    console.log(chalk.yellow("Previous messages :\n"));
    displayMessages(conversation.messages);
  }
  return conversation;
}
export async function startChatWithAI(mode = "chat", conversationId = null) {
  try {
    intro(
      boxen(chalk.bold.cyan("Welcome to Mercury AI Chat!"), {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "cyan",
      })
    );

    const user = await getUserFromToken();
    const conversation = await initConversation(user.id, mode, conversationId);

    await chatLoop(conversation);

    outro(chalk.green("✨ Thank you for using Mercury AI Chat! ✨"));
  } catch (error) {
    const errorBox = boxen(chalk.red.bold(`Error: ${error.message}`), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    });
    console.error(errorBox);
    process.exit(1);
  }
}
