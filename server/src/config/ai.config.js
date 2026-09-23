import dotenv from "dotenv";

dotenv.config();

const AI_CONFIG = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.OPENROUTER_DEFAULT_MODEL || "openrouter/auto",
};

Object.freeze(AI_CONFIG);

export default AI_CONFIG;
