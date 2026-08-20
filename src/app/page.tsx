"use client";

import React, { useState, useRef, useEffect } from "react";
import { animate } from "animejs";
import { extractColorsFromImage, ColorData } from "@/utils/colorExtractor";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import InspectorView from "@/components/InspectorView";
import PaletteGrid from "@/components/PaletteGrid";
import BlurryLoader from "@/components/BlurryLoader";
import GradientMaker from "@/components/GradientMaker";

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [colors, setColors] = useState<ColorData[]>([]);
  const [hoveredColor, setHoveredColor] = useState<ColorData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hideLowPresence, setHideLowPresence] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<"inspector" | "palette" | "gradient">("inspector");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Initialize theme from localStorage on client mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    } else {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const x = e.clientX;
    const y = e.clientY;
    document.documentElement.style.setProperty("--click-x", `${x}px`);
    document.documentElement.style.setProperty("--click-y", `${y}px`);

    const performToggle = () => {
      const nextTheme = theme === "light" ? "dark" : "light";
      setTheme(nextTheme);
      localStorage.setItem("theme", nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    };

    const doc = document as any;
    if (doc.startViewTransition) {
      doc.startViewTransition(performToggle);
    } else {
      performToggle();
    }
  };

  // Filter thresholds logic
  const maxPercentage = colors.length > 0 ? Math.max(...colors.map((c) => c.percentage)) : 0;
  const dynamicThreshold = colors.length > 0
    ? Math.max(3, Math.min(10, Math.round(maxPercentage * 0.15)))
    : 10;

  const displayedColors = hideLowPresence
    ? colors.filter((color) => color.percentage >= dynamicThreshold)
    : colors;

  // Handle color extraction process
  const processImage = async (src: string) => {
    setIsProcessing(true);
    setColors([]);
    setHoveredColor(null);
    setCurrentView("inspector");
    
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    
    try {
      await delay(800);
      const extracted = await extractColorsFromImage(src, "auto");
      setColors(extracted);
    } catch (error) {
      console.error("Extraction error:", error);
      alert("Failed to extract colors. Make sure it's a valid image file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setImageSrc(e.target.result);
        processImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    const cards = document.querySelectorAll(".color-card");
    const performReset = () => {
      setImageSrc(null);
      setColors([]);
      setFileName(null);
      setHideLowPresence(false);
      setHoveredColor(null);
      setCurrentView("inspector");
    };

    if (cards.length > 0 && currentView === "palette") {
      animate(".color-card", {
        opacity: [1, 0],
        scale: [1, 0.9],
        translateY: [0, 50],
        duration: 300,
        easing: "easeInQuad",
      }).then(performReset);
    } else {
      performReset();
    }
  };

  return (
    <main className="relative min-h-screen md:h-screen w-full flex flex-col justify-between md:overflow-hidden bg-theme-bg font-sans select-none transition-colors duration-300">
      
      {/* Background Image fixed layer */}
      {imageSrc && (
        <div
          className={`fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 ${
            isProcessing ? "blur-2xl scale-110 opacity-50" : "blur-none opacity-25"
          }`}
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
      )}

      {/* Shading gradient overlay layer */}
      {imageSrc && (
        <div className="fixed inset-0 z-10 bg-gradient-to-t from-theme-bg via-theme-bg/30 to-transparent pointer-events-none transition-colors duration-300" />
      )}

      {/* Spinner modal */}
      <BlurryLoader isLoading={isProcessing} />

      {/* Header controls toolbar */}
      {imageSrc && colors.length > 0 && !isProcessing && (
        <Header
          fileName={fileName}
          currentView={currentView}
          setCurrentView={setCurrentView}
          hideLowPresence={hideLowPresence}
          setHideLowPresence={setHideLowPresence}
          dynamicThreshold={dynamicThreshold}
          theme={theme}
          toggleTheme={toggleTheme}
          handleReset={handleReset}
        />
      )}

      {/* View router contents */}
      {!imageSrc ? (
        /* View 1: Upload Dropzone screen */
        <UploadZone
          onFileSelect={handleFileSelect}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
        />
      ) : colors.length > 0 && !isProcessing ? (
        currentView === "inspector" ? (
          /* View 2: Split screen pixel eyedropper inspector */
          <InspectorView
            imageSrc={imageSrc}
            hoveredColor={hoveredColor}
            setHoveredColor={setHoveredColor}
            colors={colors}
          />
        ) : currentView === "palette" ? (
          /* View 3: Dominant card listings layout */
          <PaletteGrid
            displayedColors={displayedColors}
            dynamicThreshold={dynamicThreshold}
            setHideLowPresence={setHideLowPresence}
            cardsContainerRef={cardsContainerRef}
          />
        ) : (
          /* View 4: Gradient maker screen */
          <GradientMaker colors={colors} />
        )
      ) : (
        /* Fallback idle state wrapper */
        <div className="flex-1" />
      )}
    </main>
  );
}
