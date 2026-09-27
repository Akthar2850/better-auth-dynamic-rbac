import { auth } from "@/lib/auth";
import { sqlite } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

type RouteContext = { params: Promise<{ roleId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { roleId } = await context.params;

  const role = sqlite.prepare("SELECT * FROM role WHERE id = ?").get(roleId) as {
    id: string;
    name: string;
    description: string;
    isSystem: number;
  } | undefined;

  if (!role) {
    return Response.json({ error: "Role not found" }, { status: 404 });
  }

  const perms = sqlite
    .prepare("SELECT resource, action FROM role_permission WHERE roleId = ?")
    .all(roleId) as { resource: string; action: string }[];

  return Response.json({
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem === 1,
    permissions: perms,
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const { roleId } = await context.params;

  const role = sqlite.prepare("SELECT * FROM role WHERE id = ?").get(roleId) as {
    id: string;
    name: string;
    isSystem: number;
  } | undefined;

  if (!role) {
    return Response.json({ error: "Role not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, description, permissions } = body as {
    name?: string;
    description?: string;
    permissions?: { resource: string; action: string }[];
  };

  // Update role name/description (system roles can have description updated but not name)
  if (name && name.trim() !== role.name) {
    if (role.isSystem === 1) {
      return Response.json({ error: "Cannot rename system roles" }, { status: 400 });
    }
    // Check for duplicate name
    const existing = sqlite
      .prepare("SELECT id FROM role WHERE name = ? AND id != ?")
      .get(name.trim(), roleId);
    if (existing) {
      return Response.json({ error: "A role with this name already exists" }, { status: 409 });
    }
    sqlite.prepare("UPDATE role SET name = ? WHERE id = ?").run(name.trim(), roleId);
  }

  if (description !== undefined) {
    sqlite.prepare("UPDATE role SET description = ? WHERE id = ?").run(description.trim(), roleId);
  }

  // Replace permissions if provided
  if (permissions !== undefined) {
    sqlite.prepare("DELETE FROM role_permission WHERE roleId = ?").run(roleId);
    const insertPerm = sqlite.prepare(
      "INSERT INTO role_permission (id, roleId, resource, action) VALUES (?, ?, ?, ?)"
    );
    let permIdx = 1;
    for (const perm of permissions) {
      insertPerm.run(`${roleId}-perm-${permIdx++}`, roleId, perm.resource, perm.action);
    }
  }

  return Response.json({ success: true });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const { roleId } = await context.params;

  const role = sqlite.prepare("SELECT * FROM role WHERE id = ?").get(roleId) as {
    id: string;
    isSystem: number;
  } | undefined;

  if (!role) {
    return Response.json({ error: "Role not found" }, { status: 404 });
  }

  if (role.isSystem === 1) {
    return Response.json({ error: "Cannot delete system roles" }, { status: 400 });
  }

  // Check if any users are assigned to this role
  const usersWithRole = sqlite
    .prepare("SELECT COUNT(*) as count FROM user WHERE role = ?")
    .get(roleId) as { count: number };

  if (usersWithRole.count > 0) {
    return Response.json(
      { error: `Cannot delete role: ${usersWithRole.count} user(s) are still assigned to it` },
      { status: 400 }
    );
  }

  // ON DELETE CASCADE will remove role_permission rows too
  sqlite.prepare("DELETE FROM role WHERE id = ?").run(roleId);

  return Response.json({ deleted: true });
}
