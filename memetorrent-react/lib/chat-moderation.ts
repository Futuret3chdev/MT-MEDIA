/** Blocks slurs and heavy abuse. Returns a reason or null if clean. */
export function blockedReason(text: string): string | null {
  const t = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const slurs = [
    'nigger',
    'nigga',
    'faggot',
    'fag ',
    'kike',
    'spic',
    'chink',
    'retard',
    'tranny',
    'wetback',
    'coon',
    'paki',
    'fuck',
    'shit',
    'cunt',
    'bitch',
    'asshole',
    'motherfucker',
  ];
  if (slurs.some((w) => t.includes(w.trim()))) return 'Message blocked.';
  return null;
}
