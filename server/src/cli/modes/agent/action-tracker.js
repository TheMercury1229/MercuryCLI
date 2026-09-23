import { isMutationType } from "./types.js";

export class ActionTracker {
  /** @type {import("./types.js").ActionLog[]} */
  #actions = [];

  /**
   * @param {Omit<import("./types.js").ActionLog, "id"|"timestamp"> & { id?: string, timestamp?: Date }} entry
   */
  log(entry) {
    const action = {
      id: entry.id ?? `action_${this.#actions.length + 1}`,
      timestamp: entry.timestamp ?? new Date(),
      type: entry.type,
      path: entry.path,
      details: { ...entry.details },
      status: entry.status,
      userApproved: entry.userApproved,
    };
    this.#actions.push(action);
    return action;
  }

  getActions() {
    return this.#actions;
  }

  getPendingMutations() {
    return this.#actions.filter(
      (a) => a.status === "pending" && isMutationType(a.type)
    );
  }

  /**
   * @param {string} id
   * @param {import("./types.js").ActionStatus} status
   * @param {boolean} [userApproved]
   */
  updateStatus(id, status, userApproved) {
    const action = this.#actions.find((a) => a.id === id);
    if (!action) return;
    action.status = status;
    if (userApproved !== undefined) action.userApproved = userApproved;
  }
}
