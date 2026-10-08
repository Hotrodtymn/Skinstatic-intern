"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AnalysisCategory = "race" | "age" | "gender";

type AnalysisData = {
  race: Record<string, number>;
  age: Record<string, number>;
  gender: Record<string, number>;
};

type ActualSelections = {
  race?: string;
  age?: string;
  gender?: string;
};

const categoryLabels: Record<AnalysisCategory, string> = {
  race: "RACE",
  age: "AGE",
  gender: "GENDER",
};

const formatLabel = (value: string) => {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

export default function SummaryPage() {
  const router = useRouter();

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const [actualSelections, setActualSelections] = useState<ActualSelections>(
    {},
  );

  const [activeCategory, setActiveCategory] =
    useState<AnalysisCategory>("race");

  useEffect(() => {
    const savedAnalysis = localStorage.getItem("skinstatic-analysis");

    const savedSelections = localStorage.getItem(
      "skinstatic-actual-selections",
    );

    if (savedAnalysis) {
      try {
        setAnalysis(JSON.parse(savedAnalysis));
      } catch (error) {
        console.error("Unable to read analysis data:", error);
      }
    }

    if (savedSelections) {
      try {
        setActualSelections(JSON.parse(savedSelections));
      } catch (error) {
        console.error("Unable to read actual selections:", error);
      }
    }
  }, []);

  const sortedResults = useMemo(() => {
    if (!analysis) {
      return [];
    }

    return Object.entries(analysis[activeCategory]).sort(
      ([, valueA], [, valueB]) => valueB - valueA,
    );
  }, [analysis, activeCategory]);

  const handleActualSelection = (value: string) => {
    const updatedSelections = {
      ...actualSelections,
      [activeCategory]: value,
    };

    setActualSelections(updatedSelections);

    localStorage.setItem(
      "skinstatic-actual-selections",
      JSON.stringify(updatedSelections),
    );
  };

  if (!analysis) {
    return (
      <main className="summary-page">
        <header className="summary-header">
          <div className="summary-brand">
            <span className="summary-logo">SKINSTATIC</span>

            <span className="summary-intro">[ INTRO ]</span>
          </div>

          <div className="summary-header-right">
            <span className="summary-kicker">TO START ANALYSIS</span>

            <button type="button" className="summary-code-button">
              ENTER CODE
            </button>
          </div>
        </header>

        <section className="summary-content">
          <p className="summary-loading">LOADING ANALYSIS DATA...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="summary-page">
      <header className="summary-header">
        <div className="summary-brand">
          <span className="summary-logo">SKINSTATIC</span>

          <span className="summary-intro">[ INTRO ]</span>
        </div>

        <div className="summary-header-right">
          <span className="summary-kicker">TO START ANALYSIS</span>

          <button type="button" className="summary-code-button">
            ENTER CODE
          </button>
        </div>
      </header>

      <section className="summary-content">
        <div className="summary-heading">
          <span>A.I.</span>
          <strong>ANALYSIS</strong>
        </div>

        <div className="summary-section-heading">
          <span>DEMOGRAPHICS</span>
          <strong>PREDICTED RACE &amp; AGE</strong>
        </div>

        <div className="summary-layout">
          <aside className="summary-sidebar">
            <span className="summary-sidebar-title">DEMOGRAPHICS</span>

            <div className="summary-sidebar-options">
              {(Object.keys(categoryLabels) as AnalysisCategory[]).map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    className={`summary-sidebar-option ${
                      activeCategory === category ? "is-active" : ""
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    <span>{categoryLabels[category]}</span>

                    <span>→</span>
                  </button>
                ),
              )}
            </div>
          </aside>

          <div className="summary-results">
            <div className="summary-results-header">
              <span>{categoryLabels[activeCategory]}</span>

              <span>AI ESTIMATE</span>
            </div>

            <div className="summary-result-list">
              {sortedResults.map(([value, score], index) => {
                const isSelected = actualSelections[activeCategory] === value;

                return (
                  <button
                    key={value}
                    type="button"
                    className={`summary-result ${
                      isSelected ? "is-selected" : ""
                    }`}
                    onClick={() => handleActualSelection(value)}
                  >
                    <div className="summary-result-label">
                      <span>{formatLabel(value)}</span>

                      {isSelected && (
                        <span className="summary-actual-label">ACTUAL</span>
                      )}
                    </div>

                    <div className="summary-result-bar">
                      <span
                        className="summary-result-fill"
                        style={{
                          width: `${score * 100}%`,
                        }}
                      />
                    </div>

                    <span className="summary-result-score">
                      {formatPercentage(score)}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="summary-helper">
              CLICK AN ESTIMATE TO MARK YOUR ACTUAL INFORMATION.
            </p>
          </div>
        </div>

        <div className="summary-actions">
          <button
            type="button"
            className="summary-back"
            onClick={() => router.push("/select")}
          >
            ← BACK
          </button>

          <button
            type="button"
            className="summary-home"
            onClick={() => router.push("/")}
          >
            HOME →
          </button>
        </div>
      </section>
    </main>
  );
}
