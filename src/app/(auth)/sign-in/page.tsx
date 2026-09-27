"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn(signInEmail: string, signInPassword: string) {
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: signInEmail,
        password: signInPassword,
      });
      if (signInError) {
        setError(signInError.message ?? "Sign in failed. Check your credentials.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn(email, password);
  }

  async function quickLogin(testEmail: string) {
    setEmail(testEmail);
    setPassword("password123");
    await signIn(testEmail, "password123");
  }

  return (
    <div className="w-full max-w-md mx-4">
      <div className="bg-white rounded-lg shadow-lg border border-card-border overflow-hidden">
        <div className="bg-primary px-6 py-5">
          <h1 className="text-white text-xl font-bold">Dynamic RBAC</h1>
          <p className="text-sidebar-text text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

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
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="px-6 pb-6">
          <p className="text-sm text-gray-500 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-accent hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg shadow border border-card-border p-4">
        <p className="text-xs text-gray-500 font-medium mb-2">Test Accounts (click to quick login):</p>
        <div className="space-y-1 text-xs text-gray-600 font-mono">
          <p onClick={() => quickLogin("carol@example.com")} className="cursor-pointer hover:text-green-600 transition-colors">carol@example.com / password123 (endUser)</p>
          <p onClick={() => quickLogin("dave@example.com")} className="cursor-pointer hover:text-green-600 transition-colors">dave@example.com / password123 (endUser)</p>
          <p onClick={() => quickLogin("erin@example.com")} className="cursor-pointer hover:text-green-600 transition-colors">erin@example.com / password123 (endUser)</p>
          <p onClick={() => quickLogin("bob@example.com")} className="cursor-pointer hover:text-blue-500 transition-colors">bob@example.com / password123 (agent)</p>
          <p onClick={() => quickLogin("alice@example.com")} className="cursor-pointer hover:text-red-500 transition-colors">alice@example.com / password123 (admin)</p>
        </div>
      </div>
    </div>
  );
}
