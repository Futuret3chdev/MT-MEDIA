export default function GameEmbed({ children }: { children: React.ReactNode }) {
  return <div className="h-dvh w-full min-h-0 overflow-hidden bg-black text-white">{children}</div>;
}
