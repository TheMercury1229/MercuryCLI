import chalk from "chalk";
import { isCancel, select } from "@clack/prompts";
import { composeBeforeAfter, formatPatch } from "./diff-view.js";
import { renderTerminalMarkdown } from "../../terminal-md.js";

/**
 * @param {import("./action-tracker.js").ActionTracker} tracker
 * @returns {Promise<boolean>}
 */
export async function runApprovalFlow(tracker) {
  const pending = tracker.getPendingMutations();
  if (pending.length === 0) {
    console.log(chalk.dim("\nNo staged changes to review."));
    return false;
  }

  const choice = await select({
    message: "Apply staged changes?",
    options: [
      { value: "all",    label: "Approve and apply all" },
      { value: "review", label: "Review one by one" },
      { value: "cancel", label: "Cancel — discard all changes" },
    ],
  });

  if (isCancel(choice) || choice === "cancel") {
    for (const a of pending) tracker.updateStatus(a.id, "rejected", false);
    return false;
  }

  if (choice === "all") {
    for (const a of pending) tracker.updateStatus(a.id, "approved", true);
    return true;
  }

  // review one by one
  const groups = groupPending(pending);
  for (const group of groups) {
    while (true) {
      const opt = await select({
        message: chalk.bold(group.label),
        options: [
          { value: "accept", label: "Accept" },
          { value: "diff",   label: "Show Diff", hint: group.patch ? "" : "N/A" },
          { value: "reject", label: "Reject" },
        ],
      });
      if (isCancel(opt)) {
        for (const a of pending) tracker.updateStatus(a.id, "rejected", false);
        return false;
      }
      if (opt === "diff") {
        if (group.patch) {
          console.log(
            "\n" + renderTerminalMarkdown("```diff\n" + group.patch + "\n```") + "\n"
          );
        } else {
          console.log(chalk.dim("  (no diff available for this action)"));
        }
        continue;
      }
      for (const id of group.actionIds) {
        tracker.updateStatus(id, opt === "accept" ? "approved" : "rejected", opt === "accept");
      }
      break;
    }
  }

  return tracker.getActions().some((x) => x.status === "approved");
}

/** @param {import("./types.js").ActionLog[]} pending */
function groupPending(pending) {
  const byPath = new Map();
  const shells = [];

  for (const a of pending) {
    if (a.type === "tool_execute") { shells.push(a); continue; }
    if (!byPath.has(a.path)) byPath.set(a.path, []);
    byPath.get(a.path).push(a);
  }

  const groups = [];
  const pathEntries = [...byPath.entries()].sort(([a], [b]) => a.localeCompare(b));

  for (const [p, acts] of pathEntries) {
    const sorted = acts.sort((x, y) => x.timestamp.getTime() - y.timestamp.getTime());
    const ids = sorted.map((x) => x.id);
    if (sorted.every((x) => x.type === "folder_create")) {
      groups.push({ label: `Create folder: ${p}`, actionIds: ids, patch: null });
      continue;
    }
    const { before, after } = composeBeforeAfter(sorted);
    const patch = formatPatch(p, before, after);
    const kinds = [...new Set(sorted.map((x) => x.type))].join(", ");
    groups.push({ label: `${p} (${kinds})`, actionIds: ids, patch });
  }

  for (const s of shells) {
    groups.push({
      label: `Shell: ${s.details.command ?? "(no command)"}`,
      actionIds: [s.id],
      patch: null,
    });
  }

  return groups;
}
