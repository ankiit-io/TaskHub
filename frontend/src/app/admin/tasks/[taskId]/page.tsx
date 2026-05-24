"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  product_image_url: string;
  feedback_note?: string;
}

interface Generation {
  id: string;
  image_url: string;
  image_type: string;
  is_final: boolean;
}

export default function AdminTaskReviewPage() {
  const params = useParams();

  const router = useRouter();

  const taskId = params.taskId as string;

  const [task, setTask] = useState<Task | null>(null);

  const [generations, setGenerations] = useState<Generation[]>([]);

  const [feedbackNote, setFeedbackNote] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

      toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  }

  const groupedImages = useMemo(() => {
    return {
      white: generations.filter((img) => img.image_type.includes("white")),

      theme: generations.filter((img) => img.image_type.includes("theme")),

      creative: generations.filter((img) =>
        img.image_type.includes("creative"),
      ),

      model: generations.filter((img) => img.image_type.includes("model")),
    };
  }, [generations]);

  async function acceptTask() {
    try {
      setSubmitting(true);

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

      fetchTask();

      router.refresh();
    } catch (error) {
      console.log(error);

      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function requestRevision() {
    try {
      setSubmitting(true);

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

      fetchTask();

      router.refresh();
    } catch (error) {
      console.log(error);

      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function renderImageSection(title: string, images: Generation[]) {
    return (
      <div className="border border-white/10 bg-white/5 rounded-2xl p-5">
        <h2 className="text-2xl font-semibold mb-5">{title}</h2>

        {images.length === 0 ? (
          <div className="text-gray-500 py-8 text-center border border-dashed border-white/10 rounded-xl">
            No images available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {images.map((image) => (
              <div
                key={image.id}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 hover:border-gray-500 ${
                  image.is_final
                    ? "border-green-500 ring-2 ring-green-500/30"
                    : "border-white/10"
                }`}
              >
                <img
                  src={image.image_url}
                  alt={image.image_type}
                  onClick={() => setSelectedImage(image.image_url)}
                  className="w-full h-64 object-cover cursor-pointer hover:scale-[1.01] transition-all duration-300"
                />

                <div className="p-4">
                  <p className="font-medium capitalize">
                    {image.image_type.replaceAll("_", " ")}
                  </p>

                  {image.is_final && (
                    <div className="mt-2 inline-flex items-center rounded-full bg-green-500/15 px-3 py-1 text-sm text-green-400">
                      Final Selected
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10">
        <div className="animate-pulse space-y-5">
          <div className="h-10 w-64 bg-white/10 rounded-xl"></div>

          <div className="h-32 bg-white/10 rounded-2xl"></div>

          <div className="h-96 bg-white/10 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return <div className="p-10 text-center text-red-500">Task not found</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">{task.title}</h1>

          <p className="text-gray-400 mt-3 max-w-3xl">{task.description}</p>

          <div className="mt-5">
            <span
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium capitalize ${
                task.status === "submitted"
                  ? "bg-blue-500/15 text-blue-400"
                  : task.status === "accepted"
                    ? "bg-green-500/15 text-green-400"
                    : task.status === "revision_requested"
                      ? "bg-yellow-500/15 text-yellow-400"
                      : "bg-gray-500/15 text-gray-300"
              }`}
            >
              {task.status.replaceAll("_", " ")}
            </span>
          </div>
        </div>

        <div className="border border-white/10 bg-white/5 rounded-2xl p-4">
          <p className="text-sm text-gray-400 mb-3">Original Product</p>

          <img
            src={task.product_image_url}
            alt="Original Product"
            className="w-64 rounded-xl border border-white/10"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="border border-white/10 bg-white/5 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Total Images</p>

          <h2 className="text-3xl font-bold mt-2">{generations.length}</h2>
        </div>

        <div className="border border-white/10 bg-white/5 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Final Selected</p>

          <h2 className="text-3xl font-bold mt-2">
            {generations.filter((img) => img.is_final).length}
          </h2>
        </div>

        <div className="border border-white/10 bg-white/5 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Completion</p>

          <h2 className="text-3xl font-bold mt-2">
            {Math.min(Math.round((generations.length / 8) * 100), 100)}%
          </h2>
        </div>
      </div>

      {/* Image Sections */}
      {renderImageSection("White Background", groupedImages.white)}

      {renderImageSection("Theme Backgrounds", groupedImages.theme)}

      {renderImageSection("Creative Backgrounds", groupedImages.creative)}

      {renderImageSection("Model Images", groupedImages.model)}

      {/* Feedback */}
      <div className="border border-white/10 bg-white/5 rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Review Feedback</h2>

        <textarea
          value={feedbackNote}
          onChange={(e) => setFeedbackNote(e.target.value)}
          placeholder="Add review feedback for the user..."
          className="w-full min-h-[160px] rounded-2xl border border-white/10 bg-black/20 p-5 outline-none focus:border-white/20"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          disabled={submitting}
          onClick={acceptTask}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl transition-all duration-200 active:scale-95"
        >
          {submitting ? "Processing..." : "Accept Task"}
        </button>

        <button
          disabled={submitting}
          onClick={requestRevision}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl transition-all duration-200 active:scale-95"
        >
          {submitting ? "Processing..." : "Request Revision"}
        </button>
      </div>

      {/* Fullscreen Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-6xl max-h-[90vh] rounded-2xl"
          />
        </div>
      )}
    </div>
  );
}
