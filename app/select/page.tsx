"use client";

import { useRouter } from "next/navigation";

const analysisOptions = [
  {
    id: "demographics",
    title: "DEMOGRAPHICS",
    description: "Discover your estimated age, gender, and ethnicity.",
    available: true,
  },
  {
    id: "cosmetic-concerns",
    title: "COSMETIC CONCERNS",
    description: "Identify your primary cosmetic concerns.",
    available: false,
  },
  {
    id: "skin-type",
    title: "SKIN TYPE DETAILS",
    description: "Discover your personalized skin type.",
    available: false,
  },
  {
    id: "weather",
    title: "WEATHER",
    description: "See how your environment affects your skin.",
    available: false,
  },
];

export default function SelectPage() {
  const router = useRouter();

  const handleSelect = (id: string) => {
    if (id === "demographics") {
      router.push("/summary");
    }
  };

  return (
    <main className="select-page">
      <header className="select-header">
        <div className="select-brand">
          <span className="select-logo">SKINSTATIC</span>
          <span className="select-intro">[ INTRO ]</span>
        </div>

        <div className="select-header-right">
          

          <button
            type="button"
            className="select-code-button"
          >
            ENTER CODE
          </button>
        </div>
      </header>

      <section className="select-content">
        <div className="select-heading">
          <span>A.I.</span>
          <strong>ANALYSIS</strong>
        </div>

        <p className="select-description">
          A.I. has estimated the following.
          <br />
          Fix estimated information if needed.
        </p>

        <div className="select-options">
          {analysisOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`select-option ${
                option.available
                  ? "is-available"
                  : "is-disabled"
              }`}
              onClick={() => handleSelect(option.id)}
              disabled={!option.available}
            >
              <div className="select-option-top">
                <span className="select-option-title">
                  {option.title}
                </span>

                <span className="select-option-arrow">
                  ↗
                </span>
              </div>

              <span className="select-option-description">
                {option.description}
              </span>
            </button>
          ))}
        </div>

        <div className="select-actions">
          <button
            type="button"
            className="select-back"
            onClick={() => router.push("/result")}
          >
            ← BACK
          </button>

          <button
            type="button"
            className="select-sum"
            onClick={() => router.push("/summary")}
          >
            GET SUMMARY →
          </button>
        </div>
      </section>
    </main>
  );
}