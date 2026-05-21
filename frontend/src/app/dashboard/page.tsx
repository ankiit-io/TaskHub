"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { saveUser } from "@/lib/saveUser";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      saveUser(session.user);
    }
  }, [session]);

  useEffect(() => {
    async function testBackend() {
      try {
        const res = await fetch("http://localhost:5000/");
        const data = await res.json();

        console.log(data);
      } catch (error) {
        console.log(error);
      }
    }

    testBackend();
  }, []);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Welcome {session?.user?.name}</h1>

      <p className="mt-4">{session?.user?.email}</p>

      <button
        onClick={() => signOut()}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
