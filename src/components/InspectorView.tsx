"use client";

import React, { useRef, useEffect } from "react";
import { Info, Sliders } from "lucide-react";
import { ColorData } from "@/utils/colorExtractor";
import { getClosestColorName } from "@/utils/colorNames";

interface InspectorViewProps {
  imageSrc: string;
  hoveredColor: ColorData | null;
  setHoveredColor: (color: ColorData | null) => void;
  colors: ColorData[];
}

export default function InspectorView({
  imageSrc,
  hoveredColor,
  setHoveredColor,
  colors,
}: InspectorViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null);

  // Helper to find the closest color in the extracted palette
  const getClosestPaletteColor = (rgb?: { r: number; g: number; b: number }) => {
    if (!rgb || colors.length === 0) return null;
    let closestColor = colors[0];
    let minDistance = Infinity;

    for (const color of colors) {
      const distance =
        Math.pow(color.rgb.r - rgb.r, 2) +
        Math.pow(color.rgb.g - rgb.g, 2) +
        Math.pow(color.rgb.b - rgb.b, 2);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }
    return closestColor;
  };

  const getHslStats = (rgb?: { r: number; g: number; b: number }) => {
    if (!rgb) return { brightness: 0, saturation: 0 };
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    const l = (max + min) / 2;
    const s = l === 0 || l === 1 ? 0 : d / (1 - Math.abs(2 * l - 1));

    return {
      brightness: Math.round(l * 100),
      saturation: Math.round(s * 100),
    };
  };

  const closestPaletteColor = hoveredColor ? getClosestPaletteColor(hoveredColor.rgb) : null;
  const rank = closestPaletteColor ? colors.indexOf(closestPaletteColor) + 1 : 0;
  const hslStats = hoveredColor ? getHslStats(hoveredColor.rgb) : { brightness: 0, saturation: 0 };

  // Draw loaded image to an in-memory high-res canvas for smooth coordinate color picking
  useEffect(() => {
    if (!imageSrc) {
      hiddenCanvasRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Scale to max 1600px for high precision NTC naming on detailed assets
      const maxDim = 1600;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const scale = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        hiddenCanvasRef.current = canvas;
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Canvas Eyedropper pixel detection & Zoom Loupe drawing
  const updatePickedColor = (clientX: number, clientY: number) => {
    const img = imgRef.current;
    const canvas = hiddenCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!img || !canvas || !ctx) return;

    const rect = img.getBoundingClientRect();
    const xRatio = (clientX - rect.left) / rect.width;
    const yRatio = (clientY - rect.top) / rect.height;

    // Map ratios to hidden canvas dimensions
    const x = Math.max(0, Math.min(canvas.width - 1, Math.round(xRatio * canvas.width)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.round(yRatio * canvas.height)));

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];

      const hex = "#" + [r, g, b].map((val) => {
        const h = val.toString(16);
        return h.length === 1 ? "0" + h : h;
      }).join("").toUpperCase();

      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;
      const k = 1 - Math.max(rNorm, gNorm, bNorm);
      const c = k === 1 ? 0 : Math.round((1 - rNorm - k) / (1 - k) * 100);
      const m = k === 1 ? 0 : Math.round((1 - gNorm - k) / (1 - k) * 100);
      const yVal = k === 1 ? 0 : Math.round((1 - bNorm - k) / (1 - k) * 100);
      const kVal = Math.round(k * 100);

      const colorName = getClosestColorName(r, g, b);

      setHoveredColor({
        hex,
        name: colorName,
        rgb: { r, g, b },
        cmyk: { c, m, y: yVal, k: kVal },
        percentage: 0,
      });

      // Update the zoomed loupe canvas around cursor (smooth pan view)
      const zoomCanvas = zoomCanvasRef.current;
      const zoomCtx = zoomCanvas?.getContext("2d");
      if (zoomCanvas && zoomCtx) {
        const cropW = 60; // 2.5:1 aspect ratio crop width
        const cropH = 24; // 2.5:1 aspect ratio crop height
        const targetW = zoomCanvas.width;
        const targetH = zoomCanvas.height;
        
        // Enable high-quality bilinear interpolation for smooth magnification
        zoomCtx.imageSmoothingEnabled = true;
        zoomCtx.imageSmoothingQuality = "high";

        // Calculate crop bounds (clamp at edges)
        const sx = Math.max(0, Math.min(canvas.width - cropW, x - Math.floor(cropW / 2)));
        const sy = Math.max(0, Math.min(canvas.height - cropH, y - Math.floor(cropH / 2)));

        zoomCtx.drawImage(
          canvas,
          sx, sy, cropW, cropH,
          0, 0, targetW, targetH
        );

        // Draw precision targeting reticle in the center
        const cx = targetW / 2;
        const cy = targetH / 2;
        
        zoomCtx.strokeStyle = isLightColor({ r, g, b }) ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.7)";
        zoomCtx.lineWidth = 1.5;

        // Draw crosshair axes
        zoomCtx.beginPath();
        zoomCtx.moveTo(cx - 16, cy);
        zoomCtx.lineTo(cx + 16, cy);
        zoomCtx.moveTo(cx, cy - 12);
        zoomCtx.lineTo(cx, cy + 12);
        zoomCtx.stroke();

        // Draw central target dot outline
        zoomCtx.beginPath();
        zoomCtx.arc(cx, cy, 4, 0, 2 * Math.PI);
        zoomCtx.stroke();
      }
    } catch (err) {
      console.error("Canvas read error:", err);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    updatePickedColor(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLImageElement>) => {
    if (e.touches.length > 0) {
      if (e.cancelable) {
        e.preventDefault();
      }
      updatePickedColor(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // WCAG relative luminance check for light/dark text choice
  const isLightColor = (rgb?: { r: number; g: number; b: number }) => {
    if (!rgb) return false;
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

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 pb-6 pt-2 min-h-0 flex flex-col md:flex-row gap-6 relative z-20">
      
      {/* Left Panel: Fitted Image Container */}
      <div className="flex-[3] border border-theme-variant/20 bg-theme-surface/35 rounded-3xl p-4 flex items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[400px] md:min-h-0 relative">
        <img
          ref={imgRef}
          src={imageSrc}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchMove}
          onTouchMove={handleTouchMove}
          onMouseLeave={() => setHoveredColor(null)}
          className="max-w-full max-h-full object-contain rounded-2xl border border-theme-variant/15 cursor-crosshair touch-none"
        />
      </div>

      {/* Right Panel: Picker Details Info (Fitted copy fields) */}
      <div className="flex-1 bg-theme-surface/45 border border-theme-variant/20 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-sm min-h-0 text-theme-txt transition-colors duration-300">
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Eyedropper Header */}
          <div className="flex items-center gap-1.5 mb-2.5 shrink-0">
            <Sliders className="w-3.5 h-3.5 text-theme-primary" />
            <h4 className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Eyedropper Coordinates</h4>
          </div>

          <div className="flex-1 flex flex-col justify-between my-1 md:min-h-0 md:overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
              
              {/* Row 1: Zoom Block (Full Width of Card container) */}
              <div className="w-full h-28 rounded-xl border border-theme-variant/20 bg-theme-bg/25 overflow-hidden relative flex items-center justify-center shrink-0">
                {hoveredColor ? (
                  <canvas
                    ref={zoomCanvasRef}
                    width={280}
                    height={112}
                    className="w-full h-full block object-cover"
                  />
                ) : (
                  /* Zoom block empty state */
                  <div className="w-full h-full flex flex-col items-center justify-center bg-theme-bg/15 text-theme-muted relative select-none">
                    <div className="w-8 h-8 rounded-full border border-dashed border-theme-variant/40 flex items-center justify-center mb-1 animate-pulse">
                      <Sliders className="w-4 h-4 text-theme-primary" />
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60">Zoom Loupe Idle</span>
                  </div>
                )}
              </div>

              {/* Row 2: Color Preview block (Full Width of Card container) */}
              {hoveredColor ? (
                <div
                  className="w-full h-24 rounded-xl relative flex flex-col justify-between p-3 select-none border border-white/5 shrink-0"
                  style={{ backgroundColor: hoveredColor.hex }}
                >
                  <span
                    className={`self-end px-2.5 py-0.5 text-[9px] font-semibold rounded-full backdrop-blur-sm ${
                      isLightColor(hoveredColor.rgb)
                        ? "bg-slate-950/10 text-slate-900 border border-slate-950/10"
                        : "bg-white/10 text-white border border-white/10"
                    }`}
                  >
                    Selected pixel
                  </span>

                  <div>
                    <p
                      className={`text-[8px] uppercase tracking-widest font-semibold opacity-70 ${
                        isLightColor(hoveredColor.rgb) ? "text-slate-900" : "text-slate-200"
                      }`}
                    >
                      Dominant Shade
                    </p>
                    <h3
                      className={`text-base font-bold tracking-tight leading-tight line-clamp-1 flex items-center gap-1.5 ${
                        isLightColor(hoveredColor.rgb) ? "text-slate-950" : "text-white"
                      }`}
                    >
                      {hoveredColor.name}
                    </h3>
                  </div>
                </div>
              ) : (
                /* Color Preview Block empty state */
                <div className="w-full h-24 rounded-xl relative flex flex-col justify-between p-3 border border-theme-variant/20 bg-theme-surface/50 text-theme-muted select-none shrink-0">
                  <span className="self-end px-2.5 py-0.5 text-[9px] font-semibold rounded-full border border-theme-variant/35 bg-theme-bg/25">
                    Offline
                  </span>
                  <div>
                    <p className="text-[8px] uppercase tracking-widest font-semibold opacity-70 text-theme-muted">
                      Dominant Shade
                    </p>
                    <h3 className="text-base font-bold tracking-tight leading-tight text-theme-muted/80">
                      No Color Selected
                    </h3>
                  </div>
                </div>
              )}

              {/* Row 3: Details rows (with empty states) */}
              <div className="flex flex-col gap-2 text-xs transition-all duration-300">
                {hoveredColor ? (
                  <>
                    {/* HEX row */}
                    <div className="flex justify-between items-center p-1.5 rounded-lg border border-theme-variant/15 bg-theme-bg/5 select-none">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-theme-muted uppercase font-medium">Hex Code</span>
                        <span className="font-mono font-medium text-theme-txt">{hoveredColor.hex}</span>
                      </div>
                    </div>

                    {/* RGB row */}
                    <div className="flex justify-between items-center p-1.5 rounded-lg border border-theme-variant/15 bg-theme-bg/5 select-none">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-theme-muted uppercase font-medium">RGB Mode</span>
                        <span className="font-mono text-theme-txt">
                          rgb({hoveredColor.rgb.r}, {hoveredColor.rgb.g}, {hoveredColor.rgb.b})
                        </span>
                      </div>
                    </div>

                    {/* CMYK row */}
                    <div className="flex justify-between items-center p-1.5 rounded-lg border border-theme-variant/15 bg-theme-bg/5 select-none">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-theme-muted uppercase font-medium">CMYK (Print)</span>
                        <span className="font-mono text-theme-txt">
                          {hoveredColor.cmyk.c}%, {hoveredColor.cmyk.m}%, {hoveredColor.cmyk.y}%, {hoveredColor.cmyk.k}%
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* HEX row empty state */}
                    <div className="flex justify-between items-center p-1.5 rounded-lg border border-dashed border-theme-variant/20 opacity-50 select-none">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-theme-muted uppercase font-medium">Hex Code</span>
                        <span className="font-mono font-medium text-theme-muted/80">#------</span>
                      </div>
                    </div>

                    {/* RGB row empty state */}
                    <div className="flex justify-between items-center p-1.5 rounded-lg border border-dashed border-theme-variant/20 opacity-50 select-none">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-theme-muted uppercase font-medium">RGB Mode</span>
                        <span className="font-mono text-theme-muted/80">rgb(--, --, --)</span>
                      </div>
                    </div>

                    {/* CMYK row empty state */}
                    <div className="flex justify-between items-center p-1.5 rounded-lg border border-dashed border-theme-variant/20 opacity-50 select-none">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-theme-muted uppercase font-medium">CMYK (Print)</span>
                        <span className="font-mono text-theme-muted/80">--%, --%, --%, --%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Row 4: Palette Position section */}
              <div className="mt-2.5 pt-2.5 border-t border-theme-variant/20 shrink-0">
                <h5 className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">
                  Palette
                </h5>

                {hoveredColor && closestPaletteColor ? (
                  <div className="bg-theme-bg/25 border border-theme-variant/20 rounded-xl p-3 text-theme-txt flex flex-col justify-between relative">
                    <div className="flex justify-between items-center mb-1.5 select-none">
                      <span className="text-[9px] font-bold text-theme-muted tracking-wider uppercase">Palette</span>
                      <span className="font-mono text-xs font-semibold text-theme-muted">{closestPaletteColor.hex}</span>
                    </div>

                    <div className="flex flex-col gap-1 text-xs select-none">
                      <div className="flex justify-between items-center">
                        <span className="text-theme-muted text-[10px]">Dominance</span>
                        <span className="font-mono font-medium">{closestPaletteColor.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-muted text-[10px]">Rank</span>
                        <span className="font-mono font-medium">{rank} of {colors.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-muted text-[10px]">Brightness</span>
                        <span className="font-mono font-medium">{hslStats.brightness}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-muted text-[10px]">Saturation</span>
                        <span className="font-mono font-medium">{hslStats.saturation}%</span>
                      </div>
                    </div>

                    {/* Lightness Slider */}
                    <div className="flex items-center justify-between text-[9px] text-theme-muted mt-3 shrink-0 select-none">
                      <span>Dark</span>
                      <div className="flex-1 mx-3 h-[2px] bg-theme-variant/30 relative rounded-full">
                        <div
                          className="absolute w-2 h-2 rounded-full bg-theme-primary -top-1 -translate-x-1/2 transition-all duration-150"
                          style={{ left: `${hslStats.brightness}%` }}
                        />
                      </div>
                      <span>Light</span>
                    </div>
                  </div>
                ) : (
                  /* Empty state for Palette Position */
                  <div className="bg-theme-bg/10 border border-dashed border-theme-variant/25 rounded-xl p-3 text-theme-muted flex flex-col justify-between select-none opacity-55">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-bold text-theme-muted/70 tracking-wider uppercase">Palette</span>
                      <span className="font-mono text-xs text-theme-muted/50">#------</span>
                    </div>

                    <div className="flex flex-col gap-1 text-xs opacity-50">
                      <div className="flex justify-between items-center">
                        <span className="text-theme-muted text-[10px]">Dominance</span>
                        <span className="font-mono font-medium">--%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-muted text-[10px]">Rank</span>
                        <span className="font-mono font-medium">-- of --</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-muted text-[10px]">Brightness</span>
                        <span className="font-mono font-medium">--%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-muted text-[10px]">Saturation</span>
                        <span className="font-mono font-medium">--%</span>
                      </div>
                    </div>

                    {/* Lightness Slider empty */}
                    <div className="flex items-center justify-between text-[9px] text-theme-muted mt-3 shrink-0 opacity-40">
                      <span>Dark</span>
                      <div className="flex-1 mx-3 h-[2px] bg-theme-variant/20 relative rounded-full" />
                      <span>Light</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Legend Section */}
              <div className="mt-2.5 pt-2.5 border-t border-theme-variant/20 flex flex-col gap-2 text-[9px] text-theme-muted shrink-0 select-none">
                <h6 className="font-bold uppercase tracking-wider text-[8px] text-theme-primary">Metric Legend</h6>
                <div className="grid grid-cols-1 gap-1 leading-relaxed font-medium">
                  <div>
                    <span className="text-theme-txt font-semibold">Palette:</span> The closest matching dominant color cluster in the image.
                  </div>
                  <div>
                    <span className="text-theme-txt font-semibold">Dominance:</span> The percentage weight of this color in the overall image area.
                  </div>
                  <div>
                    <span className="text-theme-txt font-semibold">Rank:</span> Prominence order of the color from most to least dominant.
                  </div>
                  <div>
                    <span className="text-theme-txt font-semibold">Brightness/Saturation:</span> Color space coordinates of the exact hovered pixel.
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Tip bar */}
        <div className="pt-4 border-t border-theme-variant/20 flex items-center gap-1.5 text-[9px] text-theme-muted shrink-0">
          <Info className="w-3.5 h-3.5 text-theme-muted/70 shrink-0" />
          <span>Hover on the image to inspect coordinates. Go to Palette View to view and copy any color data field.</span>
        </div>
      </div>

    </div>
  );
}
