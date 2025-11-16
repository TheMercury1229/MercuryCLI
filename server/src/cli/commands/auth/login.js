import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";

import chalk from "chalk";
import { Command } from "commander";
import open from "open";

import yoctoSpinner from "yocto-spinner";
import * as z from "zod";
import dotenv from "dotenv";
import prisma from "../../../lib/db.js";
import {
  getStoredToken,
  isTokenExpired,
  storeToken,
} from "../../../lib/token.js";

dotenv.config();

const URL = process.env.BETTER_AUTH_URL || "http://localhost:3005";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
async function loginAction(opts) {
  const options = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional(),
  });
  const parsedOpts = options.parse(opts);
  const serverUrl = parsedOpts.serverUrl || URL;
  const clientId = parsedOpts.clientId || CLIENT_ID;

  intro(chalk.bold("🔒 MercuryCLI Login"));

  const existingToken = await getStoredToken();
  const expired = await isTokenExpired();

  if (existingToken && !expired) {
    const shouldReAuth = await confirm({
      message: "You are already logged in. Do you want to re-authenticate?",
      initialValue: false,
    });

    if (isCancel(shouldReAuth) || !shouldReAuth) {
      cancel("Login Cancelled");
      process.exit(0);
    }
  }
  const authClient = createAuthClient({
    baseURL: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });
  const spinner = yoctoSpinner({ text: "Requesting device authorization..." });
  spinner.start();
  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });
    spinner.stop();
    if (error || !data) {
      logger.error(
        `Failed to initiate device authorization:${error.error_description}`
      );
      process.exit(1);
    }
    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      expires_in,
      interval = 5,
    } = data;
    console.log(chalk.green("Device Authorization Required!"));
    console.log(
      `Please visit:${chalk.underline.blue(
        verification_uri || verification_uri_complete
      )}`
    );
    console.log(`Enter the code: ${chalk.bold.greenBright(user_code)}`);

    const shouldOpen = await confirm({
      message: "Open in your browser?",
      initialValue: true,
    });
    if (!isCancel(shouldOpen) && shouldOpen) {
      await open(verification_uri || verification_uri_complete);
    }
    console.log(
      chalk.gray(
        `Waiting for authorization (expires in ${expires_in / 60} minutes)...`
      )
    );

    const token = await pollForToken(
      authClient,
      device_code,
      clientId,
      interval
    );
    if (token) {
      const saved = await storeToken(token);
      if (!saved) {
        console.log(
          chalk.yellow("Warning: Could not save authentication token.")
        );
        console.log(chalk.yellow("You may need to login again next time."));
      }
      //TODO:USER DATA
      //   const user = await pri

      outro(chalk.green("✅ Login successful!"));
      console.log(chalk.gray("You can now use MercuryCLI features."));
      process.exit(0);
    }
  } catch (error) {
    spinner.stop();
    console.error("Error:", error);
    logger.error(`Device authorization failed: ${error.message}`);
    process.exit(1);
  }
}

async function pollForToken(authClient, deviceCode, clientId, interval) {
  let pollingInterval = interval;
  const spinner = yoctoSpinner({ text: "", color: "cyan" });
  let dots = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      dots = (dots + 1) % 4;
      spinner.text = `Polling for authorization${".".repeat(dots)}${" ".repeat(
        3 - dots
      )}`;
      if (!spinner.isSpinning) spinner.start();
      try {
        const { data, error } = await authClient.device.token({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: clientId,
          fetchOptions: {
            headers: {
              "user-agent": `Mercury CLI`,
            },
          },
        });
        if (data?.access_token) {
          spinner.stop();
          resolve(data);
          return;
        } else if (error) {
          switch (error.error) {
            case "authorization_pending":
              // Continue polling
              break;
            case "slow_down":
              pollingInterval += 5;
              break;
            case "access_denied":
              console.error("Access was denied by the user");
              return;
            case "expired_token":
              console.error("The device code has expired. Please try again.");
              return;
            default:
              spinner.stop();
              logger.error(`Error: ${error.error_description}`);
              process.exit(1);
          }
        }
      } catch (error) {
        spinner.stop();
        logger.error(`Network error: ${error.message}`);
        process.exit(1);
      }
      setTimeout(poll, pollingInterval * 1000);
    };
    setTimeout(poll, pollingInterval * 1000);
  });
}

export const login = new Command("login")
  .description("Login to MercuryCLI")
  .option("--server-url <url>", "The authentication server URL", URL)
  .option("--client-id <id>", "The OAuth client ID", CLIENT_ID)
  .action(loginAction);
