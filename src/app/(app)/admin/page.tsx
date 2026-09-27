"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import UsersTab from "@/components/admin/users-tab";
import RolesTab from "@/components/admin/roles-tab";
import GrantsTab from "@/components/admin/grants-tab";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

type Tab = "users" | "roles" | "grants";

export default function AdminPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [roleNames, setRoleNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
      return;
    }
    if (session && session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    if (session) {
      loadUsers();
      loadRoleNames();
    }
  }, [session, isPending]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const { data } = await authClient.admin.listUsers({
        query: { limit: 100 },
      });
      if (data) {
        setUsers(data.users as User[]);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
    setLoadingUsers(false);
  }

  async function loadRoleNames() {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      const map: Record<string, string> = {};
      for (const role of data.roles) {
        map[role.id] = role.name;
      }
      setRoleNames(map);
    } catch {
      // fallback: role IDs will be shown as-is
    }
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return (
      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm">Only admins can access this page.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "users", label: "Users" },
    { id: "roles", label: "Roles" },
    { id: "grants", label: "Grants" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Administration</h1>
      <p className="text-gray-500 text-sm mb-6">Manage users, roles, and access grants.</p>

      {/* Tabs */}
      <div className="flex border-b border-card-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loadingUsers ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === "users" && (
            <UsersTab
              users={users}
              currentUserId={session.user.id}
              roleNames={roleNames}
              onUsersChanged={loadUsers}
            />
          )}
          {activeTab === "roles" && (
            <RolesTab
              users={users}
              onUsersChanged={() => { loadUsers(); loadRoleNames(); }}
            />
          )}
          {activeTab === "grants" && (
            <GrantsTab users={users} />
          )}
        </>
      )}
    </div>
  );
}
