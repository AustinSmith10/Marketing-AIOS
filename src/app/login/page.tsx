"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.push("/");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setMessage("Sign-up successful. Please check your email to confirm your account.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0b1f5c] text-white font-semibold">
            D
          </div>
          <h1 className="text-xl font-bold text-[#0b1f5c]">
            Jamal the Marketing Agent
          </h1>
          <p className="mb-8 mt-1 text-sm text-gray-500">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {message && !error && (
            <p className="text-sm text-green-600">{message}</p>
          )}

          <Button
            type="submit"
            loading={isLoading}
            className="mt-2 w-full"
          >
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          {mode === "signin" ? (
            <button
              type="button"
              className="text-sm text-[#0b1f5c] underline"
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
            >
              Don&apos;t have an account? Sign up
            </button>
          ) : (
            <button
              type="button"
              className="text-sm text-[#0b1f5c] underline"
              onClick={() => {
                setMode("signin");
                setError("");
                setMessage("");
              }}
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

