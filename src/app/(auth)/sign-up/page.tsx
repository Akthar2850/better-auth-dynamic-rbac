"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message ?? "Sign up failed. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-4">
      <div className="bg-white rounded-lg shadow-lg border border-card-border overflow-hidden">
        <div className="bg-primary px-6 py-5">
          <h1 className="text-white text-xl font-bold">Dynamic RBAC</h1>
          <p className="text-sidebar-text text-sm mt-1">Create a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              placeholder="Choose a password"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-xs">
            New users are assigned the <strong>endUser</strong> role by default.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="px-6 pb-6">
          <p className="text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
