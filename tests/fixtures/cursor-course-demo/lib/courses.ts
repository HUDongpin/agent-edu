export interface CourseCard {
  id: number;
  title: string;
  complete: boolean;
}

export type Filter = "all" | "complete";

export const COURSES: CourseCard[] = [
  { id: 1, title: "Agentic Engineering", complete: true },
  { id: 2, title: "How to Use Cursor", complete: false },
  { id: 3, title: "Evaluation in Practice", complete: false },
  { id: 4, title: "Safety Review", complete: true },
];

export function transitionFilter(current: Filter, requested: Filter): Filter {
  return current === requested ? current : requested;
}

export function filterCourses(courses: CourseCard[], filter: Filter): CourseCard[] {
  if (filter === "complete") return courses.filter((course) => course.complete);
  return courses;
}
