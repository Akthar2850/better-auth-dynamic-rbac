"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRoleName } from "@/lib/use-role-name";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const roleId = (session?.user as { role?: string })?.role ?? "endUser";
  const roleName = useRoleName(roleId);

  // TODO: Re-enable organization display
  // const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
      return;
    }
    // if (session && (session.user as { role?: string })?.role === "agent") {
    //   loadOrgInfo();
    // }
  }, [session, isPending]);

  // async function loadOrgInfo() {
  //   try {
  //     const { data } = await authClient.organization.list();
  //     if (data && data.length > 0) {
  //       setOrgName(data[0].name);
  //     }
  //   } catch {
  //     // No org access or not in any org
  //   }
  // }

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-red-500",
    agent: "bg-blue-500",
    endUser: "bg-green-600",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden">
          <div className="bg-primary px-5 py-3">
            <h2 className="text-white font-medium">User Information</h2>
          </div>
          <div className="p-5 space-y-4">
            <ProfileRow label="Full Name" value={session.user.name} />
            <ProfileRow label="Email" value={session.user.email} />
            <div className="flex justify-between items-center py-2 border-b border-card-border">
              <span className="text-sm text-gray-500">Role</span>
              <span
                className={`${roleBadgeColor[roleId] ?? "bg-purple-500"} text-white text-xs px-2.5 py-0.5 rounded-full font-medium`}
              >
                {roleName}
              </span>
            </div>

          </div>
        </div>

        {/* TODO: Re-enable organization display
        {orgName && (
          <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden">
            <div className="bg-primary px-5 py-3">
              <h2 className="text-white font-medium">Organization</h2>
            </div>
            <div className="p-5 space-y-4">
              <ProfileRow label="Organization" value={orgName} />
              <ProfileRow label="Membership" value="Member" />
            </div>
          </div>
        )}
        */}

      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-card-border last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-foreground font-mono">{value}</span>
    </div>
  );
}
