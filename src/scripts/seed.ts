import { auth } from "../lib/auth";
import { sqlite } from "../lib/db";

const headers = new Headers({
  "Content-Type": "application/json",
  Origin: "http://localhost:3007",
});

async function signUp(name: string, email: string, password: string) {
  const res = await auth.handler(
    new Request("http://localhost:3007/api/auth/sign-up/email", {
      method: "POST",
      headers,
      body: JSON.stringify({ name, email, password }),
    })
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Sign-up ${email} failed: ${JSON.stringify(data)}`);
  return data;
}

async function signIn(email: string, password: string) {
  const res = await auth.handler(
    new Request("http://localhost:3007/api/auth/sign-in/email", {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    })
  );
  if (!res.ok) throw new Error(`Sign-in ${email} failed`);
  const cookies = res.headers.getSetCookie();
  return new Headers({
    "Content-Type": "application/json",
    Origin: "http://localhost:3007",
    Cookie: cookies.join("; "),
  });
}

async function main() {
  // Create agent_access_grant table if it doesn't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agent_access_grant (
      id TEXT PRIMARY KEY,
      agentUserId TEXT NOT NULL,
      targetUserEmail TEXT NOT NULL,
      resource TEXT NOT NULL DEFAULT 'invoice',
      grantedBy TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create role and role_permission tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS role (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      isSystem INTEGER NOT NULL DEFAULT 0
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS role_permission (
      id TEXT PRIMARY KEY,
      roleId TEXT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      UNIQUE(roleId, resource, action)
    )
  `);

  // Clear existing data for re-runnability
  sqlite.exec("DELETE FROM session");
  sqlite.exec("DELETE FROM account");
  sqlite.exec("DELETE FROM user");
  try { sqlite.exec("DELETE FROM member"); } catch {}
  try { sqlite.exec("DELETE FROM invitation"); } catch {}
  try { sqlite.exec("DELETE FROM organization"); } catch {}
  try { sqlite.exec("DELETE FROM agent_access_grant"); } catch {}
  try { sqlite.exec("DELETE FROM role_permission"); } catch {}
  try { sqlite.exec("DELETE FROM role"); } catch {}

  console.log("Creating test users...");

  // 1. Create users
  await signUp("Carol", "carol@example.com", "password123");
  console.log("  Created: carol@example.com");

  await signUp("Bob", "bob@example.com", "password123");
  console.log("  Created: bob@example.com");

  await signUp("Alice", "alice@example.com", "password123");
  console.log("  Created: alice@example.com");

  await signUp("Dave", "dave@example.com", "password123");
  console.log("  Created: dave@example.com");

  await signUp("Erin", "erin@example.com", "password123");
  console.log("  Created: erin@example.com");

  // 2. Set roles directly in database
  sqlite.exec(`UPDATE user SET role = 'admin' WHERE email = 'alice@example.com'`);
  console.log("  Set alice@example.com role to: admin");

  sqlite.exec(`UPDATE user SET role = 'agent' WHERE email = 'bob@example.com'`);
  console.log("  Set bob@example.com role to: agent");

  sqlite.exec(`UPDATE user SET role = 'endUser' WHERE email = 'carol@example.com'`);
  console.log("  Set carol@example.com role to: endUser");

  sqlite.exec(`UPDATE user SET role = 'endUser' WHERE email = 'dave@example.com'`);
  console.log("  Set dave@example.com role to: endUser");

  sqlite.exec(`UPDATE user SET role = 'endUser' WHERE email = 'erin@example.com'`);
  console.log("  Set erin@example.com role to: endUser");

  // 3. Create organization
  console.log("\nCreating organization...");
  const adminHeaders = await signIn("alice@example.com", "password123");

  const orgRes = await auth.handler(
    new Request("http://localhost:3007/api/auth/organization/create", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Acme Corp",
        slug: "acme-corp",
      }),
    })
  );
  const org = await orgRes.json();
  if (!orgRes.ok) throw new Error(`Create org failed: ${JSON.stringify(org)}`);
  console.log("  Created org: Acme Corp");

  // 4. Invite agent to organization
  const inviteRes = await auth.handler(
    new Request("http://localhost:3007/api/auth/organization/invite-member", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        email: "bob@example.com",
        role: "member",
        organizationId: org.id,
      }),
    })
  );
  if (!inviteRes.ok) {
    const err = await inviteRes.json();
    throw new Error(`Invite failed: ${JSON.stringify(err)}`);
  }
  console.log("  Invited bob@example.com to org");

  // 5. Accept invitation as agent
  const agentHeaders = await signIn("bob@example.com", "password123");

  const invitation = sqlite
    .prepare("SELECT id FROM invitation WHERE email = 'bob@example.com' LIMIT 1")
    .get() as any;

  if (invitation) {
    const acceptRes = await auth.handler(
      new Request("http://localhost:3007/api/auth/organization/accept-invitation", {
        method: "POST",
        headers: agentHeaders,
        body: JSON.stringify({ invitationId: invitation.id }),
      })
    );
    if (!acceptRes.ok) {
      const err = await acceptRes.json();
      console.warn("  Accept invitation issue:", JSON.stringify(err));
    } else {
      console.log("  Agent accepted invitation to Acme Corp");
    }
  }

  // 6. Seed default agent access grant
  console.log("\nSeeding agent access grants...");
  const agentUser = sqlite
    .prepare("SELECT id FROM user WHERE email = 'bob@example.com'")
    .get() as any;
  const adminUser = sqlite
    .prepare("SELECT id FROM user WHERE email = 'alice@example.com'")
    .get() as any;

  if (agentUser && adminUser) {
    sqlite
      .prepare(
        "INSERT INTO agent_access_grant (id, agentUserId, targetUserEmail, resource, grantedBy) VALUES (?, ?, ?, ?, ?)"
      )
      .run("grant-001", agentUser.id, "carol@example.com", "invoice", adminUser.id);
    console.log("  Granted bob@example.com access to carol@example.com's invoices");
  }

  // 7. Seed roles and permissions
  console.log("\nSeeding roles and permissions...");

  const insertRole = sqlite.prepare(
    "INSERT INTO role (id, name, description, isSystem) VALUES (?, ?, ?, ?)"
  );
  insertRole.run("admin", "admin", "Full access to all resources", 1);
  insertRole.run("agent", "agent", "Read-only on most resources, full CRUD on reports", 1);
  insertRole.run("endUser", "endUser", "Read/write on own data, no report access", 1);
  console.log("  Created 3 system roles");

  const insertPerm = sqlite.prepare(
    "INSERT INTO role_permission (id, roleId, resource, action) VALUES (?, ?, ?, ?)"
  );

  // Admin: full CRUD on all 9 resources
  const allResources = [
    "customer", "subscription", "invoice", "payment",
    "paymentMethod", "product", "order", "report", "project",
  ];
  const allActions = ["create", "read", "update", "delete"];
  let permId = 1;
  for (const resource of allResources) {
    for (const action of allActions) {
      insertPerm.run(`rp-${permId++}`, "admin", resource, action);
    }
  }
  console.log("  Seeded admin permissions (36 entries)");

  // Agent: read on most, full CRUD on report
  const agentPerms: [string, string][] = [
    ["customer", "read"],
    ["subscription", "read"],
    ["invoice", "read"],
    ["payment", "read"],
    ["paymentMethod", "read"],
    ["product", "read"],
    ["order", "read"],
    ["report", "create"],
    ["report", "read"],
    ["report", "update"],
    ["report", "delete"],
    ["project", "read"],
  ];
  for (const [resource, action] of agentPerms) {
    insertPerm.run(`rp-${permId++}`, "agent", resource, action);
  }
  console.log("  Seeded agent permissions (12 entries)");

  // endUser: read-only on most, CRU on payment & paymentMethod, no report
  const endUserPerms: [string, string][] = [
    ["subscription", "read"],
    ["invoice", "read"],
    ["payment", "create"],
    ["payment", "read"],
    ["paymentMethod", "create"],
    ["paymentMethod", "read"],
    ["paymentMethod", "update"],
    ["product", "read"],
    ["order", "read"],
    ["project", "read"],
    ["project", "update"],
  ];
  for (const [resource, action] of endUserPerms) {
    insertPerm.run(`rp-${permId++}`, "endUser", resource, action);
  }
  console.log("  Seeded endUser permissions (11 entries)");

  console.log("\nSeed complete! Test users:");
  console.log("  carol@example.com / password123  (role: endUser)");
  console.log("  dave@example.com   / password123  (role: endUser)");
  console.log("  erin@example.com  / password123  (role: endUser)");
  console.log("  bob@example.com   / password123  (role: agent, org: Acme Corp)");
  console.log("  alice@example.com   / password123  (role: admin)");
  console.log("\nAgent access grants:");
  console.log("  bob@example.com → can view carol@example.com's invoices");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
