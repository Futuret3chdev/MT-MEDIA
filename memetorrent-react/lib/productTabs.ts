export type ProductTab = {
  id: string;
  label: string;
  href: string;
  blurb: string;
};

/** Growth products we actually ship — nav API stays /developers. */
export const PRODUCT_TABS: ProductTab[] = [
  {
    id: 'shield',
    label: 'Shield',
    href: '/shield',
    blurb: 'Live grid and live tracking. Personal + Business. Help guides.',
  },
  {
    id: 'developers',
    label: 'Developers',
    href: '/developers',
    blurb: 'MT-Connect, social login, wallets. The site API — not replaced.',
  },
  {
    id: 'stats',
    label: 'Stats',
    href: '/status',
    blurb: 'Live ecosystem health and $MT status.',
  },
  {
    id: 'tap',
    label: 'TAP',
    href: '/#tap',
    blurb: 'TAP, TAPSHOP, TAPMATCH. Play, trade, work — TAP desk is in the portal.',
  },
  {
    id: 'bot',
    label: 'Bot',
    href: '/bot',
    blurb: 'Telegram, verification, TagMe, message bots.',
  },
  {
    id: 'games',
    label: 'Games',
    href: '/catalog',
    blurb: 'Catalog: Puck, Tap, Racer, Soccer Pro, Metro Vice, more.',
  },
  {
    id: 'wallet',
    label: 'Wallet',
    href: 'https://mt.futuret3ch.com.au/',
    blurb: 'INFINITE WALLET — self-custodial. Keys stay on the device.',
  },
  {
    id: 'studio',
    label: 'Studio',
    href: '/studio',
    blurb: 'Make and publish mini-games.',
  },
  {
    id: 'software',
    label: 'Software',
    href: '/software',
    blurb: 'Security and game software in the browser.',
  },
  {
    id: 'chat',
    label: 'Chat',
    href: '/chat',
    blurb: 'MT Chat. Same login as portal.',
  },
];

export function tabFromPath(pathname: string): string {
  if (pathname.startsWith('/shield')) return 'shield';
  if (pathname.startsWith('/developers')) return 'developers';
  if (pathname.startsWith('/status')) return 'stats';
  if (pathname.startsWith('/portal/tap') || pathname.startsWith('/portal/tapshop') || pathname.startsWith('/portal/tapmatch')) return 'tap';
  if (pathname.startsWith('/tap') || pathname.startsWith('/catalog')) return pathname.startsWith('/tap') ? 'tap' : 'games';
  if (pathname.startsWith('/bot')) return 'bot';
  if (pathname.startsWith('/studio')) return 'studio';
  if (pathname.startsWith('/software')) return 'software';
  if (pathname.startsWith('/chat')) return 'chat';
  return '';
}
