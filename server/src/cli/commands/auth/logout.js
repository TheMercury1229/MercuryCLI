import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import chalk from "chalk";
import { Command } from "commander";

import dotenv from "dotenv";
import { clearStoredToken, getStoredToken } from "../../../lib/token.js";

dotenv.config();

async function logoutAction() {
  intro(chalk.bold("🔒 MercuryCLI Logout"));
  const token = await getStoredToken();
  if (!token) {
    console.log(chalk.yellow("You are not logged in."));
    outro("Logout Aborted");
    process.exit(0);
  }

  const shouldLogout = await confirm({
    message: "Are you sure you want to log out?",
    initialValue: false,
  });
  if (isCancel(shouldLogout) || !shouldLogout) {
    cancel("Logout Cancelled");
    process.exit(0);
  }
  const cleared = await clearStoredToken();
  if (cleared) {
    console.log(chalk.green("Successfully logged out."));
    outro("Goodbye!");
  } else {
    console.log(chalk.red("Error logging out. Please try again."));
    outro("Logout Failed");
    process.exit(1);
  }
}

//Commander
export const logout = new Command("logout")
  .description("Log out the currently authenticated user")
  .action(logoutAction);
