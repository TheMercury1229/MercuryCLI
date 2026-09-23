import { createTwoFilesPatch } from "diff";

/**
 * @param {string} filePath
 * @param {string} before
 * @param {string} after
 */
export function formatPatch(filePath, before, after) {
  return createTwoFilesPatch(filePath, filePath, before, after, "", "", { context: 3 });
}

/**
 * @param {import("./types.js").ActionLog[]} actions
 */
export function composeBeforeAfter(actions) {
  const first = actions[0];
  const last = actions[actions.length - 1];
  if (last?.type === "file_delete") return { before: last.details.before ?? "", after: "" };
  const before = first?.type === "file_create" ? "" : (first?.details.before ?? "");
  const after = last?.details.after ?? "";
  return { before, after };
}
