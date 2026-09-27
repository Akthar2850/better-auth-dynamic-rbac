import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { sqlite } from "./db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3007",
  // Extra origins allowed to call the auth API, e.g. when opening the app from
  // another machine on your network. Comma-separated; set in .env.
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: sqlite,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    adminPlugin({
      defaultRole: "endUser",
    }),
    organization({
      dynamicAccessControl: { enabled: true },
    }),
  ],
});
