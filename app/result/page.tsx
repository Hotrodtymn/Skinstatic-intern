"use client";

import { ChangeEvent, useState } from "react";
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

export default function ResultPage() {
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [fileName, setFileName] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [error, setError] = useState("");

  const [debugInfo, setDebugInfo] = useState({
    exists: false,
    length: 0,
    start: "",
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedImage(reader.result);

        setDebugInfo({
          exists: true,
          length: reader.result.length,
          start: reader.result.substring(0, 50),
        });

        console.log("Image loaded successfully.");

        console.log("Image data length:", reader.result.length);

        console.log("Image data starts with:", reader.result.substring(0, 50));
      }
    };

    reader.onerror = () => {
      setError("Unable to read this image.");
      setSelectedImage(null);

      setDebugInfo({
        exists: false,
        length: 0,
        start: "",
      });
    };

    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      /*
       * FileReader gives us:
       *
       * data:image/jpeg;base64,/9j/4AAQ...
       *
       * The API documentation says it wants the
       * Base64 encoded image itself, so remove the
       * data URL prefix.
       */
      const base64Image = selectedImage.includes(",")
        ? selectedImage.split(",")[1]
        : selectedImage;

      console.log("Base64 image exists:", !!base64Image);

      console.log("Base64 image length:", base64Image.length);

      console.log("Base64 image starts with:", base64Image.substring(0, 30));

      /*
       * Send both Image and image temporarily.
       *
       * This allows us to determine whether the API
       * is expecting a different capitalization.
       */
      const requestBody = {
        Image: base64Image,
        image: base64Image,
      };

      console.log("Sending Phase Two request...");

      const response = await fetch(
        "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      const data: ApiResponse = await response.json();

      console.log("Phase Two HTTP status:", response.status);

      console.log("Phase Two API response:", data);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to analyze this image.");
      }

      if (!data.data) {
        throw new Error("The analysis did not return demographic data.");
      }

      localStorage.setItem("skinstatic-analysis", JSON.stringify(data.data));

      localStorage.setItem("skinstatic-image", selectedImage);

      console.log("Phase Two analysis saved successfully.");

      router.push("/select");
    } catch (analysisError) {
      console.error("Phase Two API error:", analysisError);

      if (analysisError instanceof Error) {
        setError(analysisError.message);
      } else {
        setError("Unable to analyze this image.");
      }

      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    if (isAnalyzing) {
      return;
    }

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
          <span className="result-kicker">TO START ANALYSIS</span>

          <button type="button" className="result-code-button">
            ENTER CODE
          </button>
        </div>
      </header>

      <section className="result-content">
        {!isAnalyzing ? (
          <>
            <div className="result-title">
              <span>TO START ANALYSIS</span>

              <strong>UPLOAD A PHOTO</strong>
            </div>

            <div className="result-upload-area">
              <label
                htmlFor="result-image-upload"
                className={`result-upload-box ${
                  selectedImage ? "has-image" : ""
                }`}
              >
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Selected for analysis"
                    className="result-preview"
                  />
                ) : (
                  <div className="result-upload-placeholder">
                    <span className="result-upload-icon">+</span>

                    <span className="result-upload-text">CLICK TO UPLOAD</span>

                    <span className="result-upload-subtext">
                      JPG, JPEG OR PNG
                    </span>
                  </div>
                )}

                <input
                  id="result-image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageChange}
                  hidden
                />
              </label>

              {fileName && <p className="result-file-name">{fileName}</p>}

              {selectedImage && (
                <div
                  style={{
                    marginTop: "16px",
                    fontSize: "11px",
                    lineHeight: "1.6",
                    textAlign: "center",
                    letterSpacing: "0.05em",
                  }}
                >
                  <div>IMAGE EXISTS: {debugInfo.exists ? "YES" : "NO"}</div>

                  <div>IMAGE LENGTH: {debugInfo.length}</div>

                  <div
                    style={{
                      maxWidth: "500px",
                      wordBreak: "break-all",
                    }}
                  >
                    IMAGE START: {debugInfo.start}
                  </div>
                </div>
              )}

              {error && <p className="result-error">{error}</p>}

              {selectedImage && (
                <button
                  type="button"
                  className="result-analyze-button"
                  onClick={handleAnalyze}
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

            <p className="result-loading-title">ANALYZING IMAGE</p>

            <p className="result-loading-text">PLEASE WAIT</p>
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
