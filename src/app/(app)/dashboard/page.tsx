"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRoleName } from "@/lib/use-role-name";

const gridResources = [
  { key: "customer", label: "Customer" },
  { key: "subscription", label: "Subscription" },
  { key: "invoice", label: "Invoice" },
  { key: "payment", label: "Payment" },
  { key: "paymentMethod", label: "Payment Method" },
  { key: "product", label: "Product" },
  { key: "order", label: "Order" },
  { key: "report", label: "Report" },
  { key: "project", label: "Project" },
];

const actions = ["create", "read", "update", "delete"] as const;
const actionLabels: Record<string, string> = {
  create: "C",
  read: "R",
  update: "U",
  delete: "D",
};

type PermGrid = Record<string, Record<string, boolean>>;

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [permGrid, setPermGrid] = useState<PermGrid>({});
  const [loadingGrid, setLoadingGrid] = useState(true);
  const roleId = (session?.user as { role?: string })?.role ?? "endUser";
  const roleName = useRoleName(roleId);

  useEffect(() => {
    if (!session && !isPending) {
      router.push("/sign-in");
    }
    if (session) {
      loadPermissions();
    }
  }, [session, isPending, router]);

  async function loadPermissions() {
    setLoadingGrid(true);
    const grid: PermGrid = {};
    try {
      const checks = gridResources.flatMap((res) =>
        actions.map((action) => ({ resource: res.key, action }))
      );
      const res = await fetch("/api/check-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checks }),
      });
      const { results } = await res.json();
      for (const check of checks) {
        if (!grid[check.resource]) grid[check.resource] = {};
        grid[check.resource][check.action] =
          results[`${check.resource}:${check.action}`] ?? false;
      }
    } catch {
      // Failed to load permissions
    }
    setPermGrid(grid);
    setLoadingGrid(false);
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-red-500",
    agent: "bg-blue-500",
    endUser: "bg-green-600",
  };

  const roleDescription: Record<string, string> = {
    admin: "Full access to all resources. Can manage users and change roles.",
    agent: "Read-only access to most resources. Full CRUD on Reports. Attached to an organization.",
    endUser: "Mostly read-only. Can add payments and payment methods, and edit projects. Sees only their own invoices. No access to Customers or Reports.",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden">
          <div className="bg-primary px-5 py-3">
            <h2 className="text-white font-medium">Welcome</h2>
          </div>
          <div className="p-5">
            <p className="text-lg font-semibold text-foreground mb-1">
              {session.user.name}
            </p>
            <p className="text-sm text-gray-500 mb-3">{session.user.email}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Role:</span>
              <span
                className={`${roleBadgeColor[roleId] ?? "bg-purple-500"} text-white text-xs px-2.5 py-0.5 rounded-full font-medium`}
              >
                {roleName}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {roleDescription[roleId] ?? "Custom role with specific permissions."}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden">
          <div className="bg-primary px-5 py-3">
            <h2 className="text-white font-medium">RBAC Overview</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-500 mb-4">
              This app uses Better Auth with the Admin plugin and Organization plugin to enforce role-based access control at the API/resource level.
              Navigate to any resource in the sidebar to see your permissions in action.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RoleCard
                role="endUser"
                description="Mostly read-only. Adds payments and payment methods. No customer or report access."
                highlight={roleId === "endUser"}
              />
              <RoleCard
                role="agent"
                description="Read-only on most resources. Full CRUD on reports. Org-linked."
                highlight={roleId === "agent"}
              />
              <RoleCard
                role="admin"
                description="Full access to everything. Can manage users and roles."
                highlight={roleId === "admin"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-white font-medium">Permissions Matrix</h2>
        </div>
        {loadingGrid ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">Loading permissions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header">
                  <th className="text-table-header-text text-left px-4 py-3 text-sm font-medium">Resource</th>
                  {actions.map((a) => (
                    <th key={a} className="text-table-header-text text-center px-4 py-3 text-sm font-medium">
                      {actionLabels[a]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridResources.map((res, idx) => (
                  <tr
                    key={res.key}
                    className={`border-t border-card-border ${idx % 2 === 1 ? "bg-table-stripe" : ""}`}
                  >
                    <td className="px-4 py-2.5 text-sm font-medium text-foreground">{res.label}</td>
                    {actions.map((a) => (
                      <td key={a} className="px-4 py-2.5 text-center">
                        {permGrid[res.key]?.[a] ? (
                          <span className="text-green-600 font-bold">&#10003;</span>
                        ) : (
                          <span className="text-red-400">&#10007;</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-card-border px-4 py-2 text-xs text-gray-500">
          C = Create, R = Read, U = Update, D = Delete
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  role,
  description,
  highlight,
}: {
  role: string;
  description: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-accent bg-accent/5 ring-1 ring-accent"
          : "border-card-border"
      }`}
    >
      <p className="font-semibold text-foreground text-sm mb-1">{role}</p>
      <p className="text-xs text-gray-500">{description}</p>
      {highlight && (
        <p className="text-xs text-accent font-medium mt-2">
          ← You are here
        </p>
      )}
    </div>
  );
}
