import { google } from "@ai-sdk/google";
import chalk from "chalk";

export const availableTools = [
  {
    id: "google_search",
    name: "Google Search",
    description: "Use this tool to search the web for up-to-date information.",
    getTool: () => google.tools.googleSearch({}),
    enabled: false,
  },
  {
    id: "code_execution",
    name: "Code Execution",
    description: "Use this tool to execute code snippets.",
    getTool: () => google.tools.codeExecution({}),
    enabled: false,
  },
  {
    id: "url_context",
    name: "URL Context",
    description: "Use this tool to provide context from a URL.",
    getTool: () => google.tools.urlContext({}),
    enabled: false,
  },
];

export function getEnabledTools() {
  const tools = {};
  for (const toolConfig of availableTools) {
    if (toolConfig.enabled) {
      tools[toolConfig.id] = toolConfig.getTool();
      console.log(
        chalk.gray(
          `Tool enabled: ${toolConfig.name} - ${toolConfig.description}`
        )
      );
    }
  }
  return Object.keys(tools).length > 0 ? tools : null;
}

export function toggleTool(toolId) {
  const tool = availableTools.find((t) => t.id === toolId);
  if (tool) {
    tool.enabled = !tool.enabled;
    console.log(
      chalk.green(`${tool.enabled ? "Enabled" : "Disabled"} tool: ${tool.name}`)
    );

    return tool.enabled;
  } else {
    console.log(chalk.red(`Tool with id "${toolId}" not found.`));
    return null;
  }
}

export function enableTools(toolIds) {
  availableTools.forEach((tool) => {
    const wasEnabled = tool.enabled;
    tool.enabled = toolIds.includes(tool.id);
    if (tool.enabled !== wasEnabled) {
      console.log(
        chalk.green(
          `${tool.enabled ? "Enabled" : "Disabled"} tool: ${tool.name}`
        )
      );
    }
  });
  const enabledCount = availableTools.filter((t) => t.enabled).length;
  console.log(chalk.gray(`Total enabled tools: ${enabledCount}`));
}

export function getEnabledToolNames() {
  const names = availableTools.filter((t) => t.enabled).map((t) => t.name);
  return names;
}

export function resetTools() {
  availableTools.forEach((tool) => {
    tool.enabled = false;
  });
  console.log(chalk.green("All tools have been disabled."));
}
