/**
 * @typedef {Object} PlanStep
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string[]} [hints]
 * @property {"low"|"medium"|"high"} [complexity]
 *
 * @typedef {Object} Plan
 * @property {string} goal
 * @property {string} [researchSummary]
 * @property {PlanStep[]} steps
 */
