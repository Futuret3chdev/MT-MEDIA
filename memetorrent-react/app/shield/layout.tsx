import HashScroll from './HashScroll';

export default function ShieldLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HashScroll />
      {children}
    </>
  );
}
