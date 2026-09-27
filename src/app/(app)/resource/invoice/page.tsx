"use client";

import { useEffect, useState } from "react";
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

type Grant = {
  id: string;
  agentUserId: string;
  targetUserEmail: string;
  resource: string;
};

export default function InvoicePage() {
  const config = resources["invoice"];
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permissions>({
    create: false,
    read: false,
    update: false,
    delete: false,
  });
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState<
    Record<string, string | number>[]
  >([]);
  const [filterBanner, setFilterBanner] = useState("");

  const role = (session?.user as { role?: string })?.role ?? "endUser";
  const roleName = useRoleName(role);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
      return;
    }
    if (session) {
      loadPage();
    }
  }, [session, isPending]);

  async function loadPage() {
    setLoading(true);

    // Check CRUD permissions via batch API
    try {
      const actions = ["create", "read", "update", "delete"] as const;
      const res = await fetch("/api/check-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checks: actions.map((action) => ({ resource: "invoice", action })),
        }),
      });
      const { results } = await res.json();
      const perms: Permissions = {
        create: results["invoice:create"] ?? false,
        read: results["invoice:read"] ?? false,
        update: results["invoice:update"] ?? false,
        delete: results["invoice:delete"] ?? false,
      };
      setPermissions(perms);

      if (!perms.read) {
        setLoading(false);
        return;
      }
    } catch {
      setLoading(false);
      return;
    }

    // Filter data based on role
    const allData = config.data;
    const userEmail = session!.user.email;

    if (role === "admin") {
      setFilteredData(allData);
      setFilterBanner(`Showing all invoices (admin access)`);
    } else if (role === "endUser") {
      const own = allData.filter((row) => row.ownerId === userEmail);
      setFilteredData(own);
      setFilterBanner(own.length > 0 ? `Showing your invoices only` : `You have no invoices`);
    } else if (role === "agent") {
      try {
        const res = await fetch(
          `/api/agent-grants?agentUserId=${session!.user.id}`
        );
        const { grants } = (await res.json()) as { grants: Grant[] };
        const grantedEmails = grants
          .filter((g) => g.resource === "invoice")
          .map((g) => g.targetUserEmail);
        const filtered = allData.filter((row) =>
          grantedEmails.includes(String(row.ownerId))
        );
        setFilteredData(filtered);
        setFilterBanner(
          grantedEmails.length > 0
            ? `Showing invoices for granted users: ${grantedEmails.join(", ")}`
            : `No invoice access grants assigned to you`
        );
      } catch {
        setFilteredData([]);
        setFilterBanner("Failed to load access grants");
      }
    } else {
      // Any other role (custom roles created from the admin UI). Fail closed:
      // an unrecognised role must never fall through to seeing all invoices,
      // so restrict it to the user's own data.
      const own = allData.filter((row) => row.ownerId === userEmail);
      setFilteredData(own);
      setFilterBanner(own.length > 0 ? `Showing your invoices only` : `You have no invoices`);
    }

    setLoading(false);
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
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Access Denied
        </h2>
        <p className="text-gray-500 text-sm">
          Your role does not have permission to view{" "}
          <strong>Invoices</strong>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
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

      {filterBanner && (
        <div className={`px-4 py-3 rounded text-sm mb-4 border ${
          filteredData.length === 0
            ? "bg-orange-50 border-orange-200 text-orange-700"
            : "bg-blue-50 border-blue-200 text-blue-700"
        }`}>
          {filterBanner}
        </div>
      )}

      <ResourceTable
        columns={config.columns}
        data={filteredData}
        canCreate={permissions.create}
        canUpdate={permissions.update}
        canDelete={permissions.delete}
      />
    </div>
  );
}

function PermBadge({
  label,
  allowed,
}: {
  label: string;
  allowed: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        allowed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
      }`}
    >
      {allowed ? "\u2713" : "\u2717"} {label}
    </span>
  );
}
