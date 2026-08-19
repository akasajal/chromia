"use client";

import React, { useEffect, useRef } from "react";
import { animate } from "animejs";
import { Loader2 } from "lucide-react";

interface BlurryLoaderProps {
  isLoading: boolean;
}

export default function BlurryLoader({ isLoading }: BlurryLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) return;

    // Animate rings rotating and scaling
    const rings = ringRef.current?.querySelectorAll(".loader-ring");
    let ringAnimations: any[] = [];
    if (rings) {
      rings.forEach((ring, idx) => {
        const anim = animate(ring, {
          rotate: "360deg",
          scale: [1, 1.15, 1],
          duration: 3000,
          loop: true,
          easing: "linear",
          delay: idx * 250,
        });
        ringAnimations.push(anim);
      });
    }

    // Staggered text entrance
    if (textRef.current) {
      animate(textRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 800,
        easing: "easeOutExpo",
      });
    }

    // Pulsing floating dots
    const dots = dotsRef.current?.querySelectorAll(".loader-dot");
    let dotsAnimations: any[] = [];
    if (dots) {
      dots.forEach((dot, idx) => {
        const anim = animate(dot, {
          scale: [1, 1.8, 1],
          opacity: [0.3, 1, 0.3],
          duration: 1000,
          loop: true,
          easing: "easeOutSine",
          delay: idx * 150,
        });
        dotsAnimations.push(anim);
      });
    }

    return () => {
      ringAnimations.forEach((anim) => anim.pause());
      dotsAnimations.forEach((anim) => anim.pause());
    };
  }, [isLoading]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-theme-bg/70 backdrop-blur-md transition-all duration-500 ease-in-out ${
        isLoading ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative flex items-center justify-center w-40 h-40">
        {/* Animated Rings */}
        <div ref={ringRef} className="absolute inset-0 flex items-center justify-center">
          <div className="loader-ring absolute w-32 h-32 rounded-full border-4 border-t-theme-primary border-r-theme-secondary border-b-theme-outline border-l-transparent opacity-60"></div>
          <div className="loader-ring absolute w-24 h-24 rounded-full border-4 border-t-theme-primary border-r-transparent border-b-theme-secondary border-l-theme-outline opacity-80"></div>
          <div className="loader-ring absolute w-16 h-16 rounded-full border-4 border-t-theme-primary border-r-theme-secondary border-b-transparent border-l-theme-outline opacity-90"></div>
        </div>
        
        {/* Core Icon */}
        <Loader2 className="w-8 h-8 text-white animate-spin absolute" />
      </div>

      <div className="mt-8 text-center px-4">
        <h2
          ref={textRef}
          className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-secondary"
        >
          Analyzing Color Spectrum
        </h2>
        <div ref={dotsRef} className="flex justify-center gap-2 mt-3">
          <span className="loader-dot w-2.5 h-2.5 rounded-full bg-theme-primary"></span>
          <span className="loader-dot w-2.5 h-2.5 rounded-full bg-theme-secondary"></span>
          <span className="loader-dot w-2.5 h-2.5 rounded-full bg-theme-outline"></span>
        </div>
        <p className="text-theme-muted text-sm mt-4 max-w-xs mx-auto animate-pulse">
          Downsampling image pixels and running k-means clustering...
        </p>
      </div>
    </div>
  );
}
