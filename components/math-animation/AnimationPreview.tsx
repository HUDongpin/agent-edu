"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import styles from "./VisualWorkbench.module.css";

const TAU = Math.PI * 2;
const DURATION_SECONDS = 8;
const FRAME_COUNT = 120;
const LAST_FRAME_INDEX = FRAME_COUNT - 1;

const CIRCLE = {
  centerX: 165,
  centerY: 155,
  radius: 100,
} as const;

const WAVE = {
  startX: 50,
  endX: 490,
  centerY: 155,
  amplitude: 100,
} as const;

export interface AnimationPreviewLabels {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly equation: string;
  readonly unitCircle: string;
  readonly sinePlot: string;
  readonly play: string;
  readonly pause: string;
  readonly replay: string;
  readonly reset: string;
  readonly timeline: string;
  readonly frame: string;
  readonly angle: string;
  readonly sine: string;
  readonly cosine: string;
  readonly projection: string;
  readonly reducedMotion: string;
  readonly paused: string;
  readonly playing: string;
  readonly finished: string;
}

export interface AnimationPreviewProps {
  readonly id?: string;
  readonly tabIndex?: number;
  readonly className?: string;
  readonly locale?: string;
  readonly labels?: Partial<AnimationPreviewLabels>;
}

const DEFAULT_LABELS: AnimationPreviewLabels = {
  eyebrow: "Interactive motion lab",
  title: "One angle, two synchronized views",
  description:
    "Scrub one turn of the unit circle. The point's vertical projection becomes the height of the sine curve at the same angle.",
  equation: "P(θ) = (cos θ, sin θ)  →  y = sin θ",
  unitCircle: "Unit circle",
  sinePlot: "Sine over one turn",
  play: "Play",
  pause: "Pause",
  replay: "Replay",
  reset: "Reset",
  timeline: "Animation timeline",
  frame: "Frame",
  angle: "Angle",
  sine: "sin θ",
  cosine: "cos θ",
  projection: "Vertical projection",
  reducedMotion:
    "Continuous playback is off because your system requests reduced motion. Use the timeline to inspect any static frame.",
  paused: "Animation paused",
  playing: "Animation playing",
  finished: "Animation reached the final frame",
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function cleanZero(value: number) {
  return Math.abs(value) < 0.0005 ? 0 : value;
}

function pointOnCircle(theta: number, radius: number = CIRCLE.radius) {
  return {
    x: CIRCLE.centerX + radius * Math.cos(theta),
    y: CIRCLE.centerY - radius * Math.sin(theta),
  };
}

function wavePoint(theta: number) {
  return {
    x: WAVE.startX + (theta / TAU) * (WAVE.endX - WAVE.startX),
    y: WAVE.centerY - WAVE.amplitude * Math.sin(theta),
  };
}

function buildWavePath(endTheta: number, samples = 180) {
  if (endTheta <= 0) return "";

  const points = Math.max(2, Math.ceil(samples * (endTheta / TAU)));
  let path = "";
  for (let index = 0; index <= points; index += 1) {
    const theta = (endTheta * index) / points;
    const point = wavePoint(theta);
    path += `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
  }
  return path.trim();
}

function buildAngleArc(theta: number) {
  if (theta <= 0) return "";

  const visibleTheta = Math.min(theta, TAU - 0.001);
  const radius = 42;
  const end = pointOnCircle(visibleTheta, radius);
  const largeArc = visibleTheta > Math.PI ? 1 : 0;
  return `M ${CIRCLE.centerX + radius} ${CIRCLE.centerY} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function useReducedMotion(onReduce: () => void) {
  const subscribe = useCallback((notify: () => void) => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (query.matches) onReduce();
      notify();
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [onReduce]);
  const getSnapshot = useCallback(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function AnimationPreview({
  id: anchorId,
  tabIndex,
  className,
  locale = "en",
  labels: labelOverrides,
}: AnimationPreviewProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const stopForReducedMotion = useCallback(() => setIsPlaying(false), []);
  const progressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const reducedMotion = useReducedMotion(stopForReducedMotion);
  const rawId = useId();
  const id = rawId.replace(/:/g, "");

  const theta = progress * TAU;
  const sine = cleanZero(Math.sin(theta));
  const cosine = cleanZero(Math.cos(theta));
  const circlePoint = pointOnCircle(theta);
  const graphPoint = wavePoint(theta);
  const frame = Math.min(LAST_FRAME_INDEX, Math.floor(progress * FRAME_COUNT));
  const angleInPi = cleanZero(theta / Math.PI);
  const angleInDegrees = Math.round(progress * 360);
  const valueFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [locale],
  );
  const integerFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const fullWavePath = useMemo(() => buildWavePath(TAU), []);
  const tracedWavePath = useMemo(() => buildWavePath(theta), [theta]);
  const angleArc = useMemo(() => buildAngleArc(theta), [theta]);

  useEffect(() => {
    if (!isPlaying || reducedMotion) return;

    const tick = (time: number) => {
      const previous = lastTimeRef.current ?? time;
      const elapsedSeconds = Math.min((time - previous) / 1000, 0.1);
      lastTimeRef.current = time;
      const next = clamp01(progressRef.current + elapsedSeconds / DURATION_SECONDS);
      progressRef.current = next;
      setProgress(next);

      if (next >= 1) {
        setIsPlaying(false);
        lastTimeRef.current = null;
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
      lastTimeRef.current = null;
    };
  }, [isPlaying, reducedMotion]);

  const setFrameProgress = (next: number) => {
    const value = clamp01(next);
    progressRef.current = value;
    setProgress(value);
  };

  const togglePlayback = () => {
    if (reducedMotion) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (progressRef.current >= 1) setFrameProgress(0);
    lastTimeRef.current = null;
    setIsPlaying(true);
  };

  const reset = () => {
    setIsPlaying(false);
    lastTimeRef.current = null;
    setFrameProgress(0);
  };

  const status = isPlaying
    ? labels.playing
    : progress >= 1
      ? labels.finished
      : labels.paused;
  const playLabel = isPlaying
    ? labels.pause
    : progress >= 1
      ? labels.replay
      : labels.play;
  const dynamicDescription = `${labels.angle}: ${valueFormatter.format(angleInPi)}π (${integerFormatter.format(angleInDegrees)}°). ${labels.sine}: ${valueFormatter.format(sine)}. ${labels.cosine}: ${valueFormatter.format(cosine)}.`;

  return (
    <section
      id={anchorId}
      tabIndex={tabIndex}
      className={[styles.preview, className].filter(Boolean).join(" ")}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <header className={styles.previewHeader}>
        <div>
          <p className={styles.eyebrow}>{labels.eyebrow}</p>
          <h2 id={`${id}-title`}>{labels.title}</h2>
          <p id={`${id}-description`} className={styles.description}>
            {labels.description}
          </p>
        </div>
        <code className={styles.equation} dir="ltr">
          {labels.equation}
        </code>
      </header>

      <div className={styles.valueLedger} aria-label={dynamicDescription} dir="ltr">
        <div>
          <span>{labels.angle}</span>
          <strong>{valueFormatter.format(angleInPi)}π</strong>
          <small>{integerFormatter.format(angleInDegrees)}°</small>
        </div>
        <div>
          <span>{labels.sine}</span>
          <strong>{valueFormatter.format(sine)}</strong>
          <small>y</small>
        </div>
        <div>
          <span>{labels.cosine}</span>
          <strong>{valueFormatter.format(cosine)}</strong>
          <small>x</small>
        </div>
        <div>
          <span>{labels.frame}</span>
          <strong>{integerFormatter.format(frame)}</strong>
          <small>/ {integerFormatter.format(LAST_FRAME_INDEX)}</small>
        </div>
      </div>

      <div className={styles.plotGrid} dir="ltr">
        <figure className={styles.plotPanel}>
          <figcaption>{labels.unitCircle}</figcaption>
          <svg
            className={styles.mathGraphic}
            viewBox="0 0 340 310"
            role="img"
            aria-labelledby={`${id}-circle-title ${id}-circle-description`}
          >
            <title id={`${id}-circle-title`}>{labels.unitCircle}</title>
            <desc id={`${id}-circle-description`}>
              {dynamicDescription} {labels.projection}: {valueFormatter.format(sine)}.
            </desc>
            <defs>
              <pattern id={`${id}-circle-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" className={styles.minorGrid} />
              </pattern>
            </defs>
            <rect x="0" y="0" width="340" height="310" rx="10" className={styles.paper} />
            <rect x="0" y="0" width="340" height="310" rx="10" fill={`url(#${id}-circle-grid)`} />
            <line x1="30" y1={CIRCLE.centerY} x2="300" y2={CIRCLE.centerY} className={styles.axis} />
            <line x1={CIRCLE.centerX} y1="20" x2={CIRCLE.centerX} y2="290" className={styles.axis} />
            <text x="304" y={CIRCLE.centerY - 8} className={styles.axisLabel}>x</text>
            <text x={CIRCLE.centerX + 9} y="24" className={styles.axisLabel}>y</text>
            <circle cx={CIRCLE.centerX} cy={CIRCLE.centerY} r={CIRCLE.radius} className={styles.referenceCircle} />
            <path d={angleArc} className={styles.angleArc} />
            <line
              x1={CIRCLE.centerX}
              y1={CIRCLE.centerY}
              x2={circlePoint.x}
              y2={circlePoint.y}
              className={styles.radiusLine}
            />
            <line
              x1={circlePoint.x}
              y1={circlePoint.y}
              x2={circlePoint.x}
              y2={CIRCLE.centerY}
              className={styles.sineProjection}
              data-testid="unit-circle-sine-projection"
            />
            <line
              x1={CIRCLE.centerX}
              y1={circlePoint.y}
              x2={circlePoint.x}
              y2={circlePoint.y}
              className={styles.cosineProjection}
              data-testid="unit-circle-cosine-projection"
            />
            <circle cx={circlePoint.x} cy={circlePoint.y} r="7" className={styles.livePointHalo} />
            <circle
              cx={circlePoint.x}
              cy={circlePoint.y}
              r="4.4"
              className={styles.livePoint}
              data-testid="unit-circle-live-point"
            />
            <text
              x={circlePoint.x + (circlePoint.x >= CIRCLE.centerX ? -10 : 10)}
              y={circlePoint.y - 10}
              textAnchor={circlePoint.x >= CIRCLE.centerX ? "end" : "start"}
              className={styles.valueLabel}
              data-testid="unit-circle-value-label"
            >
              sin θ = {valueFormatter.format(sine)}
            </text>
          </svg>
        </figure>

        <figure className={styles.plotPanel}>
          <figcaption>{labels.sinePlot}</figcaption>
          <svg
            className={styles.mathGraphic}
            viewBox="0 0 520 310"
            role="img"
            aria-labelledby={`${id}-wave-title ${id}-wave-description`}
          >
            <title id={`${id}-wave-title`}>{labels.sinePlot}</title>
            <desc id={`${id}-wave-description`}>{dynamicDescription}</desc>
            <defs>
              <pattern id={`${id}-wave-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" className={styles.minorGrid} />
              </pattern>
            </defs>
            <rect x="0" y="0" width="520" height="310" rx="10" className={styles.paper} />
            <rect x="0" y="0" width="520" height="310" rx="10" fill={`url(#${id}-wave-grid)`} />
            <line x1={WAVE.startX} y1="24" x2={WAVE.startX} y2="286" className={styles.axis} />
            <line x1="28" y1={WAVE.centerY} x2="500" y2={WAVE.centerY} className={styles.axis} />
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const x = WAVE.startX + tick * (WAVE.endX - WAVE.startX);
              const tickLabel = tick === 0
                ? "0"
                : tick === 0.25
                  ? "π/2"
                  : tick === 0.5
                    ? "π"
                    : tick === 0.75
                      ? "3π/2"
                      : "2π";
              return (
                <g key={tickLabel}>
                  <line x1={x} y1={WAVE.centerY - 5} x2={x} y2={WAVE.centerY + 5} className={styles.tick} />
                  <text x={x} y={WAVE.centerY + 24} textAnchor="middle" className={styles.tickLabel}>
                    {tickLabel}
                  </text>
                </g>
              );
            })}
            <text x="25" y={WAVE.centerY - WAVE.amplitude + 4} className={styles.tickLabel}>1</text>
            <text x="20" y={WAVE.centerY + WAVE.amplitude + 4} className={styles.tickLabel}>−1</text>
            <path d={fullWavePath} className={styles.waveGhost} />
            {tracedWavePath ? <path d={tracedWavePath} className={styles.waveTrace} /> : null}
            <line
              x1={graphPoint.x}
              y1={WAVE.centerY}
              x2={graphPoint.x}
              y2={graphPoint.y}
              className={styles.sineProjection}
            />
            <circle cx={graphPoint.x} cy={graphPoint.y} r="7" className={styles.livePointHalo} />
            <circle cx={graphPoint.x} cy={graphPoint.y} r="4.4" className={styles.livePoint} />
            <text
              x={graphPoint.x > 420 ? graphPoint.x - 10 : graphPoint.x + 10}
              y={graphPoint.y < 48 ? graphPoint.y + 22 : graphPoint.y - 11}
              textAnchor={graphPoint.x > 420 ? "end" : "start"}
              className={styles.valueLabel}
            >
              ({valueFormatter.format(angleInPi)}π, {valueFormatter.format(sine)})
            </text>
          </svg>
        </figure>
      </div>

      <div className={styles.timelineWorkbench}>
        <div className={styles.transportControls}>
          <button
            type="button"
            className={styles.transportButton}
            onClick={togglePlayback}
            disabled={reducedMotion}
            aria-pressed={isPlaying}
          >
            <span>{playLabel}</span>
          </button>
          <button type="button" className={styles.transportButton} onClick={reset}>
            <span>{labels.reset}</span>
          </button>
        </div>

        <label className={styles.timeline} htmlFor={`${id}-timeline`}>
          <span className={styles.timelineLabel}>
            <strong>{labels.timeline}</strong>
            <output htmlFor={`${id}-timeline`}>
              {valueFormatter.format(progress * DURATION_SECONDS)}s / {valueFormatter.format(DURATION_SECONDS)}s
            </output>
          </span>
          <input
            id={`${id}-timeline`}
            type="range"
            min="0"
            max="1000"
            step="1"
            value={Math.round(progress * 1000)}
            dir="ltr"
            aria-valuetext={dynamicDescription}
            onChange={(event) => {
              setIsPlaying(false);
              setFrameProgress(Number(event.currentTarget.value) / 1000);
            }}
          />
          <span className={styles.timelineTicks} aria-hidden="true" dir="ltr">
            <span>0s</span>
            <span>2s</span>
            <span>4s</span>
            <span>6s</span>
            <span>8s</span>
          </span>
        </label>
      </div>

      {reducedMotion ? <p className={styles.reducedNotice}>{labels.reducedMotion}</p> : null}
      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {status}.
      </p>
    </section>
  );
}
