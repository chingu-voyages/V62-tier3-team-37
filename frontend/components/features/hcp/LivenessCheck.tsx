"use client";

import { AlertCircle, Camera, CheckCircle2, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LIVENESS_CHALLENGE_TIMEOUT_MS,
  LIVENESS_MOTION_THRESHOLD,
  LIVENESS_PREPARE_MS,
  LIVENESS_SAMPLE_INTERVAL_MS,
  LIVENESS_STILL_SAMPLE_COUNT,
  LIVENESS_STILL_THRESHOLD,
  measureMotion,
  sampleVideoFrame,
} from "./liveness-engine";

type LivenessStatus = "idle" | "starting" | "active" | "success" | "error";
type ChallengeStep = "preparing" | "moveLeft" | "moveRight" | "holdStill" | "passed" | "failed";
type CameraErrorKind = "permission" | "unavailable" | "unsupported" | "challenge" | "unknown";
type CameraErrorAction = "retry" | "back";

type CameraError = {
  kind: CameraErrorKind;
  title: string;
  description: string;
  action: CameraErrorAction;
};

export type LivenessCheckProps = {
  onComplete?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
};

export type LivenessCheckHandle = {
  complete: () => void;
};

const cameraErrorMessages: Record<
  Exclude<CameraErrorKind, "unsupported">,
  Omit<CameraError, "kind">
> = {
  permission: {
    title: "Camera access is required",
    description: "Please allow camera access in your browser settings and try again.",
    action: "retry",
  },
  unavailable: {
    title: "We couldn't access your camera",
    description: "Make sure your camera is connected and isn't being used by another application.",
    action: "retry",
  },
  challenge: {
    title: "Liveness challenge timed out",
    description: "We couldn't detect the requested movement. Please try again.",
    action: "retry",
  },
  unknown: {
    title: "We couldn't start the camera",
    description: "Please try again.",
    action: "retry",
  },
};

const unsupportedCameraError: CameraError = {
  kind: "unsupported",
  title: "Camera isn't supported",
  description: "Please use a modern browser with camera access enabled.",
  action: "back",
};

const insecureCameraError: CameraError = {
  kind: "unsupported",
  title: "Camera isn't supported",
  description:
    "Camera access requires a secure HTTPS connection. Please use a secure browser connection and try again.",
  action: "back",
};

function getErrorName(error: unknown): string {
  if (error && typeof error === "object" && "name" in error) {
    return String(error.name);
  }

  return "";
}

function getCameraError(error: unknown): CameraError {
  const errorName = getErrorName(error);

  if (["NotAllowedError", "PermissionDeniedError"].includes(errorName)) {
    return { kind: "permission", ...cameraErrorMessages.permission };
  }

  if (errorName === "SecurityError") {
    return insecureCameraError;
  }

  if (
    [
      "AbortError",
      "DevicesNotFoundError",
      "NotFoundError",
      "NotReadableError",
      "OverconstrainedError",
      "TrackStartError",
    ].includes(errorName)
  ) {
    return { kind: "unavailable", ...cameraErrorMessages.unavailable };
  }

  if (["NotSupportedError", "TypeError"].includes(errorName)) {
    return unsupportedCameraError;
  }

  return { kind: "unknown", ...cameraErrorMessages.unknown };
}

function getCameraSupportError(): CameraError | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return unsupportedCameraError;
  }

  if (window.isSecureContext === false) {
    return insecureCameraError;
  }

  if (typeof navigator.mediaDevices?.getUserMedia !== "function") {
    return unsupportedCameraError;
  }

  return null;
}

function stopMediaTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => {
    track.onended = null;
    track.stop();
  });
}

function getLivenessContent(
  status: LivenessStatus,
  error: CameraError | null,
  challengeStep: ChallengeStep,
) {
  if (status === "active") {
    switch (challengeStep) {
      case "moveLeft":
        return {
          title: "Move slowly left",
          description: "Move your face slightly left while keeping it inside the circle.",
          actionLabel: "Cancel",
        };
      case "moveRight":
        return {
          title: "Move slowly right",
          description: "Now move your face slightly right while keeping it inside the circle.",
          actionLabel: "Cancel",
        };
      case "holdStill":
        return {
          title: "Hold still",
          description: "Great—hold still for a moment to finish the challenge.",
          actionLabel: "Cancel",
        };
      default:
        return {
          title: "Get ready",
          description: "Keep your face inside the circle while the challenge starts.",
          actionLabel: "Cancel",
        };
    }
  }

  switch (status) {
    case "starting":
      return {
        title: "Starting camera...",
        description: "Please allow camera access when your browser asks.",
        actionLabel: "Starting…",
      };
    case "success":
      return {
        title: "Liveness challenge complete",
        description:
          "The local movement challenge completed. Identity verification is not connected yet.",
        actionLabel: "Start again",
      };
    case "error":
      return {
        title: error?.title ?? cameraErrorMessages.unknown.title,
        description: error?.description ?? cameraErrorMessages.unknown.description,
        actionLabel: error?.action === "back" ? "Back" : "Try again",
      };
    default:
      return {
        title: "Position your face inside the circle",
        description: "We'll use your camera for a quick liveness challenge.",
        actionLabel: "Start liveness check",
      };
  }
}

function getChallengeProgress(challengeStep: ChallengeStep) {
  switch (challengeStep) {
    case "moveLeft":
      return { label: "Move left", stepLabel: "Step 1 of 2", widthClass: "w-1/3" };
    case "moveRight":
      return { label: "Move right", stepLabel: "Step 2 of 2", widthClass: "w-2/3" };
    case "holdStill":
      return { label: "Hold still", stepLabel: "Final step", widthClass: "w-5/6" };
    case "passed":
      return { label: "Challenge complete", stepLabel: "Complete", widthClass: "w-full" };
    case "failed":
      return { label: "Challenge failed", stepLabel: "Try again", widthClass: "w-full" };
    default:
      return { label: "Preparing challenge", stepLabel: "Getting ready", widthClass: "w-0" };
  }
}

function LivenessStatusIcon({ status }: { status: LivenessStatus }) {
  const className = "size-7";

  if (status === "starting") {
    return (
      <LoaderCircle
        className={cn(className, "animate-spin text-muted-foreground motion-reduce:animate-none")}
        aria-hidden="true"
      />
    );
  }

  if (status === "success") {
    return <CheckCircle2 className={cn(className, "text-primary")} aria-hidden="true" />;
  }

  if (status === "error") {
    return <AlertCircle className={cn(className, "text-destructive")} aria-hidden="true" />;
  }

  return <Camera className={cn(className, "text-muted-foreground")} aria-hidden="true" />;
}

export const LivenessCheck = forwardRef<LivenessCheckHandle, LivenessCheckProps>(
  function LivenessCheck({ onComplete, onCancel, disabled = false }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const challengeCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestIdRef = useRef(0);
    const requestInFlightRef = useRef(false);
    const challengeIntervalRef = useRef<number | null>(null);
    const challengeTimeoutRef = useRef<number | null>(null);
    const previousFrameRef = useRef<Uint8ClampedArray | null>(null);
    const lastFrameSignatureRef = useRef<number | null>(null);
    const challengeStepRef = useRef<ChallengeStep>("preparing");
    const challengeStartedAtRef = useRef(0);
    const stillSampleCountRef = useRef(0);
    const mountedRef = useRef(true);
    const [status, setStatus] = useState<LivenessStatus>("idle");
    const [error, setError] = useState<CameraError | null>(null);
    const [challengeStep, setChallengeStep] = useState<ChallengeStep>("preparing");

    const stopStream = useCallback(() => {
      stopMediaTracks(streamRef.current);
      streamRef.current = null;

      const video = videoRef.current;
      if (video) {
        video.onerror = null;
        video.pause();
        video.srcObject = null;
      }
    }, []);

    const stopChallenge = useCallback(() => {
      if (challengeIntervalRef.current !== null) {
        window.clearInterval(challengeIntervalRef.current);
        challengeIntervalRef.current = null;
      }

      if (challengeTimeoutRef.current !== null) {
        window.clearTimeout(challengeTimeoutRef.current);
        challengeTimeoutRef.current = null;
      }

      previousFrameRef.current = null;
      lastFrameSignatureRef.current = null;
      stillSampleCountRef.current = 0;
    }, []);

    const updateChallengeStep = useCallback((nextStep: ChallengeStep) => {
      challengeStepRef.current = nextStep;
      setChallengeStep(nextStep);
    }, []);

    useEffect(() => {
      mountedRef.current = true;

      return () => {
        mountedRef.current = false;
        requestIdRef.current += 1;
        stopChallenge();
        stopStream();
      };
    }, [stopChallenge, stopStream]);

    const finishChallenge = useCallback(() => {
      if (!mountedRef.current) return;

      requestIdRef.current += 1;
      requestInFlightRef.current = false;
      stopChallenge();
      updateChallengeStep("passed");
      stopStream();
      setError(null);
      setStatus("success");
      onComplete?.();
    }, [onComplete, stopChallenge, stopStream, updateChallengeStep]);

    const failChallenge = useCallback(() => {
      if (!mountedRef.current) return;

      requestIdRef.current += 1;
      requestInFlightRef.current = false;
      stopChallenge();
      updateChallengeStep("failed");
      stopStream();
      setError({ kind: "challenge", ...cameraErrorMessages.challenge });
      setStatus("error");
    }, [stopChallenge, stopStream, updateChallengeStep]);

    const cancelSession = useCallback(() => {
      requestIdRef.current += 1;
      requestInFlightRef.current = false;
      stopChallenge();
      updateChallengeStep("preparing");
      stopStream();
      setError(null);
      setStatus("idle");
      onCancel?.();
    }, [onCancel, stopChallenge, stopStream, updateChallengeStep]);

    const resetSession = useCallback(() => {
      requestIdRef.current += 1;
      requestInFlightRef.current = false;
      stopChallenge();
      updateChallengeStep("preparing");
      stopStream();
      setError(null);
      setStatus("idle");
    }, [stopChallenge, stopStream, updateChallengeStep]);

    const complete = useCallback(() => {
      if (!mountedRef.current || status !== "active") return;
      finishChallenge();
    }, [finishChallenge, status]);

    useImperativeHandle(ref, () => ({ complete }), [complete]);

    const startChallenge = useCallback(() => {
      stopChallenge();
      updateChallengeStep("preparing");
      previousFrameRef.current = null;
      lastFrameSignatureRef.current = null;
      stillSampleCountRef.current = 0;
      challengeStartedAtRef.current = Date.now();

      const canvas = challengeCanvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) {
        failChallenge();
        return;
      }

      challengeIntervalRef.current = window.setInterval(() => {
        if (!mountedRef.current) return;

        const frame = sampleVideoFrame(video, canvas);
        if (!frame || frame.signature === lastFrameSignatureRef.current) return;

        lastFrameSignatureRef.current = frame.signature;
        const previousFrame = previousFrameRef.current;
        previousFrameRef.current = frame.luminance;
        if (!previousFrame) return;

        const currentStep = challengeStepRef.current;
        const elapsed = Date.now() - challengeStartedAtRef.current;

        if (currentStep === "preparing") {
          if (elapsed >= LIVENESS_PREPARE_MS) {
            updateChallengeStep("moveLeft");
          }
          return;
        }

        if (elapsed >= LIVENESS_CHALLENGE_TIMEOUT_MS) {
          failChallenge();
          return;
        }

        const motion = measureMotion(previousFrame, frame.luminance);

        if (currentStep === "moveLeft") {
          if (motion.score >= LIVENESS_MOTION_THRESHOLD && motion.direction === "left") {
            updateChallengeStep("moveRight");
          }
          return;
        }

        if (currentStep === "moveRight") {
          if (motion.score >= LIVENESS_MOTION_THRESHOLD && motion.direction === "right") {
            stillSampleCountRef.current = 0;
            updateChallengeStep("holdStill");
          }
          return;
        }

        if (currentStep === "holdStill") {
          if (motion.score <= LIVENESS_STILL_THRESHOLD) {
            stillSampleCountRef.current += 1;

            if (stillSampleCountRef.current >= LIVENESS_STILL_SAMPLE_COUNT) {
              finishChallenge();
            }
          } else {
            stillSampleCountRef.current = 0;
          }
        }
      }, LIVENESS_SAMPLE_INTERVAL_MS);

      challengeTimeoutRef.current = window.setTimeout(failChallenge, LIVENESS_CHALLENGE_TIMEOUT_MS);
    }, [failChallenge, finishChallenge, stopChallenge, updateChallengeStep]);

    const startCamera = useCallback(async () => {
      if (disabled || requestInFlightRef.current || status === "starting" || status === "active") {
        return;
      }

      stopChallenge();
      updateChallengeStep("preparing");
      stopStream();
      setError(null);
      setStatus("starting");

      const supportError = getCameraSupportError();
      if (supportError) {
        setError(supportError);
        setStatus("error");
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      requestInFlightRef.current = true;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          stopMediaTracks(stream);
          return;
        }

        streamRef.current = stream;
        const stopRequestStream = () => {
          if (streamRef.current === stream) {
            stopStream();
          } else {
            stopMediaTracks(stream);
          }
        };
        const video = videoRef.current;

        if (!video) {
          throw new Error("Camera preview is unavailable");
        }

        video.srcObject = stream;
        let cameraEnded = false;
        const handleCameraEnded = () => {
          cameraEnded = true;

          if (!mountedRef.current || requestId !== requestIdRef.current) return;

          requestIdRef.current += 1;
          requestInFlightRef.current = false;
          stopChallenge();
          stopRequestStream();
          setError({ kind: "unavailable", ...cameraErrorMessages.unavailable });
          setStatus("error");
        };

        video.onerror = handleCameraEnded;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = handleCameraEnded;
        }

        await video.play();

        if (cameraEnded) {
          stopRequestStream();
          return;
        }

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          stopRequestStream();
          return;
        }

        setStatus("active");
        startChallenge();
      } catch (caughtError) {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;

        stopChallenge();
        stopStream();
        console.error("Unable to start the liveness camera", caughtError);
        setError(getCameraError(caughtError));
        setStatus("error");
      } finally {
        if (requestId === requestIdRef.current) {
          requestInFlightRef.current = false;
        }
      }
    }, [disabled, startChallenge, status, stopChallenge, stopStream, updateChallengeStep]);

    const content = getLivenessContent(status, error, challengeStep);
    const progress = getChallengeProgress(challengeStep);
    const isStarting = status === "starting";
    const isActive = status === "active";

    function handleErrorAction() {
      if (error?.action === "back") {
        cancelSession();
        return;
      }

      void startCamera();
    }

    return (
      <div
        className="grid gap-5 sm:grid-cols-2 sm:items-center"
        aria-busy={isStarting || isActive}
        aria-live={status === "error" ? "assertive" : "polite"}
      >
        <canvas ref={challengeCanvasRef} className="hidden" />
        <div className="flex justify-center sm:justify-start">
          <div
            className={cn(
              "relative flex size-32 flex-col items-center justify-center overflow-hidden rounded-full border-2 p-4 text-center transition-colors sm:size-40 lg:size-44",
              isActive
                ? "border-ring bg-foreground"
                : "border-dashed border-muted-foreground/40 bg-muted/30",
              status === "success" && "border-secondary/40 bg-accent",
              status === "error" && "border-destructive/40 bg-destructive/10",
            )}
          >
            <video
              ref={videoRef}
              autoPlay={isActive}
              playsInline
              muted
              aria-label="Live camera preview"
              aria-hidden={!isActive}
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity",
                isActive ? "opacity-100" : "pointer-events-none opacity-0",
                isActive && "-scale-x-100",
              )}
            />

            {!isActive ? (
              <div className="relative z-10 flex flex-col items-center">
                <LivenessStatusIcon status={status} />
                <span className="mt-2 text-xs leading-4 text-muted-foreground">
                  {status === "idle" ? "Camera preview" : null}
                  {status === "starting" ? "Starting camera" : null}
                  {status === "success" ? "Challenge complete" : null}
                  {status === "error"
                    ? error?.kind === "challenge"
                      ? "Challenge timed out"
                      : "Camera unavailable"
                    : null}
                </span>
              </div>
            ) : (
              <>
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-5">
                  <div className="flex h-4/5 w-3/5 items-center justify-center rounded-[50%] border-2 border-background/80">
                    <span className="rounded-full bg-foreground/70 px-2 py-1 text-xs font-medium text-background">
                      Face guide
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground/60 px-2.5 py-1 text-xs text-background">
                  <span className="size-1.5 rounded-full bg-secondary" aria-hidden="true" />
                  Camera active
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-medium text-foreground">{content.title}</h3>
          <p
            className={cn(
              "text-sm leading-6",
              status === "error" ? "text-destructive" : "text-muted-foreground",
            )}
            role={status === "error" ? "alert" : undefined}
          >
            {content.description}
          </p>

          {status === "idle" ? (
            <div className="flex items-start gap-2 rounded-sm border bg-muted/30 p-2.5 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Your camera feed stays in this browser and is not recorded or uploaded.</span>
            </div>
          ) : null}

          {isActive ? (
            <div className="space-y-2" role="status">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{progress.stepLabel}</span>
                <span>{progress.label}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none",
                    progress.widthClass,
                  )}
                />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Follow the movement prompts. The camera feed stays on this device.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isStarting ? (
              <>
                <Button type="button" variant="default" className="w-full sm:w-auto" disabled>
                  <LoaderCircle
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  {content.actionLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={cancelSession}
                >
                  <X aria-hidden="true" />
                  Cancel
                </Button>
              </>
            ) : isActive ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={cancelSession}
              >
                <X aria-hidden="true" />
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                className="w-full sm:w-auto"
                disabled={disabled}
                onClick={
                  status === "error"
                    ? handleErrorAction
                    : status === "success"
                      ? resetSession
                      : () => void startCamera()
                }
              >
                {status === "error" ? (
                  <AlertCircle aria-hidden="true" />
                ) : status === "success" ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <Camera aria-hidden="true" />
                )}
                {content.actionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  },
);

LivenessCheck.displayName = "LivenessCheck";
