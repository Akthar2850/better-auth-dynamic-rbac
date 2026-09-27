"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Grant {
  id: string;
  agentUserId: string;
  targetUserEmail: string;
  resource: string;
  grantedBy: string;
  createdAt: string;
}

interface GrantsTabProps {
  users: User[];
}

export default function GrantsTab({ users }: GrantsTabProps) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loadingGrants, setLoadingGrants] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [addingGrant, setAddingGrant] = useState(false);
  const [removingGrant, setRemovingGrant] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadGrants();
  }, []);

  async function loadGrants() {
    setLoadingGrants(true);
    try {
      const res = await fetch("/api/agent-grants?resource=invoice");
      const data = await res.json();
      if (data.grants) {
        setGrants(data.grants);
      }
    } catch (err) {
      console.error("Failed to load grants:", err);
    }
    setLoadingGrants(false);
  }

  async function addGrant() {
    if (!selectedAgent || !selectedTarget) return;
    setError("");
    setAddingGrant(true);
    try {
      const res = await fetch("/api/agent-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentUserId: selectedAgent,
          targetUserEmail: selectedTarget,
          resource: "invoice",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add grant.");
      } else {
        setSelectedAgent("");
        setSelectedTarget("");
        await loadGrants();
      }
    } catch {
      setError("Failed to add grant. Please try again.");
    }
    setAddingGrant(false);
  }

  async function removeGrant(grantId: string) {
    setError("");
    setRemovingGrant(grantId);
    try {
      await fetch(`/api/agent-grants?id=${grantId}`, { method: "DELETE" });
      await loadGrants();
    } catch {
      setError("Failed to remove grant. Please try again.");
    }
    setRemovingGrant(null);
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      {/* Add Grant Form */}
      <div className="bg-white rounded-lg border border-card-border shadow-sm p-4 mb-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Add New Grant</h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="border border-card-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-w-[180px]"
            >
              <option value="">Select agent...</option>
              {users
                .filter((u) => u.role === "agent")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Can View User</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="border border-card-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-w-[180px]"
            >
              <option value="">Select user...</option>
              {users
                // Anyone who owns data can be a grant target: endUsers and any
                // custom role. Agents are the viewers, admins already see all.
                .filter((u) => u.role !== "agent" && u.role !== "admin")
                .map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.name} ({u.email})
                  </option>
                ))}
            </select>
          </div>
          <button
            onClick={addGrant}
            disabled={!selectedAgent || !selectedTarget || addingGrant}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {addingGrant ? "Adding..." : "Add Grant"}
          </button>
        </div>
      </div>

      {/* Grants Table */}
      {loadingGrants ? (
        <div className="flex items-center justify-center h-20">
          <p className="text-gray-500">Loading grants...</p>
        </div>
      ) : grants.length === 0 ? (
        <div className="bg-white rounded-lg border border-card-border shadow-sm p-6 text-center">
          <p className="text-gray-500 text-sm">No agent access grants yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header">
                  <th className="text-table-header-text text-left px-4 py-3 text-sm font-medium">Agent</th>
                  <th className="text-table-header-text text-left px-4 py-3 text-sm font-medium">Can View User</th>
                  <th className="text-table-header-text text-left px-4 py-3 text-sm font-medium">Resource</th>
                  <th className="text-table-header-text text-left px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grants.map((grant, idx) => {
                  const agentUser = users.find((u) => u.id === grant.agentUserId);
                  return (
                    <tr
                      key={grant.id}
                      className={`border-t border-card-border ${
                        idx % 2 === 1 ? "bg-table-stripe" : ""
                      } hover:bg-gray-50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm">
                        {agentUser ? `${agentUser.name} (${agentUser.email})` : grant.agentUserId}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-xs">{grant.targetUserEmail}</td>
                      <td className="px-4 py-3 text-sm">{grant.resource}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => removeGrant(grant.id)}
                          disabled={removingGrant === grant.id}
                          className="bg-danger hover:bg-danger-hover text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {removingGrant === grant.id ? "Removing..." : "Remove"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-card-border px-4 py-2 text-xs text-gray-500">
            {grants.length} grant{grants.length !== 1 ? "s" : ""} total
          </div>
        </div>
      )}
    </div>
  );
}
