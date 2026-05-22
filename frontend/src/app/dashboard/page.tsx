"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const router = useRouter();

  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    fetchMyTasks();
  }, [session, status]);

  async function fetchMyTasks() {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/my-tasks/${session?.user?.id}`,
      );

      const data = await response.json();

      setTasks(data.tasks);
    } catch (error) {
      console.log(error);
    }
  }
 async function updateTaskStatus(taskId: string, status: string) {
   try {
     setTasks((prevTasks) =>
       prevTasks.map((task) =>
         task.id === taskId ? { ...task, status } : task,
       ),
     );

     await fetch(`http://127.0.0.1:5000/api/tasks/${taskId}`, {
       method: "PATCH",

       headers: {
         "Content-Type": "application/json",
       },

       body: JSON.stringify({
         status,
       }),
     });
   } catch (error) {
     console.log(error);
   }
 }

  if (status === "loading") {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{task.title}</h2>

            <p className="text-gray-500 mt-2">{task.description}</p>

            <p className="mt-3 text-sm">Status: {task.status}</p>

            <div className="mt-4 flex gap-3">
              {task.status === "assigned" && (
                <button
                  onClick={() => updateTaskStatus(task.id, "in_progress")}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  Start Task
                </button>
              )}

              {task.status === "in_progress" && (
                <button
                  onClick={() => updateTaskStatus(task.id, "submitted")}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg"
                >
                  Submit Task
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
