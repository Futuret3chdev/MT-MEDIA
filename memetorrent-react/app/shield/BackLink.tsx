'use client';

export default function BackLink({ label = 'Back' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window === 'undefined') return;
        if (window.history.length > 1) window.history.back();
        else window.location.href = '/shield';
      }}
      className="text-sm opacity-60 hover:opacity-100"
    >
      ← {label}
    </button>
  );
}
