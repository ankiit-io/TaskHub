"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AIStudioProps {
  taskId: string;
  productImage: string;
  taskStatus: string;
}

interface Generation {
  id: string;
  image_url: string;
  image_type: string;
  is_final: boolean;
  angle?: string;
}

export default function AIStudio({
  taskId,
  productImage,
  taskStatus,
}: AIStudioProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const isLocked = taskStatus === "submitted" || taskStatus === "accepted";

  const fetchGenerations = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}/generations`,
      );

      const data = await res.json();

      setGenerations(data);
      setProgress(data.length);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, []);

  const pollJobStatus = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/jobs/${jobId}/status`,
        );

        const data = await res.json();

        if (data.status === "completed") {
          clearInterval(interval);

          setLoading(false);

          fetchGenerations();

          toast.success("Image generated successfully!");
        }

        if (data.status === "failed") {
          clearInterval(interval);

          setLoading(false);

          toast.error(data.error || "Generation failed");
        }
      } catch (error) {
        console.log(error);
      }
    }, 2000);
  };

  const generateImages = async (type: string) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            image_type: type,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Generation failed");
        setLoading(false);
        return;
      }

      pollJobStatus(data.job_id);
    } catch (error) {
      console.log(error);

      toast.error("Something went wrong");

      setLoading(false);
    }
  };

  const markAsFinal = async (generationId: string) => {
    if (isLocked) return;

    setGenerations((prev) =>
      prev.map((image) => ({
        ...image,
        is_final: image.id === generationId,
      })),
    );

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/generations/${generationId}/final?task_id=${taskId}`,
        {
          method: "PATCH",
        },
      );
    } catch (error) {
      console.log(error);
    }
  };

  const submitTask = async () => {
    if (progress < 8) {
      toast.error("Please generate all 8 required images.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status: "submitted",
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Submission failed");
        return;
      }

      toast.success("Task submitted successfully!");

      window.location.reload();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Product Preview */}
      <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-4">Product Preview</h2>

        <img
          src={productImage}
          alt="Product"
          className="w-64 rounded-xl border"
        />
      </div>

      {/* Controls */}
      <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-4">Generate Images</h2>

        <div className="flex flex-wrap gap-3">
          <button
            disabled={loading || isLocked}
            onClick={() => generateImages("white_bg")}
            className="bg-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 hover:cursor-pointer transition-all duration-200 active:scale-95 text-white px-4 py-2 rounded-xl"
          >
            White BG
          </button>

          <button
            disabled={loading || isLocked}
            onClick={() => generateImages("theme_marble")}
            className="bg-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 hover:cursor-pointer transition-all duration-200 active:scale-95 text-white px-4 py-2 rounded-xl"
          >
            Theme
          </button>

          <button
            disabled={loading || isLocked}
            onClick={() => generateImages("creative_beach")}
            className="bg-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 hover:cursor-pointer transition-all duration-200 active:scale-95 text-white px-4 py-2 rounded-xl"
          >
            Creative
          </button>

          <button
            disabled={loading || isLocked}
            onClick={() => generateImages("model_front")}
            className="bg-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 hover:cursor-pointer transition-all duration-200 active:scale-95 text-white px-4 py-2 rounded-xl"
          >
            Model Front
          </button>

          <button
            disabled={loading || isLocked}
            onClick={() => generateImages("model_side")}
            className="bg-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 hover:cursor-pointer transition-all duration-200 active:scale-95 text-white px-4 py-2 rounded-xl"
          >
            Model Side
          </button>

          <button
            disabled={loading || isLocked}
            onClick={() => generateImages("model_closeup")}
            className="bg-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 hover:cursor-pointer transition-all duration-200 active:scale-95 text-white px-4 py-2 rounded-xl"
          >
            Model Closeup
          </button>
        </div>

        {loading && (
          <div className="mt-4 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>

            <p className="text-sm text-gray-400">Generating AI images...</p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-2">Progress</h2>

        <p className="text-gray-400">{progress}/8 images generated</p>

        <div className="mt-4">
          <button
            disabled={progress < 8 || submitting || isLocked}
            onClick={submitTask}
            className={`px-5 py-2 rounded-xl text-white transition-all duration-200 active:scale-95 ${
              progress < 8 || submitting || isLocked
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {taskStatus === "submitted"
              ? "Submitted"
              : taskStatus === "accepted"
                ? "Accepted"
                : submitting
                  ? "Submitting..."
                  : "Submit Task"}
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-4">Generated Gallery</h2>

        {generations.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            Generate AI images to start building your gallery.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((image) => (
              <div
                key={image.id}
                className={`group border rounded-xl p-3 overflow-hidden transition-all duration-200 hover:border-gray-500 ${
                  image.is_final
                    ? "border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20"
                    : ""
                }`}
              >
                <img
                  src={image.image_url}
                  alt={image.image_type}
                  className="w-full h-48 object-cover rounded-lg group-hover:scale-[1.02] transition-all duration-300"
                />

                <div className="mt-3">
                  <p className="font-medium capitalize">{image.image_type}</p>

                  {image.is_final && (
                    <p className="text-green-500 text-sm mt-1">Final Image</p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      disabled={isLocked}
                      onClick={() => markAsFinal(image.id)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 active:scale-95 ${
                        image.is_final
                          ? "bg-green-500 text-white"
                          : "bg-gray-800 hover:bg-gray-700 text-white"
                      }`}
                    >
                      {image.is_final ? "Final Selected" : "Mark Final"}
                    </button>

                    <button
                      disabled={isLocked}
                      onClick={async () => {
                        if (isLocked) return;

                        setGenerations((prev) =>
                          prev.filter((item) => item.id !== image.id),
                        );

                        setProgress((prev) => prev - 1);

                        try {
                          await fetch(
                            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/generations/${image.id}`,
                            {
                              method: "DELETE",
                            },
                          );
                        } catch (error) {
                          console.log(error);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                        isLocked
                          ? "bg-gray-500 cursor-not-allowed text-white"
                          : "bg-red-500 hover:bg-red-600 active:scale-95 text-white"
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
