import chalk from "chalk";
import { Command } from "commander";
import dotenv from "dotenv";
import prisma from "../../../lib/db.js";
import { requireAuth } from "../../../lib/token.js";

dotenv.config();
async function whoamiAction(opts) {
  const token = await requireAuth();
  if (!token.access_token) {
    console.log("You are not logged in.");
    process.exit(1);
  }
  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: {
          token: token.access_token,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  //Output user info
  if (user) {
    console.log(
      chalk.bold.greenBright(`\n👤 User: ${user.name} 📧 Email: ${user.email}`)
    );
  }
}

export const whoami = new Command("whoami")
  .description("Display the currently authenticated user")
  .option(
    "--server-url <url>",
    "Authentication server URL",
    process.env.BETTER_AUTH_URL
  )
  .action(whoamiAction);
