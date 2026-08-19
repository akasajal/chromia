"use client";

import React from "react";
import { ArrowLeft, Sliders, Moon, Sun, Image as ImageIcon, Paintbrush } from "lucide-react";

interface HeaderProps {
  fileName: string | null;
  currentView: "inspector" | "palette" | "gradient";
  setCurrentView: (view: "inspector" | "palette" | "gradient") => void;
  hideLowPresence: boolean;
  setHideLowPresence: (hide: boolean) => void;
  dynamicThreshold: number;
  theme: "light" | "dark";
  toggleTheme: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleReset: () => void;
}

export default function Header({
  fileName,
  currentView,
  setCurrentView,
  hideLowPresence,
  setHideLowPresence,
  dynamicThreshold,
  theme,
  toggleTheme,
  handleReset,
}: HeaderProps) {
  const showGradientMaker = currentView === "palette" || currentView === "gradient";

  return (
    <div className="w-full max-w-7xl mx-auto px-6 pt-6 pb-2 shrink-0 z-30">
      <div className="w-full flex flex-col md:flex-row gap-4 justify-between items-center bg-theme-surface/55 backdrop-blur-sm border border-theme-variant/20 p-4 rounded-2xl transition-colors duration-300">
        
        {/* Reset & Source File */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-variant/40 text-xs font-semibold text-theme-txt hover:bg-rose-950/20 hover:text-rose-400 border border-theme-variant/30 transition-all duration-200 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Reset
          </button>
          <div className="flex flex-col">
            <span className="text-[9px] text-theme-muted font-bold uppercase tracking-wider">Source File</span>
            <span className="text-sm font-semibold text-theme-txt line-clamp-1 max-w-[150px] sm:max-w-xs md:max-w-md">
              {fileName || "Extracted Image"}
            </span>
          </div>
        </div>

        {/* Right Controls Area */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Hide Low Presence Filter */}
          <div
            className={`flex items-center gap-3 bg-theme-variant/20 px-3 py-1.5 border border-theme-variant/30 rounded-xl w-full sm:w-auto text-theme-txt transition-all duration-300 ${
              currentView !== "palette" ? "opacity-25 pointer-events-none select-none" : ""
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-theme-muted shrink-0" />
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-bold text-theme-muted uppercase tracking-wider select-none">
                Hide Low Presence ({currentView === "palette" ? `<${dynamicThreshold}%` : "--%"})
              </span>
              <button
                disabled={currentView !== "palette"}
                onClick={() => setHideLowPresence(!hideLowPresence)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hideLowPresence && currentView === "palette" ? "bg-theme-primary" : "bg-theme-variant/60"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                    hideLowPresence && currentView === "palette" ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Segment View Toggle Controls (Switches widths dynamically to prevent layout snaps) */}
          <div 
            className={`relative flex items-center bg-theme-variant/20 border border-theme-variant/30 p-1 rounded-xl shrink-0 select-none transition-all duration-300 ${
              showGradientMaker ? "w-96" : "w-64"
            }`}
          >
            {/* Sliding coral background pill */}
            <div
              className="absolute top-1 bottom-1 bg-theme-primary rounded-lg transition-all duration-300 ease-in-out"
              style={{
                left: showGradientMaker
                  ? currentView === "palette"
                    ? "calc(33.333% + 2px)"
                    : currentView === "gradient"
                    ? "calc(66.666% + 2px)"
                    : "4px"
                  : currentView === "inspector"
                  ? "4px"
                  : "calc(50% + 2px)",
                width: showGradientMaker ? "calc(33.333% - 5px)" : "calc(50% - 6px)",
              }}
            />

            <button
              onClick={() => setCurrentView("inspector")}
              className={`relative z-10 flex-1 py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-300 cursor-pointer ${
                currentView === "inspector"
                  ? "text-theme-bg"
                  : "text-theme-muted hover:text-theme-txt"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Inspector View
            </button>
            <button
              onClick={() => setCurrentView("palette")}
              className={`relative z-10 flex-1 py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-300 cursor-pointer ${
                currentView === "palette"
                  ? "text-theme-bg"
                  : "text-theme-muted hover:text-theme-txt"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Palette View
            </button>
            {showGradientMaker && (
              <button
                onClick={() => setCurrentView("gradient")}
                className={`relative z-10 flex-1 py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-300 cursor-pointer ${
                  currentView === "gradient"
                    ? "text-theme-bg"
                    : "text-theme-muted hover:text-theme-txt"
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                Gradient Maker
              </button>
            )}
          </div>

          {/* Theme Toggle Switch */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-xl bg-theme-variant/20 border border-theme-variant/30 text-theme-txt hover:bg-theme-variant/40 transition-all duration-200 cursor-pointer shrink-0"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-theme-primary" />
            ) : (
              <Sun className="w-4 h-4 text-theme-secondary" />
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
