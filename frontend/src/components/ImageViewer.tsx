"use client";

import AppModal from "@/components/AppModal";

import { ChevronLeft, ChevronRight, Download } from "lucide-react";
interface Props {
  open: boolean;
  image: string | null;
  images?: string[];
  currentIndex?: number;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function ImageViewer({
  open,
  image,
  images = [],
  currentIndex = 0,
  onClose,
  onNext,
  onPrev,
}: Props) {
  if (!image) return null;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      className="max-w-7xl overflow-hidden"
    >
      <div className="relative bg-black rounded-[32px] overflow-hidden">
        <a
          href={`${image}?download=generated-image.png`}
          className="absolute top-5 right-5 z-20 h-12 w-12 rounded-full bg-black/70 hover:bg-black backdrop-blur-sm flex items-center justify-center transition-all"
        >
          <Download className="h-5 w-5" />
        </a>
        {images.length > 1 && onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-20 h-14 w-14 rounded-full bg-black/70 hover:bg-black backdrop-blur-sm flex items-center justify-center transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {images.length > 1 && onNext && (
          <button
            onClick={onNext}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-20 h-14 w-14 rounded-full bg-black/70 hover:bg-black backdrop-blur-sm flex items-center justify-center transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        <img
          src={image}
          alt="Preview"
          className="w-full max-h-[90vh] object-contain"
        />

        {images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-black/70 backdrop-blur-sm text-sm text-gray-300">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </AppModal>
  );
}
