"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isAgentOrchestrationModuleComplete } from "@/lib/agent-orchestration/progress";
import type {
  AgentOrchestrationCheckpointCopy,
  AgentOrchestrationModuleSlug,
} from "@/lib/agent-orchestration/types";
import { useAgentOrchestrationProgress } from "./useAgentOrchestrationProgress";
import styles from "./AgentOrchestrationCourse.module.css";

type ContinuationDirection = "none" | "before" | "after" | "both";

export interface ModuleMapPhase {
  readonly id: string;
  readonly title: string;
  readonly modules: readonly {
    readonly checkpoint: AgentOrchestrationCheckpointCopy;
    readonly order: number;
    readonly slug: AgentOrchestrationModuleSlug;
    readonly title: string;
  }[];
}

export default function ActiveModuleMapReveal({
  activeSlug,
  continuationLabel,
  courseLocale,
  phases,
  stateLabels,
}: {
  activeSlug: AgentOrchestrationModuleSlug;
  continuationLabel: string;
  courseLocale: string;
  phases: readonly ModuleMapPhase[];
  stateLabels: {
    readonly complete: string;
    readonly current: string;
    readonly nextIncomplete: string;
  };
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [continuationDirection, setContinuationDirection] =
    useState<ContinuationDirection>("none");
  const snapshot = useAgentOrchestrationProgress();
  const nextIncompleteSlug = snapshot.status === "available"
    ? phases
      .flatMap((phase) => phase.modules)
      .find(
        (module) => !isAgentOrchestrationModuleComplete(
          snapshot.record,
          module.slug,
          module.checkpoint,
        ),
      )?.slug ?? null
    : null;

  useEffect(() => {
    const map = mapRef.current;
    const scroller = map?.closest<HTMLElement>("[data-module-map-scroll]");
    if (!map || !scroller) return;

    const details = map.closest<HTMLDetailsElement>("details");
    let animationFrame = 0;

    const updateContinuation = () => {
      const hasBefore = scroller.scrollTop > 4;
      const hasAfter =
        scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 4;
      setContinuationDirection(
        hasBefore && hasAfter
          ? "both"
          : hasBefore
            ? "before"
            : hasAfter
              ? "after"
              : "none",
      );
    };

    const revealActiveModule = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const activeLink = map.querySelector<HTMLElement>('a[aria-current="page"]');
        if (activeLink && scroller.clientHeight > 0) {
          const scrollerRect = scroller.getBoundingClientRect();
          const activeRect = activeLink.getBoundingClientRect();
          const activeIsClipped =
            activeRect.top < scrollerRect.top + 4
            || activeRect.bottom > scrollerRect.bottom - 4;

          if (activeIsClipped) {
            const relativeTop = activeRect.top - scrollerRect.top;
            const centeredTop =
              scroller.scrollTop
              + relativeTop
              - (scroller.clientHeight - activeRect.height) / 2;
            scroller.scrollTop = Math.max(
              0,
              Math.min(centeredTop, scroller.scrollHeight - scroller.clientHeight),
            );
          }
        }
        updateContinuation();
      });
    };

    const handleDetailsToggle = () => {
      if (details?.open) revealActiveModule();
    };

    scroller.addEventListener("scroll", updateContinuation, { passive: true });
    window.addEventListener("resize", revealActiveModule);
    details?.addEventListener("toggle", handleDetailsToggle);

    if (!details || details.open) revealActiveModule();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      scroller.removeEventListener("scroll", updateContinuation);
      window.removeEventListener("resize", revealActiveModule);
      details?.removeEventListener("toggle", handleDetailsToggle);
    };
  }, [snapshot.status]);

  const hasBefore =
    continuationDirection === "before" || continuationDirection === "both";
  const hasAfter =
    continuationDirection === "after" || continuationDirection === "both";

  return (
    <div className={styles.moduleMapReveal} ref={mapRef}>
      <ol>
        {phases.map((phase) => (
          <li className={styles.mapPhase} key={phase.id}>
            <span>{phase.title}</span>
            <ol>
              {phase.modules.map((module) => {
                const isCurrent = module.slug === activeSlug;
                const isComplete = snapshot.status === "available"
                  && isAgentOrchestrationModuleComplete(
                    snapshot.record,
                    module.slug,
                    module.checkpoint,
                  );
                const isNextIncomplete = module.slug === nextIncompleteSlug;
                return (
                  <li key={module.slug}>
                    <Link
                      href={`/${courseLocale}/agent-orchestration/${module.slug}/`}
                      aria-current={isCurrent ? "page" : undefined}
                      prefetch={false}
                    >
                      <span>{String(module.order).padStart(2, "0")}</span>
                      <span className={styles.mapLinkCopy}>
                        <span>{module.title}</span>
                        {isCurrent || isComplete || isNextIncomplete ? (
                          <span className={styles.mapStates}>
                            {isCurrent ? (
                              <small className={styles.mapState} data-state="current">
                                {stateLabels.current}
                              </small>
                            ) : null}
                            {isComplete ? (
                              <small className={styles.mapState} data-state="complete">
                                <span aria-hidden="true">✓</span> {stateLabels.complete}
                              </small>
                            ) : null}
                            {isNextIncomplete && !isComplete ? (
                              <small className={styles.mapState} data-state="next">
                                {stateLabels.nextIncomplete}
                              </small>
                            ) : null}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
      <span
        className={styles.mapContinuation}
        data-direction={continuationDirection}
        aria-hidden="true"
      >
        {hasBefore ? <span>↑</span> : null}
        <span>{continuationLabel}</span>
        {hasAfter ? <span>↓</span> : null}
      </span>
    </div>
  );
}
