"use client";

import React, { useRef, useEffect } from "react";
import { UploadCloud } from "lucide-react";
import { animate } from "animejs";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

export default function UploadZone({
  onFileSelect,
  isDragging,
  setIsDragging,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadContainerRef = useRef<HTMLDivElement>(null);

  // Stagger/spring entrance on initial mount (preserved animations)
  useEffect(() => {
    if (uploadContainerRef.current) {
      animate(uploadContainerRef.current, {
        opacity: [0, 1],
        translateY: [40, 0],
        scale: [0.98, 1],
        duration: 800,
        easing: "easeOutElastic(1, .85)",
      });
    }
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0 relative z-10">
      
      {/* Visual branding block */}
      <div className="absolute top-12 text-center select-none pointer-events-none">
        <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-theme-primary to-theme-secondary bg-clip-text text-transparent sm:text-6xl select-none">
          Chromia
        </h1>
        <p className="text-theme-muted text-xs mt-2 max-w-xs font-semibold tracking-tight uppercase opacity-65">
          Dynamic client-side color extraction
        </p>
      </div>

      {/* Drag Zone container */}
      <div
        ref={uploadContainerRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full max-w-2xl min-h-[380px] p-12 md:p-20 border border-dashed rounded-3xl cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 ${
          isDragging
            ? "border-theme-primary bg-theme-primary-container/10 scale-[1.01]"
            : "border-theme-variant/40 hover:border-theme-primary/30 bg-transparent"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          className="hidden"
          accept="image/*"
        />
        
        <div className="w-12 h-12 rounded-full border border-theme-variant/30 flex items-center justify-center mb-5 transition-transform duration-300">
          <UploadCloud className="w-6 h-6 text-theme-primary" />
        </div>

        <h3 className="text-base font-bold text-theme-txt">Drag & Drop Image Here</h3>
        <p className="text-theme-muted text-[10px] mt-1 max-w-[200px] leading-relaxed">
          Supports JPG, PNG, WEBP, and SVG. File remains on your device.
        </p>
        <span className="mt-5 px-3 py-1.5 border border-theme-variant/30 hover:border-theme-primary/40 text-theme-txt font-semibold text-xs rounded-lg transition-all duration-200">
          Browse Files
        </span>
      </div>

    </div>
  );
}
