
"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type AnalysisData = {
  race: Record<string, number>;
  age: Record<string, number>;
  gender: Record<string, number>;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: AnalysisData;
};

type CameraMode = "closed" | "live" | "captured";

const API_ENDPOINT =
  "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo";

export default function ResultPage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [fileName, setFileName] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [error, setError] = useState("");

  const [cameraMode, setCameraMode] =
    useState<CameraMode>("closed");

  const [isStartingCamera, setIsStartingCamera] =
    useState(false);

  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (cameraMode !== "live" || !streamRef.current) {
      return;
    }

    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.srcObject = streamRef.current;

    void video.play().catch(() => {
      setCameraError(
        "Unable to display the camera preview. Please try again."
      );
    });
  }, [cameraMode]);

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    // Allow the same image to be selected again.
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Please select a JPG, JPEG, or PNG image.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Please select an image smaller than 15 MB.");
      return;
    }

    stopCamera();
    setCameraMode("closed");
    setCameraError("");
    setError("");
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Unable to read this image.");
        setSelectedImage(null);
        setFileName("");
        return;
      }

      setSelectedImage(reader.result);
    };

    reader.onerror = () => {
      setError("Unable to read this image.");
      setSelectedImage(null);
      setFileName("");
    };

    reader.readAsDataURL(file);
  };

  const handleStartCamera = async () => {
    if (isStartingCamera || isAnalyzing) {
      return;
    }

    setError("");
    setCameraError("");
    setIsStartingCamera(true);

    stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is not supported by this browser. Please use the upload option instead."
        );
      }

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstError) {
        // Some devices do not support the preferred camera settings.
        if (
          firstError instanceof DOMException &&
          firstError.name === "NotAllowedError"
        ) {
          throw firstError;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraMode("live");
    } catch (cameraFailure) {
      console.error("Camera access failed:", cameraFailure);

      if (cameraFailure instanceof DOMException) {
        if (
          cameraFailure.name === "NotAllowedError" ||
          cameraFailure.name === "PermissionDeniedError"
        ) {
          setCameraError(
            "Camera permission was denied. Allow camera access in your browser settings, or upload a photo instead."
          );
        } else if (
          cameraFailure.name === "NotFoundError" ||
          cameraFailure.name === "DevicesNotFoundError"
        ) {
          setCameraError(
            "No camera was found on this device. Please upload a photo instead."
          );
        } else if (
          cameraFailure.name === "NotReadableError" ||
          cameraFailure.name === "TrackStartError"
        ) {
          setCameraError(
            "Your camera may be in use by another application. Close that application and try again."
          );
        } else {
          setCameraError(
            "Unable to access your camera. Please upload a photo instead."
          );
        }
      } else {
        setCameraError(
          cameraFailure instanceof Error
            ? cameraFailure.message
            : "Unable to access your camera."
        );
      }

      stopCamera();
      setCameraMode("closed");
    } finally {
      setIsStartingCamera(false);
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;

    if (
      !video ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      setCameraError(
        "The camera is not ready yet. Please wait a moment and try again."
      );
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError(
        "Unable to capture the photo. Please try again."
      );
      return;
    }

    // Mirror the selfie so it looks natural in the preview.
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const capturedImage = canvas.toDataURL("image/jpeg", 0.9);

    setSelectedImage(capturedImage);
    setFileName("selfie.jpg");
    setError("");
    setCameraError("");
    setCameraMode("captured");

    // The image is captured, so the camera can be switched off.
    stopCamera();
  };

  const handleRetakePhoto = async () => {
    setSelectedImage(null);
    setFileName("");
    setCameraError("");
    await handleStartCamera();
  };

  const handleChooseUpload = () => {
    setCameraError("");
    setCameraMode("closed");
    stopCamera();
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!selectedImage || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const commaIndex = selectedImage.indexOf(",");

      const base64Image =
        commaIndex !== -1
          ? selectedImage.substring(commaIndex + 1)
          : selectedImage;

      console.log("========== PHASE TWO DEBUG ==========");
      console.log("Image source:", fileName);
      console.log("Base64 length:", base64Image.length);
      console.log("Has data URL prefix:", selectedImage.startsWith("data:image/"));
      console.log("======================================");

      console.log("========== API REQUEST ==========");
      console.log("Endpoint:", API_ENDPOINT);
      console.log("HTTP method: POST");
      console.log("Request field: image");
      console.log("=================================");

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
        }),
      });

      console.log("Phase Two HTTP status:", response.status);

      const data: ApiResponse = await response.json();

      console.log(
        "Raw Phase Two response:",
        JSON.stringify(data, null, 2)
      );

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to analyze this image."
        );
      }

      if (!data.data) {
        throw new Error(
          "The analysis did not return demographic data."
        );
      }

      console.log(
        "Demographic results:",
        JSON.stringify(data.data, null, 2)
      );

      localStorage.setItem(
        "skinstatic-analysis",
        JSON.stringify(data.data)
      );

      localStorage.setItem(
        "skinstatic-image",
        selectedImage
      );

      console.log("Analysis data saved to localStorage.");
      console.log("Navigating to /select...");

      router.push("/select");
    } catch (analysisError) {
      console.error("Phase Two error:", analysisError);

      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to analyze this image."
      );

      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    if (isAnalyzing) {
      return;
    }

    stopCamera();
    router.push("/testing");
  };

  return (
    <main className="result-page">
      <header className="result-header">
        <div className="result-brand">
          <span className="result-logo">SKINSTATIC</span>
          <span className="result-intro">[ INTRO ]</span>
        </div>

        <div className="result-header-right">
          <span className="result-kicker">
            TO START ANALYSIS
          </span>

          <button
            type="button"
            className="result-code-button"
          >
            ENTER CODE
          </button>
        </div>
      </header>

      <section className="result-content">
        {!isAnalyzing ? (
          <>
            <div className="result-title">
              <span>TO START ANALYSIS</span>
              <strong>
                {cameraMode === "live"
                  ? "TAKE A PHOTO"
                  : selectedImage
                    ? "PHOTO SELECTED"
                    : "UPLOAD OR TAKE A PHOTO"}
              </strong>
            </div>

            <div className="result-upload-area">
              {cameraMode === "live" ? (
                <div className="result-camera-panel">
                  <div className="result-camera-preview">
                    <video
                      ref={videoRef}
                      className="result-camera-video"
                      autoPlay
                      playsInline
                      muted
                      aria-label="Live selfie camera preview"
                      style={{
                        transform: "scaleX(-1)",
                      }}
                    />
                  </div>

                  <p className="result-camera-instructions">
                    CENTER YOUR FACE IN THE FRAME
                  </p>

                  <button
                    type="button"
                    className="result-analyze-button"
                    onClick={handleCapturePhoto}
                  >
                    CAPTURE PHOTO
                  </button>

                  <button
                    type="button"
                    className="result-camera-cancel"
                    onClick={() => {
                      stopCamera();
                      setCameraMode("closed");
                      setCameraError("");
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className={`result-upload-box ${
                      selectedImage ? "has-image" : ""
                    }`}
                  >
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="Photo selected for analysis"
                        className="result-preview"
                      />
                    ) : (
                      <div className="result-upload-placeholder">
                        <span className="result-upload-icon">
                          +
                        </span>

                        <span className="result-upload-text">
                          SELECT A PHOTO
                        </span>

                        <span className="result-upload-subtext">
                          JPG, JPEG OR PNG
                        </span>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    id="result-image-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageChange}
                    hidden
                  />

                  <div className="result-photo-options">
                    <button
                      type="button"
                      className="result-analyze-button"
                      onClick={handleChooseUpload}
                    >
                      UPLOAD A PHOTO
                    </button>

                    <button
                      type="button"
                      className="result-analyze-button"
                      onClick={handleStartCamera}
                      disabled={isStartingCamera}
                    >
                      {isStartingCamera
                        ? "OPENING CAMERA..."
                        : "TAKE A PHOTO"}
                    </button>
                  </div>

                  {selectedImage && cameraMode === "captured" && (
                    <button
                      type="button"
                      className="result-camera-cancel"
                      onClick={handleRetakePhoto}
                      disabled={isStartingCamera}
                    >
                      RETAKE PHOTO
                    </button>
                  )}

                  {fileName && (
                    <p className="result-file-name">
                      {fileName}
                    </p>
                  )}
                </>
              )}

              {cameraError && (
                <p className="result-error" role="alert">
                  {cameraError}
                </p>
              )}

              {error && (
                <p className="result-error" role="alert">
                  {error}
                </p>
              )}

              {selectedImage && cameraMode !== "live" && (
                <button
                  type="button"
                  className="result-analyze-button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  ANALYZE PHOTO →
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="result-loading">
            <div className="result-loading-diamond">
              <span />
              <span />
              <span />
            </div>

            <p className="result-loading-title">
              ANALYZING IMAGE
            </p>

            <p className="result-loading-text">
              PLEASE WAIT
            </p>
          </div>
        )}

        <button
          type="button"
          className="result-back"
          onClick={handleBack}
          disabled={isAnalyzing}
        >
          ← BACK
        </button>
      </section>
    </main>
  );
}
