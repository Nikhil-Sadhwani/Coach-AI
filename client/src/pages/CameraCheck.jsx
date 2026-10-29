import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

import api from "../services/api.js";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";

const analyzeLighting = (video, canvas) => {
  const width = 64;
  const height = 48;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context || !video.videoWidth) {
    return null;
  }

  context.drawImage(video, 0, 0, width, height);

  const pixels = context.getImageData(
    0,
    0,
    width,
    height
  ).data;

  let totalBrightness = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    totalBrightness +=
      0.299 * r + 0.587 * g + 0.114 * b;
  }

  return totalBrightness / (pixels.length / 4);
};

// This is a camera-readiness heuristic, not an AI
// judgement of attractiveness, personality, or identity.
const calculateReadiness = (
  detection,
  video,
  brightness
) => {
  const box = detection.boundingBox;

  const frameWidth = video.videoWidth;
  const frameHeight = video.videoHeight;

  const centerX =
    (box.originX + box.width / 2) / frameWidth;

  const centerY =
    (box.originY + box.height / 2) / frameHeight;

  const faceHeightRatio =
    box.height / frameHeight;

  const horizontalOffset = Math.abs(centerX - 0.5);
  const verticalOffset = Math.abs(centerY - 0.42);

  // Position: 25 points.
  const positionScore =
    12.5 * Math.max(0, 1 - horizontalOffset / 0.35) +
    12.5 * Math.max(0, 1 - verticalOffset / 0.35);

  // Face size: 20 points.
  let sizeScore = 0;

  if (faceHeightRatio < 0.2) {
    sizeScore = 20 * (faceHeightRatio / 0.2);
  } else if (faceHeightRatio <= 0.55) {
    sizeScore = 20;
  } else if (faceHeightRatio < 0.8) {
    sizeScore =
      20 * ((0.8 - faceHeightRatio) / 0.25);
  }

  // Lighting: 15 points based on average frame brightness.
  // Very dark or very bright frames receive fewer points.
  let lightingScore = 0;

  if (brightness !== null) {
    if (brightness < 45) {
      lightingScore = 15 * (brightness / 45);
    } else if (brightness <= 190) {
      lightingScore = 15;
    } else if (brightness < 235) {
      lightingScore =
        15 * ((235 - brightness) / 45);
    }
  }

  // Face presence: 40 points, only when a face is detected.
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(40 + positionScore + sizeScore + lightingScore)
    )
  );

  const suggestions = [];

  if (horizontalOffset > 0.18 || verticalOffset > 0.2) {
    suggestions.push("Move your face closer to the centre.");
  }

  if (faceHeightRatio < 0.2) {
    suggestions.push("Move closer to the camera.");
  } else if (faceHeightRatio > 0.55) {
    suggestions.push("Move slightly farther from the camera.");
  }

  if (brightness !== null && brightness < 45) {
    suggestions.push("Increase the lighting in front of you.");
  } else if (brightness !== null && brightness > 220) {
    suggestions.push("Reduce excessive light or glare.");
  }

  return {
    score,
    suggestions,
    brightness: Math.round(brightness ?? 0),
  };
};

export default function CameraCheck() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const timerRef = useRef(null);

  const scanningRef = useRef(false);
  const samplesRef = useRef([]);
  const lastDetectionRef = useRef(0);

  const [interviewType, setInterviewType] = useState("text");
  const [sessionReady, setSessionReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);

  const [loadingMessage, setLoadingMessage] = useState(
    "Preparing camera and face detector..."
  );

  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  const [liveAnalysis, setLiveAnalysis] = useState({
    faceCount: 0,
    score: null,
    status: "Waiting for camera",
    suggestions: [],
  });

  const [cameraError, setCameraError] = useState("");
  const [error, setError] = useState("");

  // 1. Verify the active interview session.
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await api.get(
          "/interview/camera-check"
        );

        if (cancelled) return;

        setInterviewType(response.data.interviewType);
        setSessionReady(true);
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        if (err.response?.status === 400) {
          navigate("/hub", { replace: true });
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to verify your interview session."
        );
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // 2. Start the camera and initialize MediaPipe.
  useEffect(() => {
    let cancelled = false;
    let detector = null;

    const initialize = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera access is unavailable. Open this app through localhost or HTTPS."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        setCameraReady(true);
        setLoadingMessage("Loading face detection model...");

        const vision =
          await FilesetResolver.forVisionTasks(WASM_URL);

        detector = await FaceDetector.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: FACE_MODEL_URL,
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.6,
          }
        );

        if (cancelled) {
          detector.close();
          return;
        }

        detectorRef.current = detector;
        setDetectorReady(true);
        setLoadingMessage("Live face analysis is ready.");
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err.message ||
              "Could not initialize the camera or face detector."
          );
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      scanningRef.current = false;

      detectorRef.current?.close();
      detectorRef.current = null;

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    };
  }, []);

  // 3. Analyse real camera frames continuously.
  useEffect(() => {
    if (!cameraReady || !detectorReady) return;

    let cancelled = false;

    const detectFrame = () => {
      if (cancelled) return;

      const video = videoRef.current;
      const detector = detectorRef.current;
      const canvas = canvasRef.current;
      const now = performance.now();

      // Run detection about 4 times per second.
      if (
        video &&
        detector &&
        canvas &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        now - lastDetectionRef.current >= 250
      ) {
        lastDetectionRef.current = now;

        try {
          const result = detector.detectForVideo(video, now);
          const faces = result.detections || [];

          if (faces.length === 0) {
            setLiveAnalysis({
              faceCount: 0,
              score: null,
              status: "No face detected",
              suggestions: [
                "Move into the camera frame and face the camera.",
              ],
            });
          } else if (faces.length > 1) {
            setLiveAnalysis({
              faceCount: faces.length,
              score: null,
              status: "Multiple faces detected",
              suggestions: [
                "Make sure only one person is visible during the scan.",
              ],
            });
          } else {
            const brightness = analyzeLighting(video, canvas);

            const assessment = calculateReadiness(
              faces[0],
              video,
              brightness
            );

            const current = {
              faceCount: 1,
              ...assessment,
              status:
                assessment.score >= 80
                  ? "Good camera setup"
                  : "Adjust your camera setup",
            };

            setLiveAnalysis(current);

            // Keep real readings collected during the 3-second scan.
            if (scanningRef.current) {
              samplesRef.current.push(assessment.score);
            }
          }
        } catch (err) {
          console.error("Face detection error:", err);
        }
      }

      animationRef.current =
        requestAnimationFrame(detectFrame);
    };

    animationRef.current =
      requestAnimationFrame(detectFrame);

    return () => {
      cancelled = true;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cameraReady, detectorReady]);

  // 4. Analyse for 3 seconds using actual detections.
  const handleScan = () => {
    if (!cameraReady || !detectorReady || scanning) return;

    setError("");
    setScanComplete(false);
    setFinalScore(null);

    samplesRef.current = [];
    scanningRef.current = true;

    setScanning(true);

    timerRef.current = setTimeout(() => {
      scanningRef.current = false;
      setScanning(false);

      const samples = samplesRef.current;

      // Require several actual face detections.
      if (samples.length < 3) {
        setError(
          "No stable face detection was recorded. Make sure your face is clearly visible, then scan again."
        );
        return;
      }

      const average =
        samples.reduce((sum, value) => sum + value, 0) /
        samples.length;

      setFinalScore(Math.round(average));
      setScanComplete(true);
      setError("");
    }, 3000);
  };

  // 5. Enter the selected interview room.
  const handleEnterStudio = () => {
    if (!sessionReady || !scanComplete) return;

    navigate(
      interviewType === "voice"
        ? "/voice-room"
        : "/session-room"
    );
  };

  const displayedScore = scanComplete
    ? finalScore
    : liveAnalysis.score;

  return (
    <main
      className="bg-gray-900 text-white min-h-screen flex items-center justify-center font-sans px-4 py-8"
      style={{
        background:
          "linear-gradient(to bottom right, #0f172a, #111827, #172554)",
      }}
    >
      <div className="max-w-xl w-full p-8 md:p-12 bg-gray-800 rounded-3xl text-center border border-gray-700 shadow-2xl">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
          AI Presence Scan
        </h2>

        <p className="text-xs text-gray-400 mb-8">
          Real-time face detection and camera-readiness analysis
        </p>

        {/* Live camera preview */}
        <div
          className="relative rounded-3xl overflow-hidden bg-black mb-6 aspect-video border-2 border-green-700 shadow-2xl"
          style={{ aspectRatio: "16 / 9" }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
            autoPlay
            muted
            playsInline
          />

          <canvas
            ref={canvasRef}
            className="hidden"
          />

          {scanning && (
            <div className="scan-line absolute left-0 w-full h-1.5 bg-emerald-400 shadow-xl" />
          )}

          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-sm text-gray-300 p-4">
              Starting camera...
            </div>
          )}
        </div>

        {/* Live status */}
        <div className="mb-6 rounded-2xl bg-gray-900 border border-gray-700 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Live analysis
          </p>

          <p
            className={
              liveAnalysis.faceCount === 1
                ? "text-emerald-400 font-bold text-lg"
                : "text-yellow-400 font-bold text-lg"
            }
          >
            {liveAnalysis.status}
          </p>

          <p className="text-sm text-gray-400 mt-2">
            {displayedScore !== null
              ? `Camera readiness: ${displayedScore}%`
              : "A score will appear only when exactly one face is detected."}
          </p>

          {liveAnalysis.suggestions?.length > 0 && (
            <div className="text-xs text-gray-400 mt-4 space-y-2">
              {liveAnalysis.suggestions.map((suggestion) => (
                <p key={suggestion}>{suggestion}</p>
              ))}
            </div>
          )}
        </div>

        {loadingMessage && !cameraError && (
          <p className="text-xs text-gray-500 mb-4">
            {loadingMessage}
          </p>
        )}

        {cameraError && (
          <p
            role="alert"
            className="text-yellow-400 text-sm mb-5"
          >
            {cameraError}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="text-red-400 text-sm mb-5"
          >
            {error}
          </p>
        )}

        {/* Scan control */}
        {!scanComplete && (
          <button
            type="button"
            onClick={handleScan}
            disabled={
              !sessionReady ||
              !cameraReady ||
              !detectorReady ||
              scanning
            }
            className="w-full bg-emerald-600 py-5 md:py-6 rounded-full font-black uppercase text-xs tracking-widest hover:bg-emerald-500 shadow-xl transition-all disabled:opacity-50"
          >
            {scanning
              ? "Analysing Live Camera..."
              : "Run 3-Second Analysis"}
          </button>
        )}

        {/* Verified scan result */}
        {scanComplete && (
          <div className="mt-6">
            <p className="text-5xl font-black text-emerald-400 mb-2">
              {finalScore}%
            </p>

            <p className="text-xs text-gray-400 mb-8 uppercase tracking-widest">
              Camera Readiness Score
            </p>

            <button
              type="button"
              onClick={handleEnterStudio}
              disabled={!sessionReady}
              className="w-full bg-white text-gray-900 py-5 md:py-6 rounded-full font-black uppercase text-xs tracking-widest shadow-xl transition-all disabled:opacity-50"
            >
              {interviewType === "voice"
                ? "Enter Live Voice Studio"
                : "Enter Studio"}
            </button>

            <button
              type="button"
              onClick={() => {
                setScanComplete(false);
                setFinalScore(null);
                setError("");
              }}
              className="mt-5 text-sm font-bold text-emerald-400"
            >
              Scan Again
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-8">
          Face detection runs in your browser. This score measures face
          visibility, framing and lighting; it does not assess identity or
          actual interview performance.
        </p>
      </div>
    </main>
  );
}