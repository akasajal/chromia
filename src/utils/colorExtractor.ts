import { getClosestColorName } from "./colorNames";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface ColorData {
  rgb: RGB;
  hex: string;
  cmyk: CMYK;
  name: string;
  percentage: number;
}

/**
 * Converts RGB to HEX string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.min(255, Math.max(0, x)).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
      .toUpperCase()
  );
}

/**
 * Converts RGB to CMYK values.
 */
export function rgbToCmyk(r: number, g: number, b: number): CMYK {
  const rP = r / 255;
  const gP = g / 255;
  const bP = b / 255;

  const k = 1 - Math.max(rP, gP, bP);
  
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - rP - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gP - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bP - k) / (1 - k)) * 100);

  return { c, m, y, k: Math.round(k * 100) };
}

/**
 * Calculates Euclidean distance between two colors.
 */
function getColorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    (c1.r - c2.r) ** 2 +
    (c1.g - c2.g) ** 2 +
    (c1.b - c2.b) ** 2
  );
}

/**
 * Extracts dominant colors from an image URL using k-means clustering.
 * Runs entirely on the client side using HTML5 canvas.
 * If k is set to "auto", it dynamically calculates the optimal cluster count
 * based on the color complexity of the image.
 */
export function extractColorsFromImage(
  imageSrc: string,
  k: number | "auto" = "auto",
  sampleSize: number = 100
): Promise<ColorData[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2D context from canvas"));
          return;
        }

        // Downsample the image for faster processing
        const aspectRatio = img.width / img.height;
        canvas.width = sampleSize;
        canvas.height = Math.round(sampleSize / aspectRatio);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const pixels: RGB[] = [];

        // Collect non-transparent pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Filter out transparent pixels
          if (a >= 128) {
            pixels.push({ r, g, b });
          }
        }

        if (pixels.length === 0) {
          resolve([]);
          return;
        }

        // Determine target K value dynamically if set to "auto"
        let targetK = 8;
        if (k === "auto") {
          // Put pixels into a 3D color grid bin of size 32 (8x8x8 grid)
          const binCount = new Map<string, number>();
          for (const p of pixels) {
            const rBin = Math.floor(p.r / 32);
            const gBin = Math.floor(p.g / 32);
            const bBin = Math.floor(p.b / 32);
            const key = `${rBin},${gBin},${bBin}`;
            binCount.set(key, (binCount.get(key) || 0) + 1);
          }

          // Count bins that contain at least 1% of the total pixels to filter out noise
          const threshold = pixels.length * 0.01;
          const significantBins = Array.from(binCount.values()).filter(
            (count) => count >= threshold
          ).length;

          // Limit k between 4 (simple images) and 12 (complex ones)
          targetK = Math.max(4, Math.min(12, significantBins));
        } else {
          targetK = k;
        }

        // Run K-means Clustering
        const centroids = runKMeans(pixels, targetK);
        
        // Sort centroids by the number of pixels assigned to them
        const result = centroids.map((c) => {
          const hex = rgbToHex(c.centroid.r, c.centroid.g, c.centroid.b);
          const cmyk = rgbToCmyk(c.centroid.r, c.centroid.g, c.centroid.b);
          const name = getClosestColorName(c.centroid.r, c.centroid.g, c.centroid.b);
          const percentage = Math.round((c.count / pixels.length) * 100);

          return {
            rgb: c.centroid,
            hex,
            cmyk,
            name,
            percentage,
          };
        });

        // Filter out any 0% colors that might occur due to rounding or empty clusters
        const filteredResult = result.filter((r) => r.percentage > 0);

        // Sort descending by percentage
        filteredResult.sort((a, b) => b.percentage - a.percentage);

        resolve(filteredResult);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageSrc;
  });
}

interface Cluster {
  centroid: RGB;
  pixels: RGB[];
  count: number;
}

/**
 * K-means clustering algorithm implementation.
 */
function runKMeans(pixels: RGB[], k: number, maxIterations: number = 15): Cluster[] {
  // Step 1: Initialize centroids. Select unique random pixels.
  let centroids: RGB[] = [];
  const uniquePixels = Array.from(new Set(pixels.map(p => `${p.r},${p.g},${p.b}`)))
    .map(str => {
      const [r, g, b] = str.split(",").map(Number);
      return { r, g, b };
    });

  const numClusters = Math.min(k, uniquePixels.length);
  
  // Pick diverse centroids deterministically from unique pixels at regular intervals
  const step = Math.floor(uniquePixels.length / numClusters);
  for (let i = 0; i < numClusters; i++) {
    const index = Math.min(uniquePixels.length - 1, i * step);
    centroids.push(uniquePixels[index]);
  }

  let clusters: Cluster[] = centroids.map((c) => ({
    centroid: c,
    pixels: [],
    count: 0,
  }));

  for (let iter = 0; iter < maxIterations; iter++) {
    // Reset clusters
    clusters.forEach((c) => {
      c.pixels = [];
      c.count = 0;
    });

    // Step 2: Assign each pixel to the nearest centroid
    for (const pixel of pixels) {
      let minDistance = Infinity;
      let closestClusterIndex = 0;

      for (let i = 0; i < clusters.length; i++) {
        const dist = getColorDistance(pixel, clusters[i].centroid);
        if (dist < minDistance) {
          minDistance = dist;
          closestClusterIndex = i;
        }
      }

      clusters[closestClusterIndex].pixels.push(pixel);
      clusters[closestClusterIndex].count++;
    }

    // Step 3: Recalculate centroids
    let centroidsChanged = false;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      if (cluster.count === 0) continue;

      const sum = cluster.pixels.reduce(
        (acc, p) => {
          acc.r += p.r;
          acc.g += p.g;
          acc.b += p.b;
          return acc;
        },
        { r: 0, g: 0, b: 0 }
      );

      const newCentroid = {
        r: Math.round(sum.r / cluster.count),
        g: Math.round(sum.g / cluster.count),
        b: Math.round(sum.b / cluster.count),
      };

      if (
        newCentroid.r !== cluster.centroid.r ||
        newCentroid.g !== cluster.centroid.g ||
        newCentroid.b !== cluster.centroid.b
      ) {
        centroidsChanged = true;
        cluster.centroid = newCentroid;
      }
    }

    // If centroids didn't change, we converged early
    if (!centroidsChanged) {
      break;
    }
  }

  return clusters;
}
