"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [users, setUsers] = useState<any[]>([]);

  const [assignedTo, setAssignedTo] = useState("");

  const [image, setImage] = useState<File | null>(null);

  const [tasks, setTasks] = useState<any[]>([]);

  const { data: session, status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchTasks();

    fetchUsers();
  }, [session, status]);

  useEffect(() => {
    const channel = supabase
      .channel("tasks-realtime")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },

        (payload) => {
          const updatedTask = payload.new as any;

          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === updatedTask.id
                ? {
                    ...task,
                    ...updatedTask,
                  }
                : task,
            ),
          );
        },
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTasks() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`);

      const data = await response.json();

      setTasks(data.tasks);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`);

      const data = await response.json();

      setUsers(data.users);
    } catch (error) {
      console.log(error);
    }
  }

  async function createTask() {
    try {
      let imageUrl = "";

      // upload image first
      if (image) {
        const fileName = `${Date.now()}-${image.name}`;

        const { error } = await supabase.storage
          .from("task-image")
          .upload(fileName, image);

        if (error) {
          console.log(error);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("task-image")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      // then create task
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title,
          description,
          assigned_to: assignedTo,
          product_image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      setTitle("");
      setDescription("");
      setAssignedTo("");
      setImage(null);

      fetchTasks();
    } catch (error) {
      console.log(error);
    }
  }

  if (status === "loading") {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* CREATE TASK */}
      <div className="border border-white/10 rounded-2xl p-6 mb-10">
        <h2 className="text-2xl font-semibold mb-4">Create Task</h2>

        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-white/10 bg-transparent p-3 rounded-lg mb-4"
        />

        <textarea
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-white/10 bg-transparent p-3 rounded-lg mb-4"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="mb-4"
        />

        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full border border-white/10 bg-transparent p-3 rounded-lg mb-4"
        >
          <option value="">Select User</option>

          {users.map((user) => (
            <option key={user.id} value={user.id} className="text-black">
              {user.name}
            </option>
          ))}
        </select>

        <button
          onClick={createTask}
          className="bg-black hover:bg-gray-800 transition-all duration-200 active:scale-95 text-white px-5 py-3 rounded-lg"
        >
          Create Task
        </button>
      </div>

      {/* TASKS */}
      <div className="space-y-6">
        {tasks.map((task) => (
          <Link href={`/admin/tasks/${task.id}`} key={task.id}>
            <div className="border border-white/10 p-5 rounded-2xl hover:border-gray-500 transition-all duration-200 cursor-pointer">
              {task.product_image_url && (
                <img
                  src={task.product_image_url}
                  alt={task.title}
                  className="w-full h-56 object-cover rounded-xl mb-4"
                />
              )}

              <h2 className="text-2xl font-semibold">{task.title}</h2>

              <p className="text-gray-500 mt-2">{task.description}</p>

              <p
                className={`mt-4 inline-block px-4 py-2 rounded-full text-sm font-medium capitalize
${
  task.status === "submitted"
    ? "bg-green-100 text-green-700"
    : task.status === "in_progress"
      ? "bg-blue-100 text-blue-700"
      : task.status === "assigned"
        ? "bg-yellow-100 text-yellow-700"
        : task.status === "accepted"
          ? "bg-emerald-100 text-emerald-700"
          : task.status === "revision_requested"
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-700"
}
`}
              >
                Status: {task.status.replace("_", " ")}
              </p>

              {task.feedback_note && (
                <div className="mt-4 border border-yellow-500/20 bg-yellow-500/10 rounded-xl p-4">
                  <p className="text-sm font-semibold text-yellow-400">
                    Feedback
                  </p>

                  <p className="text-sm mt-2 text-gray-300">
                    {task.feedback_note}
                  </p>
                </div>
              )}

              {task.status === "submitted" && (
                <div className="mt-5">
                  <span className="text-blue-400 text-sm">
                    Click to review task →
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
