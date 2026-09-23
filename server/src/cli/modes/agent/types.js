/**
 * @typedef {"file_create"|"file_modify"|"file_delete"|"folder_create"|"code_analysis"|"tool_execute"} ActionType
 * @typedef {"pending"|"executed"|"approved"|"rejected"} ActionStatus
 *
 * @typedef {Object} ActionLog
 * @property {string} id
 * @property {Date} timestamp
 * @property {ActionType} type
 * @property {string} path
 * @property {{ before?: string, after?: string, toolName?: string, toolResult?: string, error?: string, command?: string }} details
 * @property {ActionStatus} status
 * @property {boolean} [userApproved]
 *
 * @typedef {Object} AgentConfig
 * @property {string} codebasePath
 * @property {number} maxFileSizeToRead
 * @property {string[]} excludePatterns
 * @property {{ allowShellExecution: boolean, allowFileModification: boolean, allowFileCreation: boolean, allowFolderCreation: boolean }} tools
 */

export function defaultAgentConfig() {
  return {
    codebasePath: process.cwd(),
    maxFileSizeToRead: 1024 * 1024,
    excludePatterns: [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      "*.log",
      ".env*",
      ".venv",
      "venv",
      ".idea",
    ],
    tools: {
      allowShellExecution: true,
      allowFileModification: true,
      allowFileCreation: true,
      allowFolderCreation: true,
    },
  };
}

/**
 * @param {ActionType} t
 * @returns {boolean}
 */
export function isMutationType(t) {
  return (
    t === "file_create" ||
    t === "file_modify" ||
    t === "file_delete" ||
    t === "folder_create" ||
    t === "tool_execute"
  );
}
