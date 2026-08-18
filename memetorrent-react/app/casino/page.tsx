/** 18+ floor in the page body. Site nav stays above, footer stays below. */
export default function CasinoPage() {
  return (
    <iframe
      src="/casino-floor/index.html"
      title="Nova Mirage — 18+"
      className="block w-full border-0 bg-[#0d1117]"
      style={{ height: 'calc(100dvh - 14rem)', minHeight: 640 }}
      allow="clipboard-write; fullscreen"
    />
  );
}
