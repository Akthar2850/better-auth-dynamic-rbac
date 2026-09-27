"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { RESOURCES, ACTIONS } from "@/lib/constants";

interface Permission {
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RolesTabProps {
  users: User[];
  onUsersChanged: () => void;
}

const RESOURCE_LABELS: Record<string, string> = {
  customer: "Customer",
  subscription: "Subscription",
  invoice: "Invoice",
  payment: "Payment",
  paymentMethod: "Payment Method",
  product: "Product",
  order: "Order",
  report: "Report",
  project: "Project",
};

export default function RolesTab({ users, onUsersChanged }: RolesTabProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit/Create dialog state
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPerms, setFormPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Assign dialog state
  const [assigningRole, setAssigningRole] = useState<Role | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Delete state
  const [deletingRole, setDeletingRole] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    setLoading(true);
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      setRoles(data.roles);
    } catch {
      setError("Failed to load roles");
    }
    setLoading(false);
  }

  function openCreate() {
    setIsCreating(true);
    setEditingRole(null);
    setFormName("");
    setFormDescription("");
    setFormPerms(new Set());
    setError("");
  }

  function openEdit(role: Role) {
    setIsCreating(false);
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description);
    setFormPerms(new Set(role.permissions.map((p) => `${p.resource}:${p.action}`)));
    setError("");
  }

  function closeDialog() {
    setEditingRole(null);
    setIsCreating(false);
  }

  function togglePerm(key: string) {
    setFormPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function saveRole() {
    if (!formName.trim()) {
      setError("Role name is required");
      return;
    }

    setSaving(true);
    setError("");

    const permissions = Array.from(formPerms).map((key) => {
      const [resource, action] = key.split(":");
      return { resource, action };
    });

    try {
      if (isCreating) {
        const res = await fetch("/api/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            permissions,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to create role");
          setSaving(false);
          return;
        }
      } else if (editingRole) {
        const res = await fetch(`/api/roles/${editingRole.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            permissions,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to update role");
          setSaving(false);
          return;
        }
      }
      closeDialog();
      await loadRoles();
    } catch {
      setError("Failed to save role");
    }
    setSaving(false);
  }

  async function deleteRole(roleId: string, roleName: string) {
    if (!confirm(`Are you sure you want to delete the "${roleName}" role?`)) {
      return;
    }
    setDeletingRole(roleId);
    setError("");
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete role");
      } else {
        await loadRoles();
      }
    } catch {
      setError("Failed to delete role");
    }
    setDeletingRole(null);
  }

  function openAssign(role: Role) {
    setAssigningRole(role);
    setAssignError("");
    // Pre-check users who currently have this role
    const assigned = new Set(
      users.filter((u) => u.role === role.id).map((u) => u.id)
    );
    setSelectedUsers(assigned);
  }

  function closeAssign() {
    setAssigningRole(null);
  }

  function toggleUser(userId: string) {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  async function saveAssignments() {
    if (!assigningRole) return;
    setAssignSaving(true);
    setAssignError("");

    const roleId = assigningRole.id;
    const currentlyAssigned = new Set(
      users.filter((u) => u.role === roleId).map((u) => u.id)
    );

    // Find users to add to this role (newly checked)
    const toAdd = [...selectedUsers].filter((id) => !currentlyAssigned.has(id));
    // Find users to remove from this role (unchecked)
    const toRemove = [...currentlyAssigned].filter((id) => !selectedUsers.has(id));

    try {
      // Add users to this role
      for (const userId of toAdd) {
        // TODO: Re-enable org membership check for agent role later
        // if (roleId === "agent") {
        //   const res = await fetch(`/api/check-org-membership?userId=${userId}`);
        //   const { hasOrg } = await res.json();
        //   if (!hasOrg) {
        //     setAssignError(
        //       `Cannot assign agent role: user must be in an organization first.`
        //     );
        //     setAssignSaving(false);
        //     return;
        //   }
        // }
        await (authClient.admin as any).setRole({
          userId,
          role: roleId,
        });
      }

      // Remove users from this role → set them back to endUser
      for (const userId of toRemove) {
        await (authClient.admin as any).setRole({
          userId,
          role: "endUser",
        });
      }

      closeAssign();
      onUsersChanged();
      await loadRoles();
    } catch {
      setAssignError("Failed to update role assignments");
    }
    setAssignSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Loading roles...</p>
      </div>
    );
  }

  const showDialog = isCreating || editingRole !== null;

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
        >
          + Create Role
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-lg border border-card-border shadow-sm p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{role.name}</h3>
                {role.isSystem && (
                  <span className="inline-block text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded mt-0.5">
                    System
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {role.description || "No description"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(role)}
                className="bg-accent hover:bg-primary text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => openAssign(role)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Assign Users
              </button>
              {!role.isSystem && (
                <button
                  onClick={() => deleteRole(role.id, role.name)}
                  disabled={deletingRole === role.id}
                  className="bg-danger hover:bg-danger-hover text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {deletingRole === role.id ? "..." : "Delete"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {isCreating ? "Create Role" : `Edit Role: ${editingRole?.name}`}
              </h2>
              <button
                onClick={closeDialog}
                className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={editingRole?.isSystem}
                  className="w-full px-3 py-2 border border-card-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="e.g. manager"
                />
                {editingRole?.isSystem && (
                  <p className="text-xs text-gray-400 mt-1">System role names cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-card-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="What can this role do?"
                />
              </div>

              {/* Permission Grid */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Permissions
                </label>
                <div className="bg-white rounded border border-card-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-table-header">
                        <th className="text-table-header-text text-left px-3 py-2 text-xs font-medium">
                          Resource
                        </th>
                        {ACTIONS.map((a) => (
                          <th
                            key={a}
                            className="text-table-header-text text-center px-3 py-2 text-xs font-medium capitalize"
                          >
                            {a}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RESOURCES.map((resource, idx) => (
                        <tr
                          key={resource}
                          className={`border-t border-card-border ${
                            idx % 2 === 1 ? "bg-table-stripe" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-xs font-medium text-foreground">
                            {RESOURCE_LABELS[resource] || resource}
                          </td>
                          {ACTIONS.map((action) => {
                            const key = `${resource}:${action}`;
                            return (
                              <td key={action} className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={formPerms.has(key)}
                                  onChange={() => togglePerm(key)}
                                  className="w-4 h-4 accent-accent cursor-pointer"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-card-border flex justify-end gap-3">
              <button
                onClick={closeDialog}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveRole}
                disabled={saving}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Users Dialog */}
      {assigningRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Assign Users to: {assigningRole.name}
              </h2>
              <button
                onClick={closeAssign}
                className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              {assignError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-3">
                  {assignError}
                </div>
              )}

              <p className="text-xs text-gray-500 mb-3">
                Select users to assign the <strong>{assigningRole.name}</strong> role.
                Unchecking a user will set them back to endUser.
              </p>

              <div className="space-y-2">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUser(user.id)}
                      className="w-4 h-4 accent-accent"
                    />
                    <div>
                      <p className="text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    {user.role === assigningRole.id && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-auto">
                        Current
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {/* TODO: Re-enable when org membership check is restored
              {assigningRole.id === "agent" && (
                <p className="text-xs text-orange-600 mt-3">
                  Note: Agent role requires the user to be a member of an organization.
                </p>
              )}
              */}
            </div>

            <div className="px-6 py-4 border-t border-card-border flex justify-end gap-3">
              <button
                onClick={closeAssign}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveAssignments}
                disabled={assignSaving}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {assignSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
