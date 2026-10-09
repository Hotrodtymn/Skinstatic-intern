
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = "race" | "age" | "gender";

type AnalysisData = Record<Category, Record<string, number>>;
type ActualSelections = Partial<Record<Category, string>>;

const categories: Category[] = ["race", "age", "gender"];

const labels: Record<Category, string> = {
  race: "RACE",
  age: "AGE",
  gender: "SEX",
};

function formatLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.min(value > 1 ? value / 100 : value, 1);
}

function normalizeAnalysis(value: unknown): AnalysisData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const nested =
    source.analysis &&
    typeof source.analysis === "object" &&
    !Array.isArray(source.analysis)
      ? (source.analysis as Record<string, unknown>)
      : source;

  const result = {} as AnalysisData;

  for (const category of categories) {
    const raw = nested[category];

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return null;
    }

    const entries = Object.entries(raw as Record<string, unknown>).flatMap(
      ([name, rawScore]) => {
        const score = normalizeScore(rawScore);

        return name.trim() && score !== null
          ? [[name, score] as [string, number]]
          : [];
      },
    );

    if (!entries.length) return null;

    result[category] = Object.fromEntries(entries);
  }

  return result;
}

function normalizeSelections(value: unknown): ActualSelections {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;
  const result: ActualSelections = {};

  for (const category of categories) {
    if (typeof source[category] === "string") {
      result[category] = source[category] as string;
    }
  }

  return result;
}

function percentage(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function CircularProgress({ score }: { score: number }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const progress = score * circumference;

  return (
    <div className="summary-circle-graph">
      <svg
        className="summary-circle-svg"
        viewBox="0 0 160 160"
        role="img"
        aria-label={`AI confidence ${percentage(score)}`}
      >
        <circle
          className="summary-circle-track"
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="2"
        />

        <circle
          className="summary-circle-progress"
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform="rotate(-90 80 80)"
        />
      </svg>

      <div className="summary-circle-center">
        <span>AI CONFIDENCE</span>
        <strong>{percentage(score)}</strong>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  const router = useRouter();

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [actualSelections, setActualSelections] =
    useState<ActualSelections>({});
  const [activeCategory, setActiveCategory] = useState<Category>("race");
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    try {
      const savedAnalysis = localStorage.getItem("skinstatic-analysis");
      const savedSelections = localStorage.getItem(
        "skinstatic-actual-selections",
      );

      if (savedAnalysis) {
        const normalized = normalizeAnalysis(JSON.parse(savedAnalysis));

        if (normalized) {
          setAnalysis(normalized);
        } else {
          setLoadError(true);
        }
      } else {
        setLoadError(true);
      }

      if (savedSelections) {
        setActualSelections(
          normalizeSelections(JSON.parse(savedSelections)),
        );
      }
    } catch (error) {
      console.error("Unable to load analysis:", error);
      setLoadError(true);
    } finally {
      setIsReady(true);
    }
  }, []);

  const results = useMemo(() => {
    if (!analysis) return [];

    return Object.entries(analysis[activeCategory]).sort(
      ([, a], [, b]) => b - a,
    );
  }, [analysis, activeCategory]);

  const leadingResult = results[0];
  const selectedActual = actualSelections[activeCategory];

  function selectActual(value: string) {
    const updated = {
      ...actualSelections,
      [activeCategory]: value,
    };

    setActualSelections(updated);

    try {
      localStorage.setItem(
        "skinstatic-actual-selections",
        JSON.stringify(updated),
      );
    } catch (error) {
      console.error("Unable to save selection:", error);
    }
  }

  function renderHeader() {
    return (
      <header className="summary-header">
        <div className="summary-brand">
          <button
            type="button"
            className="summary-logo"
            onClick={() => router.push("/")}
          >
            SKINSTATIC
          </button>
          <span className="summary-intro">[ INTRO ]</span>
        </div>

        <div className="summary-header-right">
          <span className="summary-kicker">TO START ANALYSIS</span>
          <button
            type="button"
            className="summary-code-button"
            onClick={() => router.push("/")}
          >
            ENTER CODE
          </button>
        </div>
      </header>
    );
  }

  if (!isReady) {
    return (
      <main className="summary-page">
        {renderHeader()}
        <p className="summary-loading">LOADING ANALYSIS DATA...</p>
      </main>
    );
  }

  if (!analysis || loadError) {
    return (
      <main className="summary-page">
        {renderHeader()}
        <section className="summary-content">
          <div className="summary-heading">
            <span>A.I.</span>
            <strong>ANALYSIS</strong>
          </div>
          <div className="summary-empty-state">
            <h2>ANALYSIS DATA UNAVAILABLE</h2>
            <p>
              We could not load the complete analysis. Return to the previous
              step and try again.
            </p>
            <button
              type="button"
              className="summary-back"
              onClick={() => router.push("/select")}
            >
              ← BACK
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="summary-page">
      {renderHeader()}

      <section className="summary-content">
        <div className="summary-heading">
          <span>A.I.</span>
          <strong>ANALYSIS</strong>
        </div>

        <div className="summary-section-heading">
          <span>DEMOGRAPHICS</span>
          <strong>PREDICTED {labels[activeCategory]} &amp; AGE</strong>
        </div>

        <div className="summary-dashboard">
          <nav className="summary-category-nav" aria-label="Demographic category">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`summary-category-button ${
                  activeCategory === category ? "is-active" : ""
                }`}
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
              >
                <span>{labels[category]}</span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </nav>

          <section className="summary-circle-panel">
            {leadingResult ? (
              <>
                <CircularProgress score={leadingResult[1]} />
                <span className="summary-circle-caption">
                  MOST LIKELY {labels[activeCategory]}
                </span>
                <strong className="summary-circle-result">
                  {formatLabel(leadingResult[0])}
                </strong>
              </>
            ) : (
              <p>No estimates available.</p>
            )}
          </section>

          <section className="summary-estimates">
            <div className="summary-estimates-heading">
              <span>{labels[activeCategory]}</span>
              <span>AI ESTIMATE</span>
            </div>

            <div className="summary-estimate-list">
              {results.map(([value, score], index) => {
                const selected = selectedActual === value;

                return (
                  <button
                    key={value}
                    type="button"
                    className={`summary-estimate-row ${
                      selected ? "is-selected" : ""
                    }`}
                    onClick={() => selectActual(value)}
                    aria-pressed={selected}
                  >
                    <span className="summary-estimate-rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="summary-estimate-info">
                      <span className="summary-estimate-name">
                        {formatLabel(value)}
                        {selected && (
                          <span className="summary-actual-label">ACTUAL</span>
                        )}
                      </span>

                      <span className="summary-estimate-track">
                        <span
                          className="summary-estimate-fill"
                          style={{ width: `${score * 100}%` }}
                        />
                      </span>
                    </span>

                    <span className="summary-estimate-value">
                      {percentage(score)}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="summary-estimate-help">
              SELECT AN ESTIMATE TO MARK YOUR ACTUAL INFORMATION.
            </p>
          </section>
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
