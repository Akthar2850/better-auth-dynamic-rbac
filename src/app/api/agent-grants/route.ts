import { auth } from "@/lib/auth";
import { sqlite } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const agentUserId = request.nextUrl.searchParams.get("agentUserId");
  const resource = request.nextUrl.searchParams.get("resource");

  if (agentUserId) {
    // Return grants for a specific agent (used by invoice page)
    const grants = sqlite
      .prepare("SELECT * FROM agent_access_grant WHERE agentUserId = ?")
      .all(agentUserId);
    return Response.json({ grants });
  }

  if (resource) {
    // Return all grants for a resource (used by admin page)
    if (session.user.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }
    const grants = sqlite
      .prepare("SELECT * FROM agent_access_grant WHERE resource = ?")
      .all(resource);
    return Response.json({ grants });
  }

  return Response.json({ error: "Provide agentUserId or resource param" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json();
  const { agentUserId, targetUserEmail, resource } = body;

  if (!agentUserId || !targetUserEmail || !resource) {
    return Response.json(
      { error: "agentUserId, targetUserEmail, and resource are required" },
      { status: 400 }
    );
  }

  // Check for duplicate grant
  const existing = sqlite
    .prepare(
      "SELECT id FROM agent_access_grant WHERE agentUserId = ? AND targetUserEmail = ? AND resource = ?"
    )
    .get(agentUserId, targetUserEmail, resource);

  if (existing) {
    return Response.json({ error: "Grant already exists" }, { status: 409 });
  }

  const id = `grant-${Date.now()}`;
  sqlite
    .prepare(
      "INSERT INTO agent_access_grant (id, agentUserId, targetUserEmail, resource, grantedBy) VALUES (?, ?, ?, ?, ?)"
    )
    .run(id, agentUserId, targetUserEmail, resource, session.user.id);

  return Response.json({ id, agentUserId, targetUserEmail, resource });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  sqlite.prepare("DELETE FROM agent_access_grant WHERE id = ?").run(id);
  return Response.json({ deleted: true });
}
