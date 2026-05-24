"use client";

import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function AppModal({
  open,
  onClose,
  children,
  className = "",
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div
        className={`relative w-full border border-white/10 bg-[#0B0B0B] rounded-[32px] shadow-2xl ${className}`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-11 w-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {children}
      </div>
    </div>
  );
}
