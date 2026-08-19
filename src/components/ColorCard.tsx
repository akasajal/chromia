"use client";

import React, { useRef, useState } from "react";
import { animate } from "animejs";
import { Copy, Check, Info } from "lucide-react";
import { ColorData } from "@/utils/colorExtractor";

interface ColorCardProps {
  color: ColorData;
  index: number;
}

export default function ColorCard({ color, index }: ColorCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { rgb, hex, cmyk, name, percentage } = color;
  const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const cmykString = `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;

  // WCAG relative luminance check to decide light/dark text overlay on the color patch
  const isLightColor = () => {
    const normalize = (val: number) => {
      const s = val / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const rL = normalize(rgb.r);
    const gL = normalize(rgb.g);
    const bL = normalize(rgb.b);
    const luminance = 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
    return luminance > 0.179;
  };

  const handleMouseEnter = () => {
    if (cardRef.current) {
      animate(cardRef.current, {
        scale: 1.02,
        translateY: -4,
        duration: 250,
        easing: "easeOutQuad",
      });
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      animate(cardRef.current, {
        scale: 1.0,
        translateY: 0,
        duration: 250,
        easing: "easeOutQuad",
      });
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    
    // Quick pop animation for the copy status
    const labelEl = cardRef.current?.querySelector(`.copy-label-${field}`);
    if (labelEl) {
      animate(labelEl, {
        scale: [1, 1.2, 1],
        duration: 300,
        easing: "easeOutBack",
      });
    }

    setTimeout(() => {
      setCopiedField(null);
    }, 1500);
  };

  const lightText = isLightColor();

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="color-card w-64 bg-theme-surface border border-theme-variant/20 rounded-xl overflow-hidden flex flex-col transition-all duration-300 shadow-none"
      style={{ transformOrigin: "bottom center" }}
    >
      {/* Color Preview Block (Click to copy name) */}
      <div
        onClick={() => copyToClipboard(name, "name")}
        className="h-32 w-full relative flex flex-col justify-between p-4 cursor-pointer select-none group/top transition-all duration-300"
        style={{ backgroundColor: hex }}
      >
        {/* Percentage pill */}
        <span
          className={`self-end px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
            lightText
              ? "bg-slate-950/10 text-slate-900 border border-slate-950/10"
              : "bg-white/10 text-white border border-white/10"
          }`}
        >
          {percentage}% presence
        </span>

        {/* Big name overlay inside the color patch */}
        <div>
          <p
            className={`text-[10px] uppercase tracking-widest font-semibold opacity-70 ${
              lightText ? "text-slate-900" : "text-slate-200"
            }`}
          >
            Dominant Shade
          </p>
          <h3
            className={`text-xl font-bold tracking-tight leading-tight line-clamp-1 flex items-center gap-1.5 ${
              lightText ? "text-slate-950" : "text-white"
            }`}
          >
            {name}
            <span className="opacity-0 group-hover/top:opacity-100 transition-opacity">
              {copiedField === "name" ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 opacity-60 shrink-0" />
              )}
            </span>
          </h3>
        </div>
      </div>

      {/* Card Details / Code Clipboard Copying */}
      <div className="p-4 flex flex-col gap-3 text-theme-txt text-xs transition-colors duration-300">
        {/* HEX row */}
        <div 
          onClick={() => copyToClipboard(hex, "hex")}
          className="flex justify-between items-center group cursor-pointer hover:bg-theme-variant/20 p-1.5 rounded-lg transition-colors duration-150"
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-theme-muted uppercase font-medium">Hex Code</span>
            <span className="font-mono font-medium text-theme-txt">{hex}</span>
          </div>
          <div className={`copy-label-hex text-theme-muted group-hover:text-theme-txt transition-colors`}>
            {copiedField === "hex" ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>

        {/* RGB row */}
        <div 
          onClick={() => copyToClipboard(rgbString, "rgb")}
          className="flex justify-between items-center group cursor-pointer hover:bg-theme-variant/20 p-1.5 rounded-lg transition-colors duration-150"
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-theme-muted uppercase font-medium">RGB Mode</span>
            <span className="font-mono text-theme-txt">{rgbString}</span>
          </div>
          <div className={`copy-label-rgb text-theme-muted group-hover:text-theme-txt transition-colors`}>
            {copiedField === "rgb" ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>

        {/* CMYK row */}
        <div 
          onClick={() => copyToClipboard(cmykString, "cmyk")}
          className="flex justify-between items-center group cursor-pointer hover:bg-theme-variant/20 p-1.5 rounded-lg transition-colors duration-150"
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-theme-muted uppercase font-medium">CMYK (Print)</span>
            <span className="font-mono text-theme-txt">{cmykString}</span>
          </div>
          <div className={`copy-label-cmyk text-theme-muted group-hover:text-theme-txt transition-colors`}>
            {copiedField === "cmyk" ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </div>
      
      {/* Click-to-copy tip inside footer */}
      <div className="px-4 py-2 bg-theme-variant/10 border-t border-theme-variant/20 flex items-center gap-1.5 text-[9px] text-theme-muted transition-colors duration-300">
        <Info className="w-3 h-3 text-theme-muted/70" />
        Click any field to copy code
      </div>
    </div>
  );
}
