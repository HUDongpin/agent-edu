"use client";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button className="btn primary" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
