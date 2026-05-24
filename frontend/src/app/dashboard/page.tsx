"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useSession } from "next-auth/react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import TaskCardSkeleton from "@/components/skeletons/TaskCardSkeleton";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const router = useRouter();

  const [tasks, setTasks] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

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
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/my-tasks/${session?.user?.id}`,
      );

      const data = await response.json();

      if (Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.log(error);

      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
              }
            : task,
        ),
      );

      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        },
      );
    } catch (error) {
      console.log(error);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">My Tasks</h1>

          <p className="text-gray-400 mt-2">Manage your AI image workflows</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-3xl py-24 text-center">
          <h2 className="text-2xl font-semibold">No Tasks Yet</h2>

          <p className="text-gray-500 mt-3">
            Tasks assigned by admin will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <Link href={`/dashboard/${task.id}`} key={task.id}>
              <div className="group border border-white/10 bg-white/5 backdrop-blur-sm rounded-3xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer">
                {task.product_image_url && (
                  <img
                    src={task.product_image_url}
                    alt={task.title}
                    className="w-full h-64 object-cover rounded-2xl mb-5 group-hover:scale-[1.01] transition-all duration-300"
                  />
                )}

                <div>
                  <h2 className="text-2xl font-semibold">{task.title}</h2>

                  <p className="text-gray-400 mt-3 line-clamp-2">
                    {task.description}
                  </p>

                  <div className="mt-5 flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-sm bg-white/10 capitalize">
                      {task.status.replace("_", " ")}
                    </span>

                    {task.status === "accepted" && (
                      <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
                        Approved
                      </span>
                    )}
                  </div>

                  {task.feedback_note && (
                    <div className="mt-5 border border-yellow-500/20 bg-yellow-500/10 rounded-2xl p-4">
                      <p className="text-sm font-medium text-yellow-500">
                        Admin Feedback
                      </p>

                      <p className="mt-2 text-gray-300 text-sm">
                        {task.feedback_note}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    {task.status === "assigned" && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();

                          e.stopPropagation();

                          await updateTaskStatus(task.id, "in_progress");

                          toast.success("Task started");

                          router.push(`/dashboard/${task.id}`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition-all duration-200 active:scale-95"
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
                              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${task.id}/generations`,
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
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl transition-all duration-200 active:scale-95"
                      >
                        Submit Task
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
