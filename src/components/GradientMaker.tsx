"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sliders,
} from "lucide-react";
import { ColorData } from "@/utils/colorExtractor";

interface ColorBand {
  id: string;
  color: string;
  start: number;
  end: number;
  name: string;
  isCustom?: boolean;
}

interface GradientMakerProps {
  colors: ColorData[];
}

type Direction =
    | "to-bottom"
    | "to-top"
    | "to-right"
    | "to-left"
    | "to-bottom-right"
    | "to-top-left"
    | "to-bottom-left"
    | "to-top-right";

export default function GradientMaker({ colors }: GradientMakerProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const directions: { val: Direction; label: string; icon: React.ReactNode; deg: string }[] = [
    { val: "to-bottom", label: "Top → Bottom", icon: <ArrowDown className="w-4 h-4" />, deg: "180deg" },
    { val: "to-top", label: "Bottom → Top", icon: <ArrowUp className="w-4 h-4" />, deg: "0deg" },
    { val: "to-right", label: "Left → Right", icon: <ArrowRight className="w-4 h-4" />, deg: "90deg" },
    { val: "to-left", label: "Right → Left", icon: <ArrowLeft className="w-4 h-4" />, deg: "270deg" },
    { val: "to-bottom-right", label: "Top Left → Bottom Right", icon: <ArrowDownRight className="w-4 h-4" />, deg: "135deg" },
    { val: "to-top-left", label: "Bottom Right → Top Left", icon: <ArrowUpLeft className="w-4 h-4" />, deg: "315deg" },
    { val: "to-bottom-left", label: "Top Right → Bottom Left", icon: <ArrowDownLeft className="w-4 h-4" />, deg: "225deg" },
    { val: "to-top-right", label: "Bottom Left → Top Right", icon: <ArrowUpRight className="w-4 h-4" />, deg: "45deg" },
  ];

  const [direction, setDirection] = useState<Direction>("to-bottom");
  const [bands, setBands] = useState<ColorBand[]>([]);
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedHex, setCopiedHex] = useState(false);

  // Dragging states
  const [draggingBandId, setDraggingBandId] = useState<string | null>(null);
  const [draggingPart, setDraggingPart] = useState<"start" | "end" | "bar" | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState<number>(0);

  // Initialize gradient bands using the top 3-4 dominant colors distributed evenly as single points for smooth gradient blending by default
  useEffect(() => {
    if (colors.length === 0) return;
    const initialColors = colors.slice(0, Math.min(4, colors.length));
    const n = initialColors.length;

    const newBands = initialColors.map((c, idx) => {
      const pos = Math.round(idx * (100 / (n - 1 || 1)));
      return {
        id: `band-${idx}-${Date.now()}`,
        color: c.hex,
        start: pos,
        end: pos,
        name: c.name,
      };
    });
    setBands(newBands);
    if (newBands.length > 0) {
      setSelectedBandId(newBands[0].id);
    }
  }, [colors]);

  const activeDirection = directions.find((d) => d.val === direction) || directions[0];

  // Resolve overlapping color bands to flattened CSS gradient stops
  const resolveBandsToCss = () => {
    if (bands.length === 0) return "";

    const slots = new Array(101).fill(null);

    bands.forEach((band) => {
      const start = Math.min(band.start, band.end);
      const end = Math.max(band.start, band.end);
      for (let i = start; i <= end; i++) {
        slots[i] = band.color;
      }
    });

    const segments: { color: string | null; start: number; end: number }[] = [];
    let currentSegment: { color: string | null; start: number; end: number } | null = null;

    for (let i = 0; i <= 100; i++) {
      const color = slots[i];
      if (!currentSegment) {
        currentSegment = { color, start: i, end: i };
      } else if (currentSegment.color === color) {
        currentSegment.end = i;
      } else {
        segments.push(currentSegment);
        currentSegment = { color, start: i, end: i };
      }
    }
    if (currentSegment) {
      segments.push(currentSegment);
    }

    const cssStops = segments
        .filter((seg) => seg.color !== null)
        .map((seg) => {
          if (seg.start === seg.end) {
            return `${seg.color} ${seg.start}%`;
          } else {
            return `${seg.color} ${seg.start}% ${seg.end}%`;
          }
        });

    if (cssStops.length === 0) {
      return "#FFFFFF 0%, #FFFFFF 100%";
    }

    if (cssStops.length === 1) {
      return `${cssStops[0]}, ${cssStops[0]}`;
    }

    return cssStops.join(", ");
  };

  const stopsCssString = resolveBandsToCss();
  const gradientCss = `linear-gradient(${activeDirection.deg}, ${stopsCssString || "#FFFFFF, #FFFFFF"})`;

  const copyCssToClipboard = () => {
    navigator.clipboard.writeText(gradientCss);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  };

  const copyHexToClipboard = () => {
    const hexList = bands.map((b) => b.color).join(", ");
    navigator.clipboard.writeText(hexList);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  const toggleExtractedColor = (colorHex: string, colorName: string) => {
    const match = bands.find((b) => b.color.toUpperCase() === colorHex.toUpperCase());

    if (match) {
      if (bands.length > 2) {
        const filtered = bands.filter((b) => b.id !== match.id);
        setBands(filtered);
        if (selectedBandId === match.id && filtered.length > 0) {
          setSelectedBandId(filtered[0].id);
        }
      }
    } else {
      const newBand: ColorBand = {
        id: `band-${Date.now()}`,
        color: colorHex,
        start: 40,
        end: 60,
        name: colorName,
      };
      setBands([...bands, newBand]);
      setSelectedBandId(newBand.id);
    }
  };

  const removeBand = (id: string) => {
    if (bands.length <= 2) return;
    const filtered = bands.filter((b) => b.id !== id);
    setBands(filtered);
    if (selectedBandId === id && filtered.length > 0) {
      setSelectedBandId(filtered[0].id);
    }
  };

  const moveBandInList = (index: number, moveDirection: "up" | "down") => {
    const newIndex = moveDirection === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= bands.length) return;

    const list = [...bands];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;
    setBands(list);
  };

  const handleNumericPositionChange = (id: string, field: "start" | "end", val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setBands(
        bands.map((b) => {
          if (b.id !== id) return b;
          if (field === "start") {
            return { ...b, start: Math.min(b.end, clamped) };
          } else {
            return { ...b, end: Math.max(b.start, clamped) };
          }
        })
    );
  };

  const applyPreset = (type: "even" | "soft" | "centered" | "start" | "end") => {
    const n = bands.length;
    if (n === 0) return;

    let updated = [...bands];

    if (type === "even") {
      const segmentWidth = Math.round(100 / n);
      updated = bands.map((b, idx) => {
        const start = idx * segmentWidth;
        const end = idx === n - 1 ? 100 : (idx + 1) * segmentWidth;
        return { ...b, start, end };
      });
    } else if (type === "soft") {
      const segmentWidth = Math.round(100 / n);
      updated = bands.map((b, idx) => {
        const start = idx * segmentWidth;
        const end = Math.round(start + segmentWidth * 0.7);
        return { ...b, start, end };
      });
    } else if (type === "centered") {
      updated = bands.map((b, idx) => {
        if (idx === 0) return { ...b, start: 0, end: 20 };
        if (idx === n - 1) return { ...b, start: 80, end: 100 };
        const segmentWidth = 60 / (n - 2 || 1);
        const start = 20 + (idx - 1) * segmentWidth;
        const end = start + segmentWidth;
        return { ...b, start: Math.round(start), end: Math.round(end) };
      });
    } else if (type === "start") {
      updated = bands.map((b, idx) => {
        const r1 = idx / n;
        const r2 = (idx + 1) / n;
        const start = Math.round(Math.pow(r1, 2) * 100);
        const end = idx === n - 1 ? 100 : Math.round(Math.pow(r2, 2) * 100);
        return { ...b, start, end };
      });
    } else if (type === "end") {
      updated = bands.map((b, idx) => {
        const r1 = idx / n;
        const r2 = (idx + 1) / n;
        const start = Math.round((1 - Math.pow(1 - r1, 2)) * 100);
        const end = idx === n - 1 ? 100 : Math.round((1 - Math.pow(1 - r2, 2)) * 100);
        return { ...b, start, end };
      });
    }

    setBands(updated);
  };

  const isHorizontal = direction === "to-right" || direction === "to-left";

  const isFlipped = isHorizontal
      ? direction === "to-left"
      : direction === "to-top" || direction === "to-top-left" || direction === "to-top-right";

  const getPercentStyle = (pos: number) => {
    return isFlipped ? 100 - pos : pos;
  };

  const handleDragStart = (id: string, part: "start" | "end" | "bar", e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedBandId(id);
    setDraggingBandId(id);
    setDraggingPart(part);

    if (part === "bar" && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const ratio = isHorizontal ? mx / w : my / h;
      const clickPercent = isFlipped ? (1 - ratio) * 100 : ratio * 100;
      const band = bands.find((b) => b.id === id);
      if (band) {
        setDragStartOffset(clickPercent - band.start);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingBandId || !draggingPart || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const mx = Math.max(0, Math.min(w, e.clientX - rect.left));
      const my = Math.max(0, Math.min(h, e.clientY - rect.top));

      const ratio = isHorizontal ? mx / w : my / h;
      const newPos = isFlipped ? Math.round((1 - ratio) * 100) : Math.round(ratio * 100);

      setBands((prev) =>
          prev.map((band) => {
            if (band.id !== draggingBandId) return band;

            if (draggingPart === "start") {
              return { ...band, start: Math.min(band.end, newPos) };
            } else if (draggingPart === "end") {
              return { ...band, end: Math.max(band.start, newPos) };
            } else if (draggingPart === "bar") {
              const bandWidth = band.end - band.start;
              const targetStart = newPos - Math.round(dragStartOffset);
              const clampedStart = Math.max(0, Math.min(100 - bandWidth, targetStart));
              const clampedEnd = clampedStart + bandWidth;
              return { ...band, start: clampedStart, end: clampedEnd };
            }
            return band;
          })
      );
    };

    const handleMouseUp = () => {
      setDraggingBandId(null);
      setDraggingPart(null);
    };

    if (draggingBandId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingBandId, draggingPart, dragStartOffset, isHorizontal, isFlipped]);

  const selectedBand = bands.find((b) => b.id === selectedBandId);

  const sortedRenderBands = [...bands].sort((a, b) => {
    if (a.id === selectedBandId) return 1;
    if (b.id === selectedBandId) return -1;
    return 0;
  });

  return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 pb-6 pt-2 min-h-0 flex flex-col md:flex-row gap-6 relative z-20">

        {/* Left Panel: Fitted Gradient Preview Card */}
        <div
            ref={cardRef}
            className="flex-[3] relative border border-theme-variant/20 rounded-3xl overflow-visible min-h-[300px] md:min-h-0 flex items-center justify-center transition-all duration-300 select-none shadow-inner"
            style={{ background: gradientCss }}
        >
          <div className="absolute inset-0 overflow-visible pointer-events-none">

            {/* Main Axis guide line */}
            <div
                className={`absolute border-dashed border-white/20 pointer-events-none ${
                    isHorizontal
                        ? "left-0 right-0 top-1/2 -translate-y-1/2 border-t-[2px]"
                        : "top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-[2px]"
                }`}
            />

            {sortedRenderBands.map((band) => {
              const isSelected = band.id === selectedBandId;
              const startPct = getPercentStyle(band.start);
              const endPct = getPercentStyle(band.end);

              const startVal = Math.min(startPct, endPct);
              const sizeVal = Math.abs(endPct - startPct);

              return (
                  <div key={band.id} className="absolute inset-0 overflow-visible pointer-events-none">
                    {/* Thick slideable color segment bar */}
                    <div
                        className={`absolute rounded-full cursor-grab active:cursor-grabbing pointer-events-auto transition-all ${
                            isHorizontal
                                ? "top-1/2 -translate-y-1/2 h-[10px]"
                                : "left-1/2 -translate-x-1/2 w-[10px]"
                        } ${
                            isSelected
                                ? "opacity-100 ring-2 ring-white/50 z-30"
                                : "opacity-40 hover:opacity-80 z-10"
                        }`}
                        style={{
                          left: isHorizontal ? `${startVal}%` : "50%",
                          width: isHorizontal ? `${sizeVal}%` : undefined,
                          top: isHorizontal ? "50%" : `${startVal}%`,
                          height: isHorizontal ? undefined : `${sizeVal}%`,
                          backgroundColor: band.color,
                        }}
                        onMouseDown={(e) => handleDragStart(band.id, "bar", e)}
                    />

                    {/* S (Start) Knob */}
                    <div
                        className={`absolute w-5 h-5 rounded-full bg-white flex items-center justify-center cursor-pointer pointer-events-auto border-2 transition-all hover:scale-110 shadow-md ${
                            isSelected ? "scale-110 z-40 border-[3px]" : "z-20 border-[2px]"
                        }`}
                        style={{
                          left: isHorizontal ? `${startPct}%` : "50%",
                          top: isHorizontal ? "50%" : `${startPct}%`,
                          transform: "translate(-50%, -50%)",
                          borderColor: band.color,
                        }}
                        onMouseDown={(e) => handleDragStart(band.id, "start", e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBandId(band.id);
                        }}
                    >
                      <span className="text-[8px] font-black text-slate-800 select-none pointer-events-none">S</span>
                    </div>

                    {/* E (End) Knob */}
                    <div
                        className={`absolute w-5 h-5 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto border border-white transition-all hover:scale-110 shadow-md ${
                            isSelected ? "scale-110 z-40 border-2" : "z-20"
                        }`}
                        style={{
                          left: isHorizontal ? `${endPct}%` : "50%",
                          top: isHorizontal ? "50%" : `${endPct}%`,
                          transform: "translate(-50%, -50%)",
                          backgroundColor: band.color,
                        }}
                        onMouseDown={(e) => handleDragStart(band.id, "end", e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBandId(band.id);
                        }}
                    >
                      <span className="text-[8px] font-black text-white select-none pointer-events-none">E</span>
                    </div>
                  </div>
              );
            })}

          </div>
        </div>

        {/* Right Panel: Gradient Configuration Tools Panel */}
        <div className="flex-1 bg-theme-surface/45 border border-theme-variant/20 rounded-2xl p-5 flex flex-col backdrop-blur-sm min-h-0 text-theme-txt transition-colors duration-300">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-2.5 shrink-0">
              <Sliders className="w-3.5 h-3.5 text-theme-primary" />
              <h4 className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Gradient Settings</h4>
            </div>

            {/* Scrollable settings area — no justify-between so no dead space */}
            <div className="flex-1 flex flex-col gap-4 my-1 min-h-0 overflow-y-auto overflow-x-visible pr-1">

              {/* 1. Gradient Directions Grid */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <span className="text-[9px] font-bold text-theme-muted tracking-wider uppercase">1. Gradient Direction</span>
                <div className="grid grid-cols-4 gap-1">
                  {directions.map((d) => (
                      <button
                          key={d.val}
                          onClick={() => setDirection(d.val)}
                          className={`py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all duration-150 ${
                              direction === d.val
                                  ? "bg-theme-primary border-theme-primary text-theme-bg"
                                  : "border-theme-variant/30 text-theme-muted hover:text-theme-txt hover:bg-theme-variant/10"
                          }`}
                          title={d.label}
                      >
                        {d.icon}
                      </button>
                  ))}
                </div>
              </div>

              {/* 2. Source Extracted Colors Swatches — squircle shape */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <span className="text-[9px] font-bold text-theme-muted tracking-wider uppercase">2. Extracted Palette Swatches</span>
                <div className="flex flex-wrap gap-1.5 pb-1 overflow-visible">
                  {colors.map((c) => {
                    const isParticipating = bands.some((b) => b.color.toUpperCase() === c.hex.toUpperCase());
                    return (
                        <button
                            key={c.hex}
                            onClick={() => toggleExtractedColor(c.hex, c.name)}
                            className={`w-7 h-7 relative cursor-pointer border transition-all duration-150 ${
                                isParticipating
                                    ? "border-theme-primary scale-110 shadow-sm ring-1 ring-theme-primary"
                                    : "border-transparent opacity-65 hover:opacity-100 hover:scale-105"
                            }`}
                            style={{ backgroundColor: c.hex, borderRadius: "30%" }}
                            title={`${c.name} (${c.percentage}%)`}
                        >
                          {isParticipating && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="block w-1.5 h-1.5 rounded-full bg-white shadow-sm border border-slate-950/20" />
                              </div>
                          )}
                        </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Stops reordering list & Nested sliders */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-theme-muted tracking-wider uppercase">3. Color Layers & Range Controls</span>
                  <span className="text-[8px] text-theme-muted opacity-80 leading-normal mb-1">Select a row to expand its boundary sliders. Drag rows to adjust layering order.</span>
                </div>
                <div className="flex flex-col gap-1 border border-theme-variant/15 rounded-xl p-1.5 max-h-56 overflow-y-auto">
                  {bands.map((s, idx) => {
                    const isSelected = s.id === selectedBandId;

                    if (isSelected) {
                      return (
                          <div
                              key={s.id}
                              onClick={() => setSelectedBandId(s.id)}
                              className="flex flex-col p-2.5 rounded-lg border border-theme-primary/45 bg-theme-primary/10 transition-all duration-150 cursor-pointer"
                          >
                            {/* Row Header */}
                            <div className="flex items-center justify-between select-none">
                              <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 border border-white/10" style={{ backgroundColor: s.color, borderRadius: "30%" }} />
                                <span className="text-[10px] font-mono font-bold text-theme-txt">{s.start}% – {s.end}%</span>
                                <span className="text-[10px] font-semibold text-theme-txt truncate max-w-[80px] sm:max-w-xs">{s.name}</span>
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                    disabled={idx === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveBandInList(idx, "up");
                                    }}
                                    className="p-0.5 rounded hover:bg-theme-variant/20 disabled:opacity-20 text-theme-muted cursor-pointer"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                    disabled={idx === bands.length - 1}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveBandInList(idx, "down");
                                    }}
                                    className="p-0.5 rounded hover:bg-theme-variant/20 disabled:opacity-20 text-theme-muted cursor-pointer"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                    disabled={bands.length <= 2}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeBand(s.id);
                                    }}
                                    className="p-0.5 rounded hover:bg-rose-950/20 text-theme-muted hover:text-rose-400 disabled:opacity-25 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Sliders Area */}
                            <div className="mt-3 pt-2.5 border-t border-theme-variant/15 flex flex-col gap-2.5">
                              {/* Start Slider */}
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-[9px] text-theme-muted font-bold select-none uppercase tracking-wide">
                                  <span>Start (S) boundary</span>
                                  <span className="font-mono text-theme-txt">{s.start}%</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <input
                                      type="range"
                                      min="0"
                                      max={s.end}
                                      value={s.start}
                                      onChange={(e) => handleNumericPositionChange(s.id, "start", Number(e.target.value))}
                                      className="flex-1 accent-theme-primary cursor-pointer h-1 rounded"
                                  />
                                  <input
                                      type="number"
                                      min="0"
                                      max={s.end}
                                      value={s.start}
                                      onChange={(e) => handleNumericPositionChange(s.id, "start", Number(e.target.value))}
                                      className="w-10 bg-theme-bg/40 border border-theme-variant/25 rounded px-1 py-0.5 text-center font-mono text-[10px] focus:outline-none text-theme-txt"
                                  />
                                </div>
                              </div>

                              {/* End Slider */}
                              <div className="flex flex-col gap-1 mt-0.5">
                                <div className="flex justify-between items-center text-[9px] text-theme-muted font-bold select-none uppercase tracking-wide">
                                  <span>End (E) boundary</span>
                                  <span className="font-mono text-theme-txt">{s.end}%</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <input
                                      type="range"
                                      min={s.start}
                                      max="100"
                                      value={s.end}
                                      onChange={(e) => handleNumericPositionChange(s.id, "end", Number(e.target.value))}
                                      className="flex-1 accent-theme-primary cursor-pointer h-1 rounded"
                                  />
                                  <input
                                      type="number"
                                      min={s.start}
                                      max="100"
                                      value={s.end}
                                      onChange={(e) => handleNumericPositionChange(s.id, "end", Number(e.target.value))}
                                      className="w-10 bg-theme-bg/40 border border-theme-variant/25 rounded px-1 py-0.5 text-center font-mono text-[10px] focus:outline-none text-theme-txt"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                      );
                    }

                    return (
                        <div
                            key={s.id}
                            onClick={() => setSelectedBandId(s.id)}
                            className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:bg-theme-variant/10 transition-all duration-150 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 select-none">
                            <div className="w-3 h-3 border border-white/5" style={{ backgroundColor: s.color, borderRadius: "30%" }} />
                            <span className="text-[9.5px] font-mono font-medium text-theme-muted">{s.start}% – {s.end}%</span>
                            <span className="text-[9.5px] text-theme-muted truncate max-w-[80px] sm:max-w-xs">{s.name}</span>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveBandInList(idx, "up");
                                }}
                                className="p-0.5 rounded hover:bg-theme-variant/20 disabled:opacity-20 text-theme-muted cursor-pointer"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                                disabled={idx === bands.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveBandInList(idx, "down");
                                }}
                                className="p-0.5 rounded hover:bg-theme-variant/20 disabled:opacity-20 text-theme-muted cursor-pointer"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                                disabled={bands.length <= 2}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeBand(s.id);
                                }}
                                className="p-0.5 rounded hover:bg-rose-950/20 text-theme-muted hover:text-rose-400 disabled:opacity-25 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Presets Section */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <span className="text-[9px] font-bold text-theme-muted tracking-wider uppercase">4. Spacing Presets</span>
                <div className="flex flex-wrap gap-1">
                  <button
                      onClick={() => applyPreset("even")}
                      className="px-2 py-1 bg-theme-variant/20 hover:bg-theme-variant/40 border border-theme-variant/30 text-[9px] font-bold rounded cursor-pointer"
                  >
                    Even (Solid Blocks)
                  </button>
                  <button
                      onClick={() => applyPreset("soft")}
                      className="px-2 py-1 bg-theme-variant/20 hover:bg-theme-variant/40 border border-theme-variant/30 text-[9px] font-bold rounded cursor-pointer"
                  >
                    Soft (Gradual Blends)
                  </button>
                  <button
                      onClick={() => applyPreset("centered")}
                      className="px-2 py-1 bg-theme-variant/20 hover:bg-theme-variant/40 border border-theme-variant/30 text-[9px] font-bold rounded cursor-pointer"
                  >
                    Centered Focus
                  </button>
                  <button
                      onClick={() => applyPreset("start")}
                      className="px-2 py-1 bg-theme-variant/20 hover:bg-theme-variant/40 border border-theme-variant/30 text-[9px] font-bold rounded cursor-pointer"
                  >
                    Start Weight
                  </button>
                  <button
                      onClick={() => applyPreset("end")}
                      className="px-2 py-1 bg-theme-variant/20 hover:bg-theme-variant/40 border border-theme-variant/30 text-[9px] font-bold rounded cursor-pointer"
                  >
                    End Weight
                  </button>
                </div>
              </div>

              {/* 5. Output Section — now inside the scroll area, no dead space above it */}
              <div className="pt-4 border-t border-theme-variant/20 flex flex-col gap-2 shrink-0">
                <span className="text-[9px] font-bold text-theme-muted tracking-wider uppercase">5. Output CSS</span>

                <div className="bg-theme-bg/30 border border-theme-variant/20 rounded-xl p-2.5 font-mono text-[9px] leading-relaxed text-theme-muted select-all max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {`linear-gradient(
  ${activeDirection.deg},
  ${stopsCssString}
)`}
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                      onClick={copyCssToClipboard}
                      className="flex-1 py-1.5 border border-theme-primary/30 hover:bg-theme-primary/10 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedCss ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Copied CSS
                        </>
                    ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy CSS
                        </>
                    )}
                  </button>
                  <button
                      onClick={copyHexToClipboard}
                      className="flex-1 py-1.5 border border-theme-variant/30 hover:bg-theme-variant/20 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedHex ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Copied HEX
                        </>
                    ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy HEX
                        </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
  );
}