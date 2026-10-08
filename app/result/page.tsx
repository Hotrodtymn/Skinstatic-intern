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

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [fileName, setFileName] = useState("");

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [error, setError] = useState("");

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    console.log(
      "========== IMAGE SELECTION =========="
    );

    console.log(
      "File name:",
      file.name
    );

    console.log(
      "File type:",
      file.type
    );

    console.log(
      "File size:",
      file.size,
      "bytes"
    );

    console.log(
      "======================================"
    );

    setError("");
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError(
          "Unable to read this image."
        );
        return;
      }

      setSelectedImage(reader.result);

      console.log(
        "========== IMAGE LOADED =========="
      );

      console.log(
        "Image loaded successfully."
      );

      console.log(
        "Image data length:",
        reader.result.length
      );

      console.log(
        "Image data starts with:",
        reader.result.substring(0, 50)
      );

      console.log(
        "Image data ends with:",
        reader.result.substring(
          reader.result.length - 50
        )
      );

      console.log(
        "=================================="
      );
    };

    reader.onerror = () => {
      console.error(
        "FileReader failed to read image."
      );

      setError(
        "Unable to read this image."
      );

      setSelectedImage(null);
      setFileName("");
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
       * FileReader creates a data URL:
       *
       * data:image/jpeg;base64,/9j/4AAQ...
       *
       * The Phase Two API expects the Base64
       * image string, so we remove the prefix.
       */

      const commaIndex =
        selectedImage.indexOf(",");

      const base64Image =
        commaIndex !== -1
          ? selectedImage.substring(
              commaIndex + 1
            )
          : selectedImage;

      console.log(
        "========== PHASE TWO DEBUG =========="
      );

      console.log(
        "Original data URL length:",
        selectedImage.length
      );

      console.log(
        "Base64 length:",
        base64Image.length
      );

      console.log(
        "Original prefix:",
        selectedImage.substring(0, 50)
      );

      console.log(
        "Base64 prefix:",
        base64Image.substring(0, 50)
      );

      console.log(
        "Base64 suffix:",
        base64Image.substring(
          base64Image.length - 50
        )
      );

      console.log(
        "Has data URL prefix:",
        selectedImage.startsWith(
          "data:image/"
        )
      );

      console.log(
        "Base64 starts with JPEG signature:",
        base64Image.startsWith(
          "/9j/"
        )
      );

      console.log(
        "======================================"
      );

      console.log(
        "========== API REQUEST =========="
      );

      console.log(
        "Endpoint:",
        "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo"
      );

      console.log(
        "HTTP method:",
        "POST"
      );

      console.log(
        "Request field:",
        "Image"
      );

      console.log(
        "Request Base64 length:",
        base64Image.length
      );

      console.log(
        "================================="
      );

      const response = await fetch(
        "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64Image,
          }),
        }
      );

      console.log(
        "========== API RESPONSE =========="
      );

      console.log(
        "Phase Two HTTP status:",
        response.status
      );

      console.log(
        "Phase Two HTTP status text:",
        response.statusText
      );

      const data: ApiResponse =
        await response.json();

      console.log(
        "Raw Phase Two response:"
      );

      console.log(
        JSON.stringify(
          data,
          null,
          2
        )
      );

      console.log(
        "=================================="
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to analyze this image."
        );
      }

      if (!data.data) {
        throw new Error(
          "The analysis did not return demographic data."
        );
      }

      console.log(
        "========== DEMOGRAPHIC RESULTS =========="
      );

      console.log(
        "RACE:"
      );

      console.log(
        JSON.stringify(
          data.data.race,
          null,
          2
        )
      );

      console.log(
        "AGE:"
      );

      console.log(
        JSON.stringify(
          data.data.age,
          null,
          2
        )
      );

      console.log(
        "GENDER:"
      );

      console.log(
        JSON.stringify(
          data.data.gender,
          null,
          2
        )
      );

      console.log(
        "=========================================="
      );

      /*
       * Save the API response so the demographics
       * page can use the exact data returned by
       * the Phase Two API.
       */

      localStorage.setItem(
        "skinstatic-analysis",
        JSON.stringify(
          data.data
        )
      );

      localStorage.setItem(
        "skinstatic-image",
        selectedImage
      );

      console.log(
        "Analysis data saved to localStorage."
      );

      console.log(
        "Saved analysis:",
        JSON.stringify(
          data.data,
          null,
          2
        )
      );

      console.log(
        "Navigating to /select..."
      );

      router.push("/select");
    } catch (analysisError) {
      console.error(
        "========== PHASE TWO ERROR =========="
      );

      console.error(
        analysisError
      );

      console.error(
        "======================================"
      );

      if (
        analysisError instanceof Error
      ) {
        setError(
          analysisError.message
        );
      } else {
        setError(
          "Unable to analyze this image."
        );
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
          <span className="result-logo">
            SKINSTATIC
          </span>

          <span className="result-intro">
            [ INTRO ]
          </span>
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
              <span>
                TO START ANALYSIS
              </span>

              <strong>
                UPLOAD A PHOTO
              </strong>
            </div>

            <div className="result-upload-area">
              <label
                htmlFor="result-image-upload"
                className={`result-upload-box ${
                  selectedImage
                    ? "has-image"
                    : ""
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
                    <span className="result-upload-icon">
                      +
                    </span>

                    <span className="result-upload-text">
                      CLICK TO UPLOAD
                    </span>

                    <span className="result-upload-subtext">
                      JPG, JPEG OR PNG
                    </span>
                  </div>
                )}

                <input
                  id="result-image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={
                    handleImageChange
                  }
                  hidden
                />
              </label>

              {fileName && (
                <p className="result-file-name">
                  {fileName}
                </p>
              )}

              {error && (
                <p className="result-error">
                  {error}
                </p>
              )}

              {selectedImage && (
                <button
                  type="button"
                  className="result-analyze-button"
                  onClick={
                    handleAnalyze
                  }
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