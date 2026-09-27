"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRoleName } from "@/lib/use-role-name";

export default function TopHeader() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const roleId = (session?.user as { role?: string })?.role ?? "endUser";
  const roleName = useRoleName(roleId);

  // The session is only available in the browser, so the server renders an
  // empty header. Hold the first client render to match it, then fill in.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-red-500",
    agent: "bg-blue-500",
    endUser: "bg-green-600",
  };

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <header className="h-14 bg-header-bg flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        {mounted && session && (
          <>
            <span className="text-header-text text-sm">
              {session.user.name}
            </span>
            <span
              className={`${roleBadgeColor[roleId] ?? "bg-purple-500"} text-white text-xs px-2.5 py-0.5 rounded-full font-medium`}
            >
              {roleName}
            </span>
            <button
              onClick={handleSignOut}
              className="text-header-text text-sm hover:text-white transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
