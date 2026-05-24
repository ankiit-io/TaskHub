"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import GallerySkeleton from "@/components/skeletons/GallerySkeleton";

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

const REQUIRED_TYPES = [
  "white_bg",
  "theme_marble",
  "theme_velvet",
  "creative_beach",
  "creative_luxury",
  "model_front",
  "model_side",
  "model_closeup",
];

export default function AIStudio({
  taskId,
  productImage,
  taskStatus,
}: AIStudioProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);

  const [galleryLoading, setGalleryLoading] = useState(true);

  const [loadingType, setLoadingType] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isLocked = taskStatus === "submitted" || taskStatus === "accepted";

  const fetchGenerations = async () => {
    try {
      setGalleryLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}/generations`,
      );

      const data = await res.json();

      setGenerations(data);
    } catch (error) {
      console.log(error);
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, []);

  const generatedTypes = useMemo(() => {
    return generations.map((img) => img.image_type);
  }, [generations]);

  const missingTypes = REQUIRED_TYPES.filter(
    (type) => !generatedTypes.includes(type),
  );

  const progress = REQUIRED_TYPES.filter((type) =>
    generatedTypes.includes(type),
  ).length;

  const pollJobStatus = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/jobs/${jobId}/status`,
        );

        const data = await res.json();

        if (data.status === "completed") {
          clearInterval(interval);

          setLoadingType(null);

          fetchGenerations();

          toast.success("Image generated successfully!");
        }

        if (data.status === "failed") {
          clearInterval(interval);

          setLoadingType(null);

          toast.error(data.error || "Generation failed");
        }
      } catch (error) {
        console.log(error);
      }
    }, 2000);
  };

  const generateImages = async (type: string) => {
    try {
      setLoadingType(type);

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

        setLoadingType(null);

        return;
      }

      pollJobStatus(data.job_id);
    } catch (error) {
      console.log(error);

      toast.error("Something went wrong");

      setLoadingType(null);
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

      toast.success("Final image selected");
    } catch (error) {
      console.log(error);
    }
  };

  const deleteGeneration = async (generationId: string) => {
    if (isLocked) return;

    const previous = generations;

    setGenerations((prev) => prev.filter((img) => img.id !== generationId));

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/generations/${generationId}`,
        {
          method: "DELETE",
        },
      );

      toast.success("Image deleted");
    } catch (error) {
      console.log(error);

      setGenerations(previous);

      toast.error("Failed to delete image");
    }
  };

  const submitTask = async () => {
    if (missingTypes.length > 0) {
      toast.error(
        `Missing: ${missingTypes
          .map((type) => type.replaceAll("_", " "))
          .join(", ")}`,
      );

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

  function renderGenerateButton(label: string, type: string) {
    const exists = generatedTypes.includes(type);

    return (
      <button
        disabled={!!loadingType || isLocked}
        onClick={() => generateImages(type)}
        className={`px-4 py-2 rounded-xl text-white transition-all duration-200 active:scale-95 ${
          exists
            ? "bg-green-600 hover:bg-green-700"
            : "bg-black hover:bg-gray-700"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loadingType === type ? "Generating..." : exists ? `✓ ${label}` : label}
      </button>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Product Preview */}
      <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-5">
        <h2 className="text-2xl font-semibold mb-5">Product Preview</h2>

        <img
          src={productImage}
          alt="Product"
          className="w-72 rounded-2xl border border-white/10"
        />
      </div>

      {/* Generate Controls */}
      <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-5">
        <h2 className="text-2xl font-semibold mb-5">Generate Images</h2>

        <div className="flex flex-wrap gap-3">
          {renderGenerateButton("White BG", "white_bg")}

          {renderGenerateButton("Theme Marble", "theme_marble")}

          {renderGenerateButton("Theme Velvet", "theme_velvet")}

          {renderGenerateButton("Creative Beach", "creative_beach")}

          {renderGenerateButton("Creative Luxury", "creative_luxury")}

          {renderGenerateButton("Model Front", "model_front")}

          {renderGenerateButton("Model Side", "model_side")}

          {renderGenerateButton("Model Closeup", "model_closeup")}
        </div>

        {loadingType && (
          <div className="mt-5 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>

            <p className="text-sm text-gray-400">Generating AI image...</p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-semibold">Progress</h2>

          <span className="text-lg font-medium">{progress}/8</span>
        </div>

        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-500"
            style={{
              width: `${(progress / 8) * 100}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
          {REQUIRED_TYPES.map((type) => {
            const completed = generatedTypes.includes(type);

            return (
              <div
                key={type}
                className={`rounded-xl border p-3 ${
                  completed
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <p className="capitalize text-sm">
                  {completed ? "✅" : "❌"} {type.replaceAll("_", " ")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <button
            disabled={missingTypes.length > 0 || submitting || isLocked}
            onClick={submitTask}
            className={`px-5 py-3 rounded-2xl text-white transition-all duration-200 active:scale-95 ${
              missingTypes.length > 0 || submitting || isLocked
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
      <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-5">
        <h2 className="text-2xl font-semibold mb-5">Generated Gallery</h2>

        {galleryLoading ? (
          <GallerySkeleton />
        ) : generations.length === 0 ? (
          <div className="py-16 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
            Generate AI images to start building your gallery.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {generations.map((image) => (
              <div
                key={image.id}
                className={`group border rounded-2xl overflow-hidden transition-all duration-200 hover:border-gray-500 ${
                  image.is_final
                    ? "border-green-500 ring-2 ring-green-500/30"
                    : "border-white/10"
                }`}
              >
                <img
                  src={image.image_url}
                  alt={image.image_type}
                  onClick={() => setSelectedImage(image.image_url)}
                  className="w-full h-64 object-cover cursor-pointer group-hover:scale-[1.02] transition-all duration-300"
                />

                <div className="p-4">
                  <p className="font-medium capitalize">
                    {image.image_type.replaceAll("_", " ")}
                  </p>

                  {image.is_final && (
                    <p className="text-green-500 text-sm mt-2">
                      Final Selected
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      disabled={isLocked}
                      onClick={() => markAsFinal(image.id)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 active:scale-95 ${
                        image.is_final
                          ? "bg-green-600 text-white"
                          : "bg-gray-800 hover:bg-gray-700 text-white"
                      }`}
                    >
                      {image.is_final ? "Final Selected" : "Mark Final"}
                    </button>

                    <button
                      disabled={isLocked}
                      onClick={() => deleteGeneration(image.id)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
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

      {/* Fullscreen Preview */}
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
