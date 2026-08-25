import Link from "next/link";
import CourseList from "../../components/CourseList";

export default function CoursesPage() {
  return (
    <main>
      <Link href="/">← Back to the brief</Link>
      <h1>Course progress</h1>
      <p>Use the controls to narrow the cards without changing their meaning.</p>
      <CourseList />
    </main>
  );
}
