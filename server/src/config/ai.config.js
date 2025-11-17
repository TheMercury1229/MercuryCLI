import dotenv from "dotenv";

dotenv.config();

const AI_CONFIG = {
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  model: process.env.MERCURYCLI_MODEL || "gemini-2.5-flash",
};

Object.freeze(AI_CONFIG);

export default AI_CONFIG;
