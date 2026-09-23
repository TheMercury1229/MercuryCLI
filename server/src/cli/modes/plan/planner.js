import { z } from "zod";
import { defaultAgentConfig } from "../agent/types.js";
import { ActionTracker } from "../agent/action-tracker.js";
import { ToolExecutor } from "../agent/tool-executor.js";
import { planModeTools } from "./plan-tools.js";
import chalk from "chalk";
import {
  extractJsonMiddleware,
  generateText,
  Output,
  stepCountIs,
  wrapLanguageModel,
} from "ai";
import { getAgentModel } from "../../../config/agent-model.js";
import { createWebTools } from "../web-tools.js";

const planSchema = z.object({
  researchSummary: z.string().optional(),
  steps: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        hints: z.array(z.string()).optional(),
        complexity: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .min(1)
    .max(15),
});

const PLAN_INSTRUCTIONS = (codebase, hasWeb) =>
  [
    "You are a Plan-Mode planner. You DO NOT modify files.",
    `Workspace: ${codebase}`,
    "Use read-only tools for codebase/skills research.",
    hasWeb
      ? "Web tools are available (web_search/web_crawl/fetch_url). Use only when needed."
      : "Web tools are unavailable (no FIRECRAWL_API_KEY).",
    "Output must match the provided JSON schema.",
    "Keep it short: 1-15 steps.",
  ].join("\n");

/**
 * @param {string} goal
 * @returns {Promise<import("./types.js").Plan>}
 */
export async function generatePlan(goal) {
  const config = defaultAgentConfig();
  const tracker = new ActionTracker();
  const hasWeb = !!process.env.FIRECRAWL_API_KEY;
  const executor = new ToolExecutor(tracker, config);
  const model = wrapLanguageModel({
    model: getAgentModel(),
    middleware: extractJsonMiddleware(),
  });
  const tools = {
    ...planModeTools(executor),
    ...(hasWeb ? createWebTools(tracker) : {}),
  };

  console.log(chalk.cyan(`\nGenerating plan for goal: ${goal}\n`));

  const result = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(20),
    system: PLAN_INSTRUCTIONS(config.codebasePath, hasWeb),
    prompt: `User Goal: ${goal}\n\n:`,
    output: Output.object({ schema: planSchema }),
  });

  const validated = planSchema.parse(result.output);
  const steps = validated.steps.map((step, index) => ({
    id: `step-${index + 1}`,
    title: step.title,
    description: step.description,
    hints: step.hints,
    complexity: step.complexity,
  }));

  return { goal, researchSummary: validated.researchSummary, steps };
}
