"use client";

import { useEffect, useRef, useState } from "react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { TourTooltip } from "./TourTooltip";

interface GuidedTourProps {
  steps: Step[];
  /** localStorage key that marks the tour as seen. */
  storageKey: string;
  /** Start the tour automatically if it hasn't been seen yet. */
  autoStart: boolean;
  /** Incremented by the parent to replay the tour on demand. */
  replayToken: number;
}

export function GuidedTour({
  steps,
  storageKey,
  autoStart,
  replayToken,
}: GuidedTourProps) {
  const [run, setRun] = useState(false);
  // Steps resolved against the DOM when the tour starts; null until then.
  const [activeSteps, setActiveSteps] = useState<Step[] | null>(null);
  // Read through a ref so callers can pass steps built during render.
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  // Drop steps whose target isn't on screen (empty lists, conditional
  // buttons) so the tour never stalls on a missing element.
  useEffect(() => {
    if (!run) {
      setActiveSteps(null);
      return;
    }
    setActiveSteps(
      stepsRef.current.filter(
        (step) =>
          step.target === "body" ||
          typeof step.target !== "string" ||
          document.querySelector(step.target) !== null,
      ),
    );
  }, [run]);

  useEffect(() => {
    if (!autoStart) return;
    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem(storageKey) === "1";
    } catch {
      // Storage unavailable (private mode etc.) — show the tour anyway.
    }
    if (!alreadySeen) setRun(true);
  }, [autoStart, storageKey]);

  useEffect(() => {
    if (replayToken > 0) setRun(true);
  }, [replayToken]);

  const handleEvent = (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setRun(false);
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        // Ignore storage failures.
      }
    }
  };

  return (
    <Joyride
      key={replayToken}
      run={run && activeSteps !== null && activeSteps.length > 0}
      steps={activeSteps ?? []}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      tooltipComponent={TourTooltip}
      options={{
        primaryColor: "#f59e0b",
        arrowColor: "#ffffff",
        overlayColor: "rgba(17, 24, 39, 0.6)",
        spotlightRadius: 16,
        zIndex: 10000,
        scrollOffset: 120,
        skipBeacon: true,
      }}
    />
  );
}
