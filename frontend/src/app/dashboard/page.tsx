"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useSession } from "next-auth/react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import TaskCardSkeleton from "@/components/skeletons/TaskCardSkeleton";

import StatusBadge from "@/components/StatusBadge";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ImageIcon,
  Sparkles,
} from "lucide-react";

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

      toast.error("Failed to update task");
    }
  }

  const stats = useMemo(() => {
    return {
      total: tasks.length,

      completed: tasks.filter((task) => task.status === "accepted").length,

      active: tasks.filter(
        (task) => task.status === "in_progress" || task.status === "assigned",
      ).length,
    };
  }, [tasks]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 rounded-3xl border border-white/10 bg-white/5 animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskCardSkeleton />

          <TaskCardSkeleton />

          <TaskCardSkeleton />

          <TaskCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-gray-300 mb-5">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            AI Workflow Dashboard
          </div>

          <h1 className="text-5xl font-bold">My Tasks</h1>

          <p className="text-gray-400 mt-3 text-lg">
            Manage your AI image generation workflows.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="border border-white/10 bg-white/5 rounded-3xl p-6">
          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <ImageIcon className="h-7 w-7 text-blue-400" />
          </div>

          <p className="text-gray-400 mt-6">Total Tasks</p>

          <h2 className="text-5xl font-bold mt-2">{stats.total}</h2>
        </div>

        <div className="border border-white/10 bg-white/5 rounded-3xl p-6">
          <div className="h-14 w-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
            <Clock3 className="h-7 w-7 text-yellow-400" />
          </div>

          <p className="text-gray-400 mt-6">Active Tasks</p>

          <h2 className="text-5xl font-bold mt-2">{stats.active}</h2>
        </div>

        <div className="border border-white/10 bg-white/5 rounded-3xl p-6">
          <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-green-400" />
          </div>

          <p className="text-gray-400 mt-6">Completed</p>

          <h2 className="text-5xl font-bold mt-2">{stats.completed}</h2>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-[32px] py-28 text-center bg-white/5">
          <div className="h-20 w-20 rounded-full bg-white/10 mx-auto flex items-center justify-center mb-8">
            <ImageIcon className="h-10 w-10 text-gray-500" />
          </div>

          <h2 className="text-3xl font-bold">No Tasks Yet</h2>

          <p className="text-gray-500 mt-4 text-lg">
            Tasks assigned by admin will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {tasks.map((task) => {
            const progress = Math.min(
              Math.round(((task.generated_count || 0) / 8) * 100),
              100,
            );

            return (
              <Link href={`/dashboard/${task.id}`} key={task.id}>
                <div className="group border border-white/10 bg-white/5 backdrop-blur-sm rounded-[32px] overflow-hidden hover:border-white/20 transition-all duration-300 cursor-pointer">
                  {task.product_image_url && (
                    <div className="overflow-hidden">
                      <img
                        src={task.product_image_url}
                        alt={task.title}
                        className="w-full h-72 object-cover group-hover:scale-[1.03] transition-all duration-500"
                      />
                    </div>
                  )}

                  <div className="p-7 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-3xl font-bold leading-tight">
                          {task.title}
                        </h2>

                        <p className="text-gray-400 mt-4 line-clamp-3">
                          {task.description}
                        </p>
                      </div>

                      <StatusBadge status={task.status} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                          Workflow Progress
                        </p>

                        <p className="font-semibold">{progress}%</p>
                      </div>

                      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    {task.feedback_note && (
                      <div className="border border-yellow-500/20 bg-yellow-500/10 rounded-2xl p-5">
                        <p className="text-sm font-medium text-yellow-400">
                          Admin Feedback
                        </p>

                        <p className="mt-3 text-gray-300">
                          {task.feedback_note}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {task.status === "assigned" && (
                        <button
                          onClick={async (e) => {
                            e.preventDefault();

                            e.stopPropagation();

                            await updateTaskStatus(task.id, "in_progress");

                            router.push(`/dashboard/${task.id}`);
                          }}
                          className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
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

                              fetchMyTasks();
                            } catch (error) {
                              console.log(error);

                              toast.error("Something went wrong");
                            }
                          }}
                          className="h-12 px-6 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-medium transition-all"
                        >
                          Submit Task
                        </button>
                      )}

                      <div className="h-12 px-5 rounded-2xl border border-white/10 hover:bg-white/5 flex items-center gap-2 transition-all">
                        Open Task
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
