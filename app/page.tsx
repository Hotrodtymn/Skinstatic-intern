"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [hoveredSide, setHoveredSide] = useState<
    "left" | "right" | null
  >(null);

  return (
    <main className="skinstatic-page">
      <header className="skinstatic-header">
        <div className="skinstatic-brand">
          <span className="skinstatic-logo">SKINSTATIC</span>

          <span className="skinstatic-intro-label">
            [ INTRO ]
          </span>
        </div>

        <button
          type="button"
          className="enter-code-button"
        >
          ENTER CODE
        </button>
      </header>

      <section className="intro-screen">
        <div
          className={`intro-center ${
            hoveredSide === "left"
              ? "intro-center-right"
              : hoveredSide === "right"
              ? "intro-center-left"
              : ""
          }`}
        >
          <div className="intro-title">
            <span className="intro-title-main">
              Sophisticated
            </span>

            <span className="intro-title-sub">
              skincare
            </span>
          </div>
        </div>

        <div
          className={`intro-side intro-side-left ${
            hoveredSide === "left"
              ? "intro-side-active"
              : ""
          } ${
            hoveredSide === "right"
              ? "intro-side-hidden"
              : ""
          }`}
          onMouseEnter={() => setHoveredSide("left")}
          onMouseLeave={() => setHoveredSide(null)}
        >
          <div className="intro-half-diamond" />

          <button
            type="button"
            className="discover-button"
          >
            <span className="discover-arrow">
              <span />
            </span>

            <span>DISCOVER AI</span>
          </button>
        </div>

        <div
          className={`intro-side intro-side-right ${
            hoveredSide === "right"
              ? "intro-side-active"
              : ""
          } ${
            hoveredSide === "left"
              ? "intro-side-hidden"
              : ""
          }`}
          onMouseEnter={() => setHoveredSide("right")}
          onMouseLeave={() => setHoveredSide(null)}
        >
          <div className="intro-half-diamond" />

          <Link
            href="/testing"
            className="proceed-button"
          >
            <span>TAKE TEST</span>

            <span className="proceed-arrow">
              <span />
            </span>
          </Link>
        </div>

        <p className="intro-description">
          Skinstric developed an A.I. that creates a
          <br />
          highly-personalized routine tailored to
          <br />
          what your skin needs.
        </p>
      </section>
    </main>
  );
}