#!/usr/bin/env node
import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";

import { Command } from "commander";
import { login } from "./commands/auth/login.js";
import { logout } from "./commands/auth/logout.js";
import { whoami } from "./commands/auth/me.js";
import { wakeup } from "./commands/ai/wakeup.js";
// dotenv.config();

async function main() {
  //Display Banner
  console.log(
    chalk.cyan(
      figlet.textSync("Mercury CLI", {
        horizontalLayout: "default",
        font: "Standard",
      })
    )
  );

  console.log(chalk.gray("A CLI based AI Tool"));

  const program = new Command("mercury-cli");
  program
    .version("0.0.1")
    .description("Mercury CLI - A CLI based AI Tool")
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami)
    .addCommand(wakeup);

  program.action(() => {
    program.help();
  });
  program.parse();
}
main().catch((err) => {
  console.log(chalk.red("Error starting the CLI:"), err);
  process.exit(1);
});
