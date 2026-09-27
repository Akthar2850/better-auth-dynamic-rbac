import { auth } from "@/lib/auth";
import { sqlite } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const roles = sqlite.prepare("SELECT * FROM role").all() as {
    id: string;
    name: string;
    description: string;
    isSystem: number;
  }[];

  const perms = sqlite
    .prepare("SELECT roleId, resource, action FROM role_permission")
    .all() as { roleId: string; resource: string; action: string }[];

  const permsByRole: Record<string, { resource: string; action: string }[]> = {};
  for (const p of perms) {
    if (!permsByRole[p.roleId]) permsByRole[p.roleId] = [];
    permsByRole[p.roleId].push({ resource: p.resource, action: p.action });
  }

  const result = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem === 1,
    permissions: permsByRole[role.id] || [],
  }));

  return Response.json({ roles: result });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, permissions } = body as {
    name: string;
    description?: string;
    permissions?: { resource: string; action: string }[];
  };

  if (!name || !name.trim()) {
    return Response.json({ error: "Role name is required" }, { status: 400 });
  }

  // Check for duplicate name
  const existing = sqlite
    .prepare("SELECT id FROM role WHERE name = ?")
    .get(name.trim());
  if (existing) {
    return Response.json({ error: "A role with this name already exists" }, { status: 409 });
  }

  const id = `role-${Date.now()}`;

  sqlite
    .prepare("INSERT INTO role (id, name, description, isSystem) VALUES (?, ?, ?, 0)")
    .run(id, name.trim(), description?.trim() || "");

  // Insert permissions
  if (permissions && permissions.length > 0) {
    const insertPerm = sqlite.prepare(
      "INSERT INTO role_permission (id, roleId, resource, action) VALUES (?, ?, ?, ?)"
    );
    let permIdx = 1;
    for (const perm of permissions) {
      insertPerm.run(`${id}-perm-${permIdx++}`, id, perm.resource, perm.action);
    }
  }

  return Response.json({ id, name: name.trim(), description: description?.trim() || "" });
}
