"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // The address your browser uses to reach the app. Set in .env.
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3007",
  plugins: [
    adminClient(),
    organizationClient(),
  ],
});
