import { auth } from "@/lib/auth";
import { sqlite } from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role ?? "endUser";

  // Get distinct resources this role can read
  const rows = sqlite
    .prepare(
      "SELECT DISTINCT resource FROM role_permission WHERE roleId = ? AND action = 'read'"
    )
    .all(role) as { resource: string }[];

  const resources = rows.map((r) => r.resource);

  return Response.json({ resources });
}
