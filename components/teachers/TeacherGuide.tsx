"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import styles from "./TeacherGuide.module.css";

export type TeacherPlanMinutes = 45 | 90 | 180;

export interface TeacherTimelineStop {
  range: string;
  label: string;
  href?: string;
}

export interface TeacherPlan {
  minutes: TeacherPlanMinutes;
  description: string;
  stops: readonly TeacherTimelineStop[];
}

export default function TeacherGuide({
  chooseTitle,
  prepareTitle,
  followTitle,
  selectedLabel,
  plans,
  prepare,
  supportLabel,
  support,
}: {
  chooseTitle: string;
  prepareTitle: string;
  followTitle: string;
  selectedLabel: string;
  plans: readonly TeacherPlan[];
  prepare: ReactNode;
  supportLabel: string;
  support: ReactNode;
}) {
  const [selected, setSelected] = useState<TeacherPlanMinutes>(90);
  const [supportOpen, setSupportOpen] = useState(false);
  const groupName = useId();
  const supportId = `${groupName}-support`;
  const active = plans.find((plan) => plan.minutes === selected) ?? plans[0];

  const renderTimeline = (plan: TeacherPlan, panel = false) => (
    <div
      className={styles.plan}
      data-plan-minutes={plan.minutes}
      {...(panel ? {
        id: `${groupName}-plan-${plan.minutes}`,
        role: "tabpanel",
        "aria-labelledby": `${groupName}-option-${plan.minutes}`,
        hidden: plan.minutes !== selected,
      } : {})}
    >
      <div className={styles.planHeading}>
        <strong>{plan.minutes} min</strong>
        <p>{plan.description}</p>
      </div>
      <ol className={styles.timeline}>
        {plan.stops.map((stop) => (
          <li key={`${plan.minutes}-${stop.range}-${stop.label}`}>
            <span className={styles.time}>{stop.range}</span>
            {stop.href ? <Link href={stop.href}>{stop.label}</Link> : <span>{stop.label}</span>}
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <div className={styles.guide}>
      <ol className={styles.steps} aria-label={`${chooseTitle}, ${prepareTitle}, ${followTitle}`}>
        <li><span>1</span>{chooseTitle}</li>
        <li><span>2</span>{prepareTitle}</li>
        <li><span>3</span>{followTitle}</li>
      </ol>

      <section className={styles.stage} aria-labelledby={`${groupName}-choose`}>
        <h2 id={`${groupName}-choose`}>{chooseTitle}</h2>
        <fieldset className={styles.selector}>
          <legend className={styles.srOnly}>{chooseTitle}</legend>
          {plans.map((plan) => (
            <label key={plan.minutes} className={styles.option}>
              <input
                id={`${groupName}-option-${plan.minutes}`}
                type="radio"
                name={groupName}
                value={plan.minutes}
                checked={plan.minutes === selected}
                aria-controls={`${groupName}-plan-${plan.minutes}`}
                onChange={() => setSelected(plan.minutes)}
              />
              <span>{plan.minutes} min</span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className={styles.stage} aria-labelledby={`${groupName}-prepare`}>
        <h2 id={`${groupName}-prepare`}>{prepareTitle}</h2>
        <div className={styles.prepare}>{prepare}</div>
      </section>

      <section className={styles.stage} aria-labelledby={`${groupName}-follow`}>
        <div className={styles.stageHeading}>
          <h2 id={`${groupName}-follow`}>{followTitle}</h2>
          <span className={styles.selection} aria-live="polite">
            {selectedLabel}: {active.minutes} min
          </span>
        </div>
        <div className={styles.selectedOnly}>
          {plans.map((plan) => renderTimeline(plan, true))}
        </div>
        <div className={styles.printAll} aria-hidden="true">
          {plans.map((plan) => renderTimeline(plan))}
        </div>
      </section>

      <section className={styles.support}>
        <button
          className={styles.supportToggle}
          type="button"
          aria-expanded={supportOpen}
          aria-controls={supportId}
          onClick={() => setSupportOpen((open) => !open)}
        >
          <span>{supportLabel}</span>
          <span aria-hidden="true">{supportOpen ? "−" : "+"}</span>
        </button>
        <div
          id={supportId}
          className={`${styles.supportBody} ${supportOpen ? styles.supportBodyOpen : ""}`}
        >
          {support}
        </div>
      </section>
    </div>
  );
}
