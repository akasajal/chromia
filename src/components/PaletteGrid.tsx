"use client";

import React, { useRef } from "react";
import ColorCard from "./ColorCard";
import { ColorData } from "@/utils/colorExtractor";

interface PaletteGridProps {
  displayedColors: ColorData[];
  dynamicThreshold: number;
  setHideLowPresence: (hide: boolean) => void;
  cardsContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function PaletteGrid({
  displayedColors,
  dynamicThreshold,
  setHideLowPresence,
  cardsContainerRef,
}: PaletteGridProps) {
  return (
    <div
      ref={cardsContainerRef}
      className="flex-1 overflow-y-auto w-full min-h-0 relative z-25 transition-all duration-300"
    >
      <div className="min-h-full w-full max-w-7xl mx-auto flex flex-wrap justify-center items-start gap-6 px-6 pb-12 pt-4">
        {displayedColors.length === 0 ? (
          /* Warning when all colors are hidden by threshold */
          <div className="w-full max-w-md mx-auto text-center p-8 bg-theme-surface/70 border border-theme-variant rounded-3xl relative z-10 mb-12 shadow-2xl backdrop-blur-md transition-colors duration-300">
            <p className="text-theme-txt text-sm">
              All extracted colors in this image have less than {dynamicThreshold}% presence.
            </p>
            <button
              onClick={() => setHideLowPresence(false)}
              className="mt-4 px-4 py-2 bg-theme-primary text-theme-bg font-bold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 cursor-pointer"
            >
              Show All Colors
            </button>
          </div>
        ) : (
          /* Cards Grid mapping color objects */
          displayedColors.map((color, i) => (
            <ColorCard key={`${color.hex}-${i}`} color={color} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
