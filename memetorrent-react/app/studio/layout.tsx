export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="sr-only">MT Studio SDK — monetize the game</div>
      {children}
    </div>
  );
}
