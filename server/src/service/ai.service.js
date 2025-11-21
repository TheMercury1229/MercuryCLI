import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, tool } from "ai";
import config from "../config/ai.config.js";
import chalk from "chalk";
export class AIService {
  constructor() {
    if (!config.googleApiKey) {
      throw new Error("Google Generative AI API key is not configured.");
    }
    this.model = google(config.model, {
      apiKey: config.googleApiKey,
    });
  }

  /**
   * Send a message and get streamed response from the AI model.
   * @param {Array} messages
   * @param {Function} onChunk
   * @param {Object} tools - Object with tool names as keys and tool definitions as values
   * @param {Function} onToolCall
   * @return {Promise<Object>}
   */
  async sendMessage(messages, onChunk, tools = undefined, onToolCall = null) {
    try {
      const streamConfig = {
        model: this.model,
        messages: messages,
        system: `You are Mercury AI, a helpful assistant. You have access to several powerful tools that you should use to provide accurate and helpful information.

IMPORTANT: When a user asks for information that could benefit from using tools, you MUST use the appropriate tools. For example:
- For weather, current events, or any real-time information - use web_search
- For calculations, programming help, or code examples - use code_execution  
- For system information like date, time - use system_info

Always explain what tool you're using and why. Use tools proactively to give better answers.`,
      };

      if (tools && typeof tools === "object" && Object.keys(tools).length > 0) {
        streamConfig.tools = tools;
        streamConfig.maxSteps = 5;
        streamConfig.toolChoice = "auto";
        // console.log(
        //   chalk.gray(`Tools available: ${Object.keys(tools).join(", ")}`)
        // );
        // console.log(chalk.gray(`Tool choice: auto, maxSteps: 5`));
      }

      const result = await streamText(streamConfig);
      let fullResponse = "";

      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }

      const toolCalls = [];
      const toolResults = [];

      // Wait for the stream to complete and get final result
      const finalResult = await result.finishReason;
      const usage = await result.usage;

      if (result.steps && Array.isArray(result.steps)) {
        console.log(chalk.gray(`Found ${result.steps.length} steps in result`));
        for (const step of result.steps) {
          if (step.toolCalls && step.toolCalls.length > 0) {
            for (const toolCall of step.toolCalls) {
              toolCalls.push(toolCall);
              if (onToolCall) {
                onToolCall(toolCall);
              }
            }
          }
          if (step.toolResults && step.toolResults.length > 0) {
            toolResults.push(...step.toolResults);
          }
        }
      }

      return {
        content: fullResponse,
        finishReason: finalResult,
        usage: usage,
        toolCalls: toolCalls,
        toolResults: toolResults,
      };
    } catch (error) {
      console.error(chalk.red("Error communicating with AI model:"), error);
      throw error;
    }
  }

  /**
   * Get a non-streamed response from the AI model.
   * @param {Array} messages
   * @param {Object} tools
   * @return {Promise<Object>}
   */
  async getResponse(messages, tools = undefined) {
    let fullResponse = "";
    const result = await this.sendMessage(
      messages,
      (chunk) => {
        fullResponse += chunk;
      },
      tools
    );
    return result.content;
  }
}
