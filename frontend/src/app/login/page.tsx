"use client";

import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function LoginPage() {
  const { data: session } = useSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <button
        onClick={() => signIn("google")}
        className="bg-black text-white px-6 py-3 rounded-lg"
      >
        Continue with Google
      </button>
    </div>
  );
}
