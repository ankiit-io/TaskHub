"use client";

import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { toast } from "sonner";

import StatusBadge from "@/components/StatusBadge";

import ImageViewer from "@/components/ImageViewer";

import { Check, Maximize2, RotateCcw, Trash2 } from "lucide-react";

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

  const [viewerOpen, setViewerOpen] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);

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

  const allImages = generations.map((img) => img.image_url);

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
        throw new Error();
      }

      setTask((prev: any) => ({
        ...prev,
        status: "accepted",
      }));
    } catch (error) {
      console.log(error);

      toast.error("Failed to accept task");
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
        throw new Error();
      }

      setTask((prev: any) => ({
        ...prev,
        status: "revision_requested",
      }));
    } catch (error) {
      console.log(error);

      toast.error("Failed to request revision");
    } finally {
      setSubmitting(false);
    }
  }

  async function makeFinal(imageId: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/generations/${imageId}/final`,
        {
          method: "PUT",
        },
      );

      if (!res.ok) {
        throw new Error();
      }

      setGenerations((prev) =>
        prev.map((img) => ({
          ...img,
          is_final: img.id === imageId,
        })),
      );
    } catch (error) {
      console.log(error);

      toast.error("Failed to update final image");
    }
  }

  async function deleteTask() {
    try {
      router.push("/admin");

      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}`,
        {
          method: "DELETE",
        },
      );
    } catch (error) {
      console.log(error);

      toast.error("Failed to delete task");
    }
  }

  function renderImageSection(title: string, images: Generation[]) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">{title}</h2>

          <div className="text-sm text-gray-400">{images.length} images</div>
        </div>

        {images.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-3xl p-16 text-center text-gray-500 bg-white/5">
            No images available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {images.map((image) => {
              const globalIndex = allImages.indexOf(image.image_url);

              return (
                <div
                  key={image.id}
                  className={`group border rounded-3xl overflow-hidden bg-white/5 transition-all duration-300 ${
                    image.is_final
                      ? "border-green-500 ring-2 ring-green-500/20"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={image.image_url}
                      alt={image.image_type}
                      className="w-full h-72 object-cover"
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentIndex(globalIndex);

                          setViewerOpen(true);
                        }}
                        className="h-11 w-11 rounded-xl bg-black/70 backdrop-blur-sm hover:bg-black flex items-center justify-center"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => makeFinal(image.id)}
                        className={`h-11 px-4 rounded-xl backdrop-blur-sm flex items-center gap-2 ${
                          image.is_final
                            ? "bg-green-500 text-white"
                            : "bg-black/70 hover:bg-black"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                        Final
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold capitalize">
                          {image.image_type.replaceAll("_", " ")}
                        </p>

                        <p className="text-sm text-gray-400 mt-1">
                          AI Generated Image
                        </p>
                      </div>

                      {image.is_final && (
                        <div className="h-11 w-11 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-72 rounded-2xl bg-white/10"></div>

        <div className="h-52 rounded-3xl bg-white/5 border border-white/10"></div>

        <div className="grid grid-cols-3 gap-5">
          <div className="h-32 rounded-3xl bg-white/5 border border-white/10"></div>

          <div className="h-32 rounded-3xl bg-white/5 border border-white/10"></div>

          <div className="h-32 rounded-3xl bg-white/5 border border-white/10"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return <div className="text-center text-red-500 py-20">Task not found</div>;
  }

  return (
    <div className="space-y-10">
      <div className="grid lg:grid-cols-[1.3fr_420px] gap-8">
        <div className="space-y-6">
          <div className="space-y-5">
            <StatusBadge status={task.status} />

            <div>
              <h1 className="text-5xl font-bold leading-tight">{task.title}</h1>

              <p className="text-lg text-gray-400 mt-5 max-w-4xl leading-relaxed">
                {task.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="border border-white/10 bg-white/5 rounded-3xl p-6">
              <p className="text-sm text-gray-400">Total Images</p>

              <h2 className="text-4xl font-bold mt-3">{generations.length}</h2>
            </div>

            <div className="border border-white/10 bg-white/5 rounded-3xl p-6">
              <p className="text-sm text-gray-400">Final Selected</p>

              <h2 className="text-4xl font-bold mt-3">
                {generations.filter((img) => img.is_final).length}
              </h2>
            </div>

            <div className="border border-white/10 bg-white/5 rounded-3xl p-6">
              <p className="text-sm text-gray-400">Completion</p>

              <h2 className="text-4xl font-bold mt-3">
                {Math.min(Math.round((generations.length / 8) * 100), 100)}%
              </h2>

              <div className="h-3 rounded-full bg-white/10 overflow-hidden mt-4">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${Math.min((generations.length / 8) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border border-white/10 bg-white/5 rounded-[32px] overflow-hidden h-fit sticky top-24">
          <div className="p-5 border-b border-white/10">
            <p className="text-sm text-gray-400">Original Product</p>

            <h2 className="text-2xl font-bold mt-2">Reference Image</h2>
          </div>

          <img
            src={task.product_image_url}
            alt="Original Product"
            className="w-full aspect-square object-cover"
          />
        </div>
      </div>

      {renderImageSection("White Background", groupedImages.white)}

      {renderImageSection("Theme Backgrounds", groupedImages.theme)}

      {renderImageSection("Creative Backgrounds", groupedImages.creative)}

      {renderImageSection("Model Images", groupedImages.model)}

      <div className="border border-white/10 bg-white/5 rounded-[32px] p-7 space-y-5">
        <div>
          <h2 className="text-3xl font-bold">Review Feedback</h2>

          <p className="text-gray-400 mt-2">Add remarks or revision notes</p>
        </div>

        <textarea
          value={feedbackNote}
          onChange={(e) => setFeedbackNote(e.target.value)}
          placeholder="Add review feedback..."
          className="w-full min-h-[180px] rounded-3xl border border-white/10 bg-black/20 p-6 outline-none focus:border-white/20"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          disabled={submitting}
          onClick={acceptTask}
          className="h-14 px-7 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          {submitting ? "Processing..." : "Accept Task"}
        </button>

        <button
          disabled={submitting}
          onClick={requestRevision}
          className="h-14 px-7 rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold flex items-center gap-2"
        >
          <RotateCcw className="h-5 w-5" />
          Request Revision
        </button>

        <button
          onClick={deleteTask}
          className="h-14 px-7 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 font-semibold flex items-center gap-2"
        >
          <Trash2 className="h-5 w-5" />
          Delete Task
        </button>
      </div>

      <ImageViewer
        open={viewerOpen}
        image={allImages[currentIndex]}
        images={allImages}
        currentIndex={currentIndex}
        onClose={() => setViewerOpen(false)}
        onNext={() =>
          setCurrentIndex((prev) =>
            prev === allImages.length - 1 ? 0 : prev + 1,
          )
        }
        onPrev={() =>
          setCurrentIndex((prev) =>
            prev === 0 ? allImages.length - 1 : prev - 1,
          )
        }
      />
    </div>
  );
}
