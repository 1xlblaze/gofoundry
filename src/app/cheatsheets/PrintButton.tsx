"use client";

export function PrintButton() {
  return (
    <button
      className="secondary-btn magnet-print-button"
      type="button"
      onClick={() => window.print()}
    >
      Print / Save as PDF
    </button>
  );
}
