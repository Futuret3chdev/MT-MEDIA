import Link from 'next/link';

export default function BackBar({
  links = [],
}: {
  links?: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-4 text-sm mb-6">
      <Link href="/" className="opacity-70 hover:opacity-100">
        ← Home
      </Link>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="opacity-70 hover:opacity-100">
          ← {l.label}
        </Link>
      ))}
    </div>
  );
}
