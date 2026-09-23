import { multiselect, isCancel } from "@clack/prompts";
import chalk from "chalk";
import { renderTerminalMarkdown } from "../../terminal-md.js";

const COMPLEXITY_COLOR = {
  low:    chalk.green("low"),
  medium: chalk.yellow("medium"),
  high:   chalk.red("high"),
};

/**
 * @param {import("./types.js").Plan} plan
 */
export function printPlan(plan) {
  if (plan.researchSummary?.trim()) {
    console.log(chalk.bold("\nResearch Summary"));
    console.log(renderTerminalMarkdown(plan.researchSummary));
  }
  console.log(chalk.bold("\nGenerated Plan\n"));
  for (const [i, s] of plan.steps.entries()) {
    const tag = s.complexity ? `[${COMPLEXITY_COLOR[s.complexity]}]` : "";
    console.log(
      `  ${chalk.cyan(`Step ${String(i + 1).padStart(2)}`)}.`,
      chalk.bold(s.title),
      tag
    );
  }
  console.log();
}

/**
 * @param {import("./types.js").Plan} plan
 * @returns {Promise<import("./types.js").PlanStep[]>}
 */
export async function selectSteps(plan) {
  const options = plan.steps.map((s) => ({
    value: s.id,
    label: s.title,
    hint: s.complexity ?? "",
  }));

  const picked = await multiselect({
    message: "Select steps to execute (space to toggle, enter to confirm)",
    options,
    initialValues: plan.steps.map((s) => s.id),
    required: false,
  });

  if (isCancel(picked)) return [];
  const set = new Set(picked);
  return plan.steps.filter((s) => set.has(s.id));
}
