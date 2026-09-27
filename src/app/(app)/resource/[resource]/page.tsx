"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRoleName } from "@/lib/use-role-name";
import { resources } from "@/lib/resource-config";
import ResourceTable from "@/components/resource-table";

type Permissions = {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

export default function ResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = use(params);
  const config = resources[resource];
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const roleId = (session?.user as { role?: string })?.role ?? "endUser";
  const roleName = useRoleName(roleId);
  const [permissions, setPermissions] = useState<Permissions>({
    create: false,
    read: false,
    update: false,
    delete: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
      return;
    }
    if (session && config) {
      checkPermissions();
    }
  }, [session, isPending]);

  async function checkPermissions() {
    setLoading(true);
    const actions = ["create", "read", "update", "delete"] as const;
    try {
      const res = await fetch("/api/check-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checks: actions.map((action) => ({
            resource: config.permissionKey,
            action,
          })),
        }),
      });
      const { results } = await res.json();
      setPermissions({
        create: results[`${config.permissionKey}:create`] ?? false,
        read: results[`${config.permissionKey}:read`] ?? false,
        update: results[`${config.permissionKey}:update`] ?? false,
        delete: results[`${config.permissionKey}:delete`] ?? false,
      });
    } catch {
      // If permission check fails entirely, default to no access
    }
    setLoading(false);
  }

  if (!config) {
    return (
      <div className="bg-white rounded-lg border border-card-border shadow-sm p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Resource Not Found</h2>
        <p className="text-gray-500 text-sm">The resource &quot;{resource}&quot; does not exist.</p>
      </div>
    );
  }

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!permissions.read) {
    return (
      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-8 text-center">
        <div className="text-red-500 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm">
          Your role does not have permission to view <strong>{config.displayName}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{config.displayName}</h1>
        <p className="text-gray-500 text-sm mt-1">{config.description}</p>
        <div className="flex gap-3 mt-3">
          <PermBadge label="Create" allowed={permissions.create} />
          <PermBadge label="Read" allowed={permissions.read} />
          <PermBadge label="Update" allowed={permissions.update} />
          <PermBadge label="Delete" allowed={permissions.delete} />
          <span className="text-xs text-gray-400 self-center ml-2">
            Logged in as <strong>{roleName}</strong>
          </span>
        </div>
      </div>

      <ResourceTable
        columns={config.columns}
        data={config.data}
        canCreate={permissions.create}
        canUpdate={permissions.update}
        canDelete={permissions.delete}
      />
    </div>
  );
}

function PermBadge({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        allowed
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-600"
      }`}
    >
      {allowed ? "\u2713" : "\u2717"} {label}
    </span>
  );
}
