import { auth } from "@/lib/auth";
import { sqlite } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role ?? "endUser";

  const body = await request.json();
  const checks: { resource: string; action: string }[] = body.checks;

  if (!Array.isArray(checks) || checks.length === 0) {
    return Response.json({ error: "checks array is required" }, { status: 400 });
  }

  // Get all permissions for this role in one query
  const perms = sqlite
    .prepare("SELECT resource, action FROM role_permission WHERE roleId = ?")
    .all(role) as { resource: string; action: string }[];

  const permSet = new Set(perms.map((p) => `${p.resource}:${p.action}`));

  const results: Record<string, boolean> = {};
  for (const check of checks) {
    results[`${check.resource}:${check.action}`] = permSet.has(
      `${check.resource}:${check.action}`
    );
  }

  return Response.json({ results });
}
