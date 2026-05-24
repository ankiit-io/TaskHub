"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminTaskReviewPage() {
  const params = useParams();

  const router = useRouter();

  const taskId = params.taskId as string;

  const [task, setTask] = useState<any>(null);

  const [generations, setGenerations] = useState<any[]>([]);

  const [feedbackNote, setFeedbackNote] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTask();
  }, []);

  async function fetchTask() {
    try {
      const taskRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}`,
      );

      const taskData = await taskRes.json();

      setTask(taskData);

      setFeedbackNote(taskData.feedback_note || "");

      const genRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}/generations`,
      );

      const genData = await genRes.json();

      setGenerations(genData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function acceptTask() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}/accept`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            feedback_note: feedbackNote,
          }),
        },
      );

      if (!res.ok) {
        toast.error("Failed to accept task");
        return;
      }

      toast.success("Task accepted successfully!");

      router.refresh();

      fetchTask();
    } catch (error) {
      console.log(error);

      toast.error("Something went wrong");
    }
  }

  async function requestRevision() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}/request-revision`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            feedback_note: feedbackNote,
          }),
        },
      );

      if (!res.ok) {
        toast.error("Failed to request revision");
        return;
      }

      toast.success("Revision requested!");

      router.refresh();

      fetchTask();
    } catch (error) {
      console.log(error);

      toast.error("Something went wrong");
    }
  }

  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  if (!task) {
    return <div className="p-10">Task not found</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{task.title}</h1>

        <p className="text-gray-500 mt-2">{task.description}</p>

        <p className="mt-3 text-sm">
          Status:{" "}
          <span className="font-medium capitalize">
            {task.status.replace("_", " ")}
          </span>
        </p>
      </div>

      <div className="border border-white/10 bg-white/5 rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-4">Submitted Images</h2>

        {generations.length === 0 ? (
          <p className="text-gray-500">No images submitted yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((image) => (
              <div
                key={image.id}
                className={`border rounded-xl p-3 ${
                  image.is_final
                    ? "border-green-500 ring-2 ring-green-500/30"
                    : ""
                }`}
              >
                <img
                  src={image.image_url}
                  alt={image.image_type}
                  className="w-full h-48 object-cover rounded-lg"
                />

                <div className="mt-3">
                  <p className="font-medium capitalize">{image.image_type}</p>

                  {image.is_final && (
                    <p className="text-green-500 text-sm mt-1">
                      Final Selected
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-white/10 bg-white/5 rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-4">Review Feedback</h2>

        <textarea
          value={feedbackNote}
          onChange={(e) => setFeedbackNote(e.target.value)}
          placeholder="Add feedback for the user..."
          className="w-full min-h-[120px] rounded-xl border border-white/10 bg-black/20 p-4 outline-none"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={acceptTask}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl transition"
        >
          Accept Task
        </button>

        <button
          onClick={requestRevision}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-xl transition"
        >
          Request Revision
        </button>
      </div>
    </div>
  );
}
