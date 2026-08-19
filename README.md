# Chromia 🎨

**Chromia** is a minimalist, high-fidelity Next.js client-side color extraction and linear gradient designer. It allows designers and developers to upload images, extract dominant palettes dynamically, inspect precise pixel details using a zoom loupe, and compose complex overlapping CSS gradients directly from the extracted swatches.

---

## 🌟 Core Features

### 1. Dynamic Complexity-Based Palette Extraction
* **Deterministic K-Means Clustering**: Instead of extracting a static number of colors, Chromia downsamples images in-memory and dynamically estimates the color complexity bins:
  $$k = \max(4, \min(12, \text{significantBins}))$$
* **Adaptive Low-Presence Filter**: Automatically computes a dynamic presence threshold based on color density:
  $$\text{threshold} = \max(3, \min(10, \text{round}(\text{maxPercentage} \times 0.15)))$$
  Toggling "Hide Low Presence" reactively hides secondary noise colors.
* **1,566-Color NTC Naming Engine**: Employs Chirag Mehta's **Name That Color (NTC)** index. Evaluates Euclidean distances in RGB/HSL color spaces to provide precise, descriptive human names for every shade.

### 2. Interactive Eyedropper & Coordinates Inspector
* **Aspect-Correct HTML5 Picker**: Maps pointer coordinates over a responsive visual image container back to a hidden high-resolution source canvas.
* **Magnified Zoom Loupe**: Renders a full-width $60\times30$ magnified grid overlay at 2:1 aspect ratio with high-quality bilinear interpolation and a target reticle.
* **Palette Proximity Stats**: Real-time Euclidean distance solver displays:
  * **Dominance**: The presence percentage of the closest extracted palette color.
  * **Rank**: The index position rank of the closest color in the sorted list.
  * **Lightness Slider**: A visual spectrum slider mapping the lightness coordinate ($L\%$) in HSL space.

### 3. Canvas-Aligned Linear Gradient Maker
* **Unlockable Range Bands**: Each color band possesses independent **Start (S)** and **End (E)** boundary handles. Knobs can pass each other anywhere between $0\%$ and $100\%$ without clipping or locking constraints.
* **Slideable Track Segments**: Users can drag the colored segments between the knobs directly to slide the entire color band along the gradient axis.
* **Collapsible Sequence Controls & Layering**:
  * Clicking a list item expands it inline, revealing nested range sliders and manual number input overrides.
  * Adjusting the sequence order shifts the rendering depth; subsequent bands overlay on top of overlapping preceding ones.
* **Native Gap Blending**: Skips empty slots inside the stops array, letting the browser natively apply smooth linear transitions between bands rather than hard solid stripes.
* **Spacing Presets**: Instantly apply distribution presets including *Even*, *Soft (30% Blending Gaps)*, *Centered Focus*, *Start Weight*, and *End Weight*.

### 4. GPU-Accelerated Poppy Theme Transition
* **View Transitions API Integration**: Wraps theme updates inside `document.startViewTransition()` with a safe fallback mechanism.
* **Click-Anchored Concentric Reveal**: Maps pointer coordinate variables (`--click-x`, `--click-y`) on click to drive a CSS clip-path keyframe animation, producing a concentric wave expanding outward to reveal the new theme.

---

## 🛠️ Tech Stack & Architecture

* **Framework**: [Next.js 15+](https://nextjs.org) (App Router, Turbopack)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (Semantic design tokens, custom `@theme` variables)
* **State Management**: Client-side state sync with local storage hook support
* **Build Tooling**: TypeScript & SWC Compiler compiler configurations

---

## 🚀 Getting Started

### Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### Dev Server
Launch the Next.js local development environment:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your web browser.

### Build Check
Compile and check the static production builds:
```bash
npm run build
```

---

## 📂 Project Organization

```
src/
├── app/
│   ├── layout.tsx         # Root layout wrapper
│   ├── page.tsx           # Page controller & global layout sync
│   ├── globals.css        # Tailwind v4 directives & poppy transitions
│   └── icon.svg           # Custom branded vector logo
├── components/
│   ├── Header.tsx         # Sliding pill navigation segmented control
│   ├── UploadZone.tsx     # Enlarged drag-and-drop landing target
│   ├── InspectorView.tsx  # Zoom loupe canvas coordinates eyedropper
│   ├── PaletteGrid.tsx    # Card listing grid with inline name copying
│   └── GradientMaker.tsx  # Linear gradient editor and stops list
└── utils/
    ├── colorExtractor.ts  # Deterministic K-Means complexity clustering
    └── colorNames.ts      # Chirag Mehta's 1,566-color index library
```
