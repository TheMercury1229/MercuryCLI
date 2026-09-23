import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import config from "./ai.config.js";

export function getAgentModel() {
  const provider = createOpenRouter({ apiKey: config.openrouterApiKey });
  return provider(config.model);
}
