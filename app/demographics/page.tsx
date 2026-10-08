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

export default function DemographicsPage() {
  const router = useRouter();

  const [analysis, setAnalysis] =
    useState<AnalysisData | null>(null);

  const [actualSelections, setActualSelections] =
    useState<ActualSelections>({});

  const [activeCategory, setActiveCategory] =
    useState<AnalysisCategory>("race");

  useEffect(() => {
    const savedAnalysis =
      localStorage.getItem("skinstatic-analysis");

    const savedSelections =
      localStorage.getItem(
        "skinstatic-actual-selections"
      );

    if (savedAnalysis) {
      try {
        setAnalysis(JSON.parse(savedAnalysis));
      } catch (error) {
        console.error(
          "Unable to read analysis data:",
          error
        );
      }
    }

    if (savedSelections) {
      try {
        setActualSelections(
          JSON.parse(savedSelections)
        );
      } catch (error) {
        console.error(
          "Unable to read actual selections:",
          error
        );
      }
    }
  }, []);

  const sortedResults = useMemo(() => {
    if (!analysis) {
      return [];
    }

    const categoryData =
      analysis[activeCategory];

    return Object.entries(categoryData)
      .sort(([, valueA], [, valueB]) => valueB - valueA);
  }, [analysis, activeCategory]);

  const handleActualSelection = (
    value: string
  ) => {
    const updatedSelections = {
      ...actualSelections,
      [activeCategory]: value,
    };

    setActualSelections(updatedSelections);

    localStorage.setItem(
      "skinstatic-actual-selections",
      JSON.stringify(updatedSelections)
    );
  };

  const handleBack = () => {
    router.push("/select");
  };

  const handleContinue = () => {
    router.push("/summary");
  };

  if (!analysis) {
    return (
      <main className="demographics-page">
        <header className="demographics-header">
          <div className="demographics-brand">
            <span className="demographics-logo">
              SKINSTATIC
            </span>

            <span className="demographics-intro">
              [ INTRO ]
            </span>
          </div>

          <div className="demographics-header-right">
            <span className="demographics-kicker">
              TO START ANALYSIS
            </span>

            <button
              type="button"
              className="demographics-code-button"
            >
              ENTER CODE
            </button>
          </div>
        </header>

        <section className="demographics-content">
          <div className="demographics-loading">
            LOADING ANALYSIS...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="demographics-page">
      <header className="demographics-header">
        <div className="demographics-brand">
          <span className="demographics-logo">
            SKINSTATIC
          </span>

          <span className="demographics-intro">
            [ INTRO ]
          </span>
        </div>

        <div className="demographics-header-right">
          <span className="demographics-kicker">
            TO START ANALYSIS
          </span>

          <button
            type="button"
            className="demographics-code-button"
          >
            ENTER CODE
          </button>
        </div>
      </header>

      <section className="demographics-content">
        <div className="demographics-heading">
          <span>A.I.</span>
          <strong>ANALYSIS</strong>
        </div>

        <p className="demographics-description">
          A.I. has estimated the following.
          <br />
          Fix estimated information if needed.
        </p>

        <div className="demographics-layout">
          <aside className="demographics-sidebar">
            <span className="demographics-sidebar-title">
              DEMOGRAPHICS
            </span>

            <div className="demographics-sidebar-options">
              {(
                Object.keys(
                  categoryLabels
                ) as AnalysisCategory[]
              ).map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`demographics-sidebar-option ${
                    activeCategory === category
                      ? "is-active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveCategory(category)
                  }
                >
                  <span>
                    {categoryLabels[category]}
                  </span>

                  <span>→</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="demographics-results">
            <div className="demographics-results-header">
              <span>
                {categoryLabels[activeCategory]}
              </span>

              <span>
                AI ESTIMATE
              </span>
            </div>

            <div className="demographics-result-list">
              {sortedResults.map(
                ([value, score], index) => {
                  const isSelected =
                    actualSelections[
                      activeCategory
                    ] === value;

                  const isHighest =
                    index === 0;

                  return (
                    <button
                      key={value}
                      type="button"
                      className={`demographics-result ${
                        isSelected
                          ? "is-selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleActualSelection(
                          value
                        )
                      }
                    >
                      <div className="demographics-result-label">
                        <span>
                          {formatLabel(value)}
                        </span>

                        {isSelected && (
                          <span className="demographics-actual-label">
                            ACTUAL
                          </span>
                        )}
                      </div>

                      <div className="demographics-result-bar">
                        <span
                          className={`demographics-result-fill ${
                            isHighest
                              ? "is-highest"
                              : ""
                          }`}
                          style={{
                            width: `${score * 100}%`,
                          }}
                        />
                      </div>

                      <span className="demographics-result-score">
                        {formatPercentage(score)}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            <p className="demographics-helper">
              CLICK AN ESTIMATE TO MARK YOUR ACTUAL
              INFORMATION.
            </p>
          </div>
        </div>

        <div className="demographics-actions">
          <button
            type="button"
            className="demographics-back"
            onClick={handleBack}
          >
            ← BACK
          </button>

          <button
            type="button"
            className="demographics-continue"
            onClick={handleContinue}
          >
            CONTINUE →
          </button>
        </div>
      </section>
    </main>
  );
}