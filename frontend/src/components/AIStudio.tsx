"use client";

import { useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import GallerySkeleton from "@/components/skeletons/GallerySkeleton";
import ImageViewer from "@/components/ImageViewer";
import StatusBadge from "@/components/StatusBadge";

import {
  Check,
  ImageIcon,
  Maximize2,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

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

  const [viewerOpen, setViewerOpen] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);

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

  const progressPercent = Math.min(Math.round((progress / 8) * 100), 100);

  const imageUrls = generations.map((img) => img.image_url);

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
        is_final: image.id === generationId ? !image.is_final : false,
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
        className={`h-12 px-5 rounded-2xl transition-all duration-200 font-medium ${
          exists
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "border border-white/10 bg-white/5 hover:bg-white/10"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loadingType === type ? "Generating..." : exists ? `✓ ${label}` : label}
      </button>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-[1.2fr_420px] gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <StatusBadge status={taskStatus} />

            <div className="text-sm text-gray-400">AI Workflow Task</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="border border-white/10 bg-white/5 rounded-3xl p-6">
              <p className="text-sm text-gray-400">Progress</p>

              <h2 className="text-4xl font-bold mt-3">{progressPercent}%</h2>

              <div className="h-3 rounded-full bg-white/10 overflow-hidden mt-4">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 rounded-3xl p-6">
              <p className="text-sm text-gray-400">Generated Images</p>

              <h2 className="text-4xl font-bold mt-3">{generations.length}</h2>
            </div>

            <div className="border border-white/10 bg-white/5 rounded-3xl p-6">
              <p className="text-sm text-gray-400">Final Selected</p>

              <h2 className="text-4xl font-bold mt-3">
                {generations.filter((img) => img.is_final).length}
              </h2>
            </div>
          </div>
        </div>

        <div className="border border-white/10 bg-white/5 rounded-[32px] overflow-hidden h-fit sticky top-24">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-blue-400" />
              </div>

              <div>
                <p className="text-sm text-gray-400">Original Product</p>

                <h2 className="text-2xl font-bold mt-1">Reference Image</h2>
              </div>
            </div>
          </div>

          <img
            src={productImage}
            alt="Product"
            className="w-full aspect-square object-cover"
          />
        </div>
      </div>

      <div className="border border-white/10 bg-white/5 rounded-[32px] p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold">Generate Images</h2>

            <p className="text-gray-400 mt-2">
              Create AI-generated variations for this product.
            </p>
          </div>

          {loadingType && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>

              <p className="text-sm text-blue-400">AI generating image...</p>
            </div>
          )}
        </div>

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
      </div>

      <div className="border border-white/10 bg-white/5 rounded-[32px] p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold">Workflow Checklist</h2>

            <p className="text-gray-400 mt-2">
              Complete all required generations before submitting.
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 font-medium">
            {progress}/8 Completed
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {REQUIRED_TYPES.map((type) => {
            const completed = generatedTypes.includes(type);

            return (
              <div
                key={type}
                className={`rounded-2xl border p-4 transition-all ${
                  completed
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div
                    className={`text-sm font-medium ${
                      completed ? "text-green-400" : "text-gray-400"
                    }`}
                  >
                    {completed ? "Done" : "Pending"}
                  </div>
                </div>

                <p className="mt-4 font-medium capitalize">
                  {type.replaceAll("_", " ")}
                </p>
              </div>
            );
          })}
        </div>

        <button
          disabled={missingTypes.length > 0 || submitting || isLocked}
          onClick={submitTask}
          className={`h-14 px-7 rounded-2xl font-semibold transition-all ${
            missingTypes.length > 0 || submitting || isLocked
              ? "bg-gray-500 cursor-not-allowed text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
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

      <div className="border border-white/10 bg-white/5 rounded-[32px] p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold">Generated Gallery</h2>

            <p className="text-gray-400 mt-2">
              AI-generated outputs for this workflow.
            </p>
          </div>

          <div className="text-sm text-gray-400">
            {generations.length} images
          </div>
        </div>

        {galleryLoading ? (
          <GallerySkeleton />
        ) : generations.length === 0 ? (
          <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-3xl">
            <Wand2 className="h-12 w-12 mx-auto mb-5 text-gray-500" />
            Generate AI images to start building your gallery.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {generations.map((image, index) => (
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
                        setCurrentIndex(index);

                        setViewerOpen(true);
                      }}
                      className="h-11 w-11 rounded-xl bg-black/70 backdrop-blur-sm hover:bg-black flex items-center justify-center"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>

                    <button
                      disabled={isLocked}
                      onClick={() => markAsFinal(image.id)}
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

                <div className="p-5 space-y-4">
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

                  <button
                    disabled={isLocked}
                    onClick={() => deleteGeneration(image.id)}
                    className={`h-11 w-full rounded-2xl transition-all font-medium flex items-center justify-center gap-2 ${
                      isLocked
                        ? "bg-gray-500 cursor-not-allowed text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Image
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ImageViewer
        open={viewerOpen}
        image={imageUrls[currentIndex]}
        images={imageUrls}
        currentIndex={currentIndex}
        onClose={() => setViewerOpen(false)}
        onNext={() =>
          setCurrentIndex((prev) =>
            prev === imageUrls.length - 1 ? 0 : prev + 1,
          )
        }
        onPrev={() =>
          setCurrentIndex((prev) =>
            prev === 0 ? imageUrls.length - 1 : prev - 1,
          )
        }
      />
    </div>
  );
}
