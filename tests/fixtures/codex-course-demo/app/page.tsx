import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <p className="eyebrow">Codex capstone fixture</p>
      <h1>Complete one small course filter</h1>
      <p>
        The course list is valid but unfinished. Add the missing Incomplete
        filter, keep it accessible, and prove that every route still works.
      </p>
      <Link className="primary" href="/courses/">Open the course list</Link>
    </main>
  );
}
