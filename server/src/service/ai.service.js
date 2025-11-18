import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
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
   * @param {Object} tools
   * @param {Function} onToolCall
   * @return {Promise<Object>}
   */
  async sendMessage(messages, onChunk, tools = undefined, onToolCall = null) {
    try {
      const streamConfig = {
        model: this.model,
        messages: messages,
      };
      const result = await streamText(streamConfig);
      let fullResponse = "";

      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }

      return {
        content: fullResponse,
        finishReason: await result.finishReason,
        usage: await result.usage,
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
    await this.sendMessage(messages, (chunk) => {
      fullResponse += chunk;
    });
    return fullResponse;
  }
}
