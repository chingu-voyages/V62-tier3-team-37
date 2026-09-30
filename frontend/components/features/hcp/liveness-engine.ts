export type MotionDirection = "left" | "right" | "none";

export type LivenessFrame = {
  luminance: Uint8ClampedArray;
  signature: number;
};

export type MotionMeasurement = {
  score: number;
  direction: MotionDirection;
  horizontalShift: number;
};

export const LIVENESS_FRAME_WIDTH = 160;
export const LIVENESS_FRAME_HEIGHT = 120;
export const LIVENESS_SAMPLE_INTERVAL_MS = 120;
export const LIVENESS_PREPARE_MS = 800;
export const LIVENESS_CHALLENGE_TIMEOUT_MS = 20_000;
export const LIVENESS_MOTION_THRESHOLD = 4;
export const LIVENESS_STILL_THRESHOLD = 2.5;
export const LIVENESS_STILL_SAMPLE_COUNT = 5;

const ANALYSIS_WIDTH = LIVENESS_FRAME_WIDTH / 2;
const ANALYSIS_HEIGHT = LIVENESS_FRAME_HEIGHT / 2;
const MAX_HORIZONTAL_SHIFT = 6;

export function sampleVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): LivenessFrame | null {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  if (canvas.width !== LIVENESS_FRAME_WIDTH || canvas.height !== LIVENESS_FRAME_HEIGHT) {
    canvas.width = LIVENESS_FRAME_WIDTH;
    canvas.height = LIVENESS_FRAME_HEIGHT;
  }

  context.drawImage(video, 0, 0, LIVENESS_FRAME_WIDTH, LIVENESS_FRAME_HEIGHT);
  const imageData = context.getImageData(0, 0, LIVENESS_FRAME_WIDTH, LIVENESS_FRAME_HEIGHT);
  const luminance = new Uint8ClampedArray(LIVENESS_FRAME_WIDTH * LIVENESS_FRAME_HEIGHT);
  let signature = 0;

  for (
    let pixelIndex = 0, dataIndex = 0;
    dataIndex < imageData.data.length;
    pixelIndex += 1, dataIndex += 4
  ) {
    const red = imageData.data[dataIndex];
    const green = imageData.data[dataIndex + 1];
    const blue = imageData.data[dataIndex + 2];
    const value = (red * 77 + green * 150 + blue * 29) >> 8;

    luminance[pixelIndex] = value;
    signature = (signature * 31 + value) >>> 0;
  }

  return { luminance, signature };
}

function createAnalysisFrame(frame: Uint8ClampedArray): Uint8ClampedArray {
  const analysisFrame = new Uint8ClampedArray(ANALYSIS_WIDTH * ANALYSIS_HEIGHT);

  for (let y = 0; y < ANALYSIS_HEIGHT; y += 1) {
    for (let x = 0; x < ANALYSIS_WIDTH; x += 1) {
      const topLeft = (y * 2 * LIVENESS_FRAME_WIDTH + x * 2) >>> 0;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + LIVENESS_FRAME_WIDTH;
      const bottomRight = bottomLeft + 1;

      analysisFrame[y * ANALYSIS_WIDTH + x] = Math.round(
        (frame[topLeft] + frame[topRight] + frame[bottomLeft] + frame[bottomRight]) / 4,
      );
    }
  }

  return analysisFrame;
}

export function measureMotion(
  previousFrame: Uint8ClampedArray,
  currentFrame: Uint8ClampedArray,
): MotionMeasurement {
  const previousAnalysis = createAnalysisFrame(previousFrame);
  const currentAnalysis = createAnalysisFrame(currentFrame);
  let totalDifference = 0;
  let comparisonCount = 0;
  let bestShift = 0;
  let bestError = Number.POSITIVE_INFINITY;

  for (let y = 2; y < ANALYSIS_HEIGHT - 2; y += 1) {
    for (let x = 2; x < ANALYSIS_WIDTH - 2; x += 1) {
      totalDifference += Math.abs(
        previousAnalysis[y * ANALYSIS_WIDTH + x] - currentAnalysis[y * ANALYSIS_WIDTH + x],
      );
      comparisonCount += 1;
    }
  }

  for (let shift = -MAX_HORIZONTAL_SHIFT; shift <= MAX_HORIZONTAL_SHIFT; shift += 1) {
    let error = 0;
    let count = 0;

    for (let y = 2; y < ANALYSIS_HEIGHT - 2; y += 1) {
      for (let x = 2; x < ANALYSIS_WIDTH - 2; x += 1) {
        const previousX = x - shift;
        if (previousX < 2 || previousX >= ANALYSIS_WIDTH - 2) continue;

        error += Math.abs(
          currentAnalysis[y * ANALYSIS_WIDTH + x] -
            previousAnalysis[y * ANALYSIS_WIDTH + previousX],
        );
        count += 1;
      }
    }

    const averageError = count > 0 ? error / count : Number.POSITIVE_INFINITY;
    if (averageError < bestError) {
      bestError = averageError;
      bestShift = shift;
    }
  }

  const score = comparisonCount > 0 ? totalDifference / comparisonCount : 0;
  const direction: MotionDirection =
    score < LIVENESS_MOTION_THRESHOLD || Math.abs(bestShift) < 1
      ? "none"
      : bestShift < 0
        ? "left"
        : "right";

  return { score, direction, horizontalShift: bestShift };
}
