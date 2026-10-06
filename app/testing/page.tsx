"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "name" | "location";

export default function TestingPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("name");
  const [isTyping, setIsTyping] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiMessage, setApiMessage] = useState("");

  const currentValue = step === "name" ? name : location;

  const validateValue = (value: string, field: Step) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return `Please enter your ${field}.`;
    }

    if (!/^[A-Za-zÀ-ÿ\s'-]+$/.test(trimmedValue)) {
      return `${
        field === "name" ? "Name" : "Location"
      } can only contain letters.`;
    }

    return "";
  };

  const handleInputChange = (value: string) => {
    setError("");
    setApiMessage("");

    if (step === "name") {
      setName(value);
    } else {
      setLocation(value);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateValue(
      currentValue,
      step
    );

    setError(validationError);

    if (validationError || isSubmitting) {
      return;
    }

    const cleanedValue = currentValue.trim();

    if (step === "name") {
      setName(cleanedValue);

      localStorage.setItem(
        "skinstatic-name",
        cleanedValue
      );

      setStep("location");
      setIsTyping(true);
      setError("");

      return;
    }

    const cleanedLocation = cleanedValue;

    setLocation(cleanedLocation);

    localStorage.setItem(
      "skinstatic-name",
      name.trim()
    );

    localStorage.setItem(
      "skinstatic-location",
      cleanedLocation
    );

    setIsSubmitting(true);
    setError("");
    setApiMessage("");

    try {
      const response = await fetch(
        "https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseOne",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            location: cleanedLocation,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Phase One API response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Something went wrong."
        );
      }

      setApiMessage(
        data?.message ||
          "Information submitted successfully."
      );
    } catch (submitError) {
      console.error(
        "Phase One API error:",
        submitError
      );

      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError(
          "Unable to submit your information."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === "location") {
      setStep("name");
      setError("");
      setApiMessage("");
      return;
    }

    router.push("/");
  };

  return (
    <main className="testing-reference-page">
      <header className="testing-header">
        <div className="testing-brand">
          <span className="testing-logo">
            SKINSTATIC
          </span>

          <span className="testing-intro">
            [ INTRO ]
          </span>
        </div>

        <span className="testing-kicker">
          TO START ANALYSIS
        </span>

        <button
          type="button"
          className="testing-code-button"
        >
          ENTER CODE
        </button>
      </header>

      <section className="testing-content">
        <div className="testing-center">
          <div
            className={`diamond-stage ${
              isTyping ? "is-active" : ""
            }`}
            onClick={() => {
              if (!isSubmitting) {
                setIsTyping(true);
              }
            }}
          >
            <img
              src="https://skinstric-wandag.vercel.app/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2FDiamond-light-large.27413569.png&w=1920"
              alt=""
              className="diamond diamond-large"
            />

            <img
              src="https://skinstric-wandag.vercel.app/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2FDiamond-medium-medium.7599ea96.png&w=1920"
              alt=""
              className="diamond diamond-medium"
            />

            <img
              src="https://skinstric-wandag.vercel.app/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2FDiamond-dark-small.c887a101.png&w=1920"
              alt=""
              className="diamond diamond-small"
            />

            <div className="testing-input-area">
              {!isTyping ? (
                <>
                  <button
                    type="button"
                    className="click-to-type"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsTyping(true);
                    }}
                  >
                    CLICK TO TYPE
                  </button>

                  <span className="input-prompt">
                    YOUR NAME HERE
                  </span>

                  <span className="input-line" />
                </>
              ) : (
                <>
                  <span className="input-label">
                    {step === "name"
                      ? "YOUR NAME"
                      : "YOUR LOCATION"}
                  </span>

                  <input
                    id="testing-input"
                    type="text"
                    value={currentValue}
                    onChange={(event) =>
                      handleInputChange(
                        event.target.value
                      )
                    }
                    placeholder={
                      step === "name"
                        ? "Your name here"
                        : "Your location here"
                    }
                    autoFocus
                    disabled={isSubmitting}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />

                  {error && (
                    <p className="testing-error">
                      {error}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {apiMessage && (
            <p className="testing-success">
              {apiMessage}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleBack}
          className="testing-back"
          disabled={isSubmitting}
        >
          ← BACK
        </button>
      </section>
    </main>
  );
}