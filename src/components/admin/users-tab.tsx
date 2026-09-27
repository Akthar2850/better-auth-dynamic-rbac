"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UsersTabProps {
  users: User[];
  currentUserId: string;
  roleNames: Record<string, string>;
  onUsersChanged: () => void;
}

export default function UsersTab({ users, currentUserId, roleNames, onUsersChanged }: UsersTabProps) {
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function deleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete "${userName}"? This cannot be undone.`)) {
      return;
    }
    setError("");
    setDeletingUser(userId);
    try {
      await authClient.admin.removeUser({ userId });
      onUsersChanged();
    } catch {
      setError("Failed to delete user. Please try again.");
    }
    setDeletingUser(null);
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header">
                <th className="text-table-header-text text-left px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-table-header-text text-left px-4 py-3 text-sm font-medium">Email</th>
                <th className="text-table-header-text text-left px-4 py-3 text-sm font-medium">Role</th>
                <th className="text-table-header-text text-left px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr
                    key={user.id}
                    className={`border-t border-card-border ${
                      idx % 2 === 1 ? "bg-table-stripe" : ""
                    } hover:bg-gray-50 transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm">{user.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <RoleBadge role={user.role} displayName={roleNames[user.role] ?? user.role} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isSelf ? (
                        <span className="text-xs text-gray-400 italic">—</span>
                      ) : (
                        <button
                          onClick={() => deleteUser(user.id, user.name)}
                          disabled={deletingUser === user.id}
                          className="bg-danger hover:bg-danger-hover text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {deletingUser === user.id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-card-border px-4 py-2 text-xs text-gray-500">
          {users.length} user{users.length !== 1 ? "s" : ""} total
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role, displayName }: { role: string; displayName: string }) {
  const colors: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    agent: "bg-blue-100 text-blue-700",
    endUser: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        colors[role] ?? "bg-purple-100 text-purple-700"
      }`}
    >
      {displayName}
    </span>
  );
}
