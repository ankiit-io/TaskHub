"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [assignedTo, setAssignedTo] = useState("");
  const { data: session, status } = useSession();

  const router = useRouter();

  const [tasks, setTasks] = useState<any[]>([]);

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

  async function fetchTasks() {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/tasks");

      const data = await response.json();

      setTasks(data.tasks);
    } catch (error) {
      console.log(error);
    }
  }
  async function fetchUsers() {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/users");

      const data = await response.json();

      setUsers(data.users);
    } catch (error) {
      console.log(error);
    }
  }
  async function createTask() {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/tasks", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title,
          description,
          assigned_to: assignedTo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const data = await response.json();

      console.log(data);

      setTitle("");
      setDescription("");

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
      <div className="border p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Create Task</h2>

        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
        />

        <textarea
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
        >
          <option value="">Select User</option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <button
          onClick={createTask}
          className="bg-black text-white px-5 py-3 rounded-lg"
        >
          Create Task
        </button>
      </div>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{task.title}</h2>

            <p className="text-gray-500 mt-2">{task.description}</p>

            <p
              className={`mt-3 text-sm font-medium
    ${
      task.status === "submitted"
        ? "text-green-600"
        : task.status === "in_progress"
          ? "text-blue-600"
          : task.status === "assigned"
            ? "text-yellow-600"
            : "text-gray-600"
    }
  `}
            >
              Status: {task.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
