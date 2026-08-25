"use client";

import { useState } from "react";
import { COURSES, filterCourses, type Filter } from "../lib/courses";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "complete", label: "Complete" },
];

export default function CourseList() {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = filterCourses(COURSES, filter);

  return (
    <section aria-labelledby="course-list-title">
      <h2 id="course-list-title">Course catalogue</h2>
      <div className="filters" role="group" aria-label="Filter courses">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p aria-live="polite">Showing {visible.length} of {COURSES.length} courses</p>
      <ul className="courses">
        {visible.map((course) => (
          <li className="course" key={course.id}>
            <strong>{course.title}</strong>
            <span>{course.complete ? "Complete" : "Incomplete"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
