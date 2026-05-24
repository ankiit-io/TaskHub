"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
          <Link href={`/dashboard/${task.id}`} key={task.id}>
            <div className="border p-4 rounded-lg cursor-pointer hover:border-black transition">
              <h2 className="text-xl font-semibold">{task.title}</h2>

              <p className="text-gray-500 mt-2">{task.description}</p>

              <p className="mt-3 text-sm capitalize">
                Status: {task.status.replace("_", " ")}
              </p>

              {task.feedback_note && (
                <div className="mt-4 border border-yellow-500/20 bg-yellow-500/10 rounded-xl p-3">
                  <p className="text-sm font-medium text-yellow-500">
                    Admin Feedback
                  </p>

                  <p className="text-sm mt-1 text-gray-300">
                    {task.feedback_note}
                  </p>
                </div>
              )}

              <div className="mt-4 flex gap-3">
                {task.status === "assigned" && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      updateTaskStatus(task.id, "in_progress");
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    Start Task
                  </button>
                )}

                {task.status === "in_progress" && (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      try {
                        const res = await fetch(
                          `http://127.0.0.1:5000/api/tasks/${task.id}/generations`,
                        );

                        const images = await res.json();

                        if (images.length < 8) {
                          toast.error(
                            `Only ${images.length}/8 images generated`,
                          );

                          return;
                        }

                        await updateTaskStatus(task.id, "submitted");

                        toast.success("Task submitted successfully!");

                        fetchMyTasks();
                      } catch (error) {
                        console.log(error);

                        toast.error("Something went wrong");
                      }
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Submit Task
                  </button>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
