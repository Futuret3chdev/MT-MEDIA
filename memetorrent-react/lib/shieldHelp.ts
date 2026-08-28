import catalog from './shieldHelp.json';

export type ShieldArticle = {
  id: string;
  title: string;
  group: string;
  body: string;
  image?: string;
};

export const SHIELD_ARTICLES = catalog.articles as ShieldArticle[];

export function articleById(id: string): ShieldArticle | undefined {
  return SHIELD_ARTICLES.find((a) => a.id === id);
}

export function articlesByGroup(): { group: string; items: ShieldArticle[] }[] {
  const order: string[] = [];
  const map = new Map<string, ShieldArticle[]>();
  for (const a of SHIELD_ARTICLES) {
    if (!map.has(a.group)) {
      map.set(a.group, []);
      order.push(a.group);
    }
    map.get(a.group)!.push(a);
  }
  return order.map((group) => ({ group, items: map.get(group)! }));
}

export function renderShieldMd(src: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (!list.length) return;
    out.push('<ul class="list-disc pl-5 space-y-1 opacity-80">' + list.join('') + '</ul>');
    list = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('- ')) {
      list.push('<li>' + inline(esc(line.slice(2))) + '</li>');
      continue;
    }
    flushList();
    if (!line.trim()) continue;
    if (line.startsWith('# ')) out.push('<h1 class="text-3xl font-semibold mb-4">' + inline(esc(line.slice(2))) + '</h1>');
    else if (line.startsWith('## ')) out.push('<h2 class="text-xl font-semibold mt-8 mb-3">' + inline(esc(line.slice(3))) + '</h2>');
    else if (line.startsWith('### ')) out.push('<h3 class="text-lg font-semibold mt-6 mb-2">' + inline(esc(line.slice(4))) + '</h3>');
    else out.push('<p class="opacity-80 leading-relaxed mb-3">' + inline(esc(line)) + '</p>');
  }
  flushList();
  return out.join('\n');
}

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /\[([^\]]+)\]\((https?:[^)]+)\)/g,
      '<a class="text-cyan-300 underline" href="$2" rel="noopener">$1</a>'
    )
    .replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a class="text-cyan-300 underline break-all" href="$1" rel="noopener">$1</a>'
    )
    .replace(
      /([a-z0-9._%+-]+@futuret3ch\.com\.au)/gi,
      '<a class="text-cyan-300 underline" href="mailto:$1">$1</a>'
    );
}
