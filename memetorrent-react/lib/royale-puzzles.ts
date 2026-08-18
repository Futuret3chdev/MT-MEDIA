export type RoyaleCard = {
  id: string;
  emojis: string;
  answers: string[];
  hint: string;
};

/** Punchier, shorter locks — built for a 12-second live room, not the solo night. */
export const ROYALE_CARDS: RoyaleCard[] = [
  { id: 'iceberg', emojis: '🚢❄️', answers: ['titanic'], hint: 'Unsinkable' },
  { id: 'webhead', emojis: '🕸️🧑', answers: ['spiderman', 'spider-man', 'spider man'], hint: 'Neighbourhood' },
  { id: 'cape', emojis: '🦇🌃', answers: ['batman', 'the batman'], hint: 'Gotham' },
  { id: 'pride', emojis: '🦁🌅', answers: ['lion king', 'the lion king'], hint: 'Circle of life' },
  { id: 'saber', emojis: '⭐🗡️', answers: ['star wars', 'starwars'], hint: 'Force' },
  { id: 'letitgo', emojis: '❄️👸', answers: ['frozen'], hint: 'Queen of ice' },
  { id: 'biggerboat', emojis: '🦈🎬', answers: ['jaws'], hint: 'Beach closed' },
  { id: 'who', emojis: '👻🚫📞', answers: ['ghostbusters'], hint: 'Call' },
  { id: 'clownfish', emojis: '🔎🐠', answers: ['finding nemo', 'nemo'], hint: 'Dad swims' },
  { id: 'forgot', emojis: '✈️👦🏠', answers: ['home alone'], hint: 'Christmas' },
  { id: 'rings', emojis: '💍🌋', answers: ['lord of the rings', 'lotr'], hint: 'One ring' },
  { id: 'potter', emojis: '⚡🧙', answers: ['harry potter'], hint: 'Scar' },
  { id: 'matrix', emojis: '💊🐰', answers: ['the matrix', 'matrix'], hint: 'Red or blue' },
  { id: 'believe2', emojis: '🐝🍁', answers: ['believe', 'belief'], hint: 'Bee + leaf' },
  { id: 'candyeye', emojis: '👀🍭', answers: ['eye candy'], hint: 'Looks good' },
  { id: 'moonstep', emojis: '🌕👟', answers: ['moonwalk'], hint: 'King of pop' },
  { id: 'honeymoon2', emojis: '🍯🌕', answers: ['honeymoon'], hint: 'Just married' },
  { id: 'storm', emojis: '🧠⚡', answers: ['brainstorm'], hint: 'Ideas hit' },
  { id: 'moneytime', emojis: '💵⏳', answers: ['time is money'], hint: 'Clock tax' },
  { id: 'catsdogs', emojis: '🐱🐶☔', answers: ['raining cats and dogs'], hint: 'Pouring' },
  { id: 'hotdog2', emojis: '🌭', answers: ['hot dog', 'hotdog'], hint: 'Ballpark' },
  { id: 'moon', emojis: '🚀🌕', answers: ['to the moon', 'moon'], hint: 'Apes' },
  { id: 'hands', emojis: '💎✊', answers: ['diamond hands'], hint: 'Hold' },
  { id: 'red', emojis: '🐻📊', answers: ['bear market'], hint: 'Down only' },
  { id: 'green', emojis: '🐂📊', answers: ['bull market'], hint: 'Up only' },
  { id: 'drop', emojis: '🪂💵', answers: ['airdrop'], hint: 'Free bag' },
  { id: 'rug', emojis: '🧹📉', answers: ['rug pull', 'rugpull'], hint: 'Dev gone' },
  { id: 'frog', emojis: '🐸🚀', answers: ['pepe', 'meme coin', 'memecoin'], hint: 'Rare' },
  { id: 'whale2', emojis: '🐳📈', answers: ['whale'], hint: 'Moves the book' },
  { id: 'chain', emojis: '🧱🔗', answers: ['blockchain'], hint: 'Blocks' },
  { id: 'wallet', emojis: '♾️👛', answers: ['infinite wallet'], hint: 'Our purse' },
  { id: 'felt', emojis: '🎱🌃', answers: ['clubpool', 'pool'], hint: 'Green felt' },
  { id: 'blade', emojis: '⚔️🍍', answers: ['fruit ninja', 'mt fruit', 'fruit'], hint: 'Slice' },
  { id: 'plaza', emojis: '🏛️🎨', answers: ['gallery', 'mt world', 'museum'], hint: 'Walk-in art' },
  { id: 'night', emojis: '🟢❓', answers: ['emoji guess', 'royale', 'emoji'], hint: 'This room' },
];

export function cleanGuess(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function royaleHit(card: RoyaleCard, guess: string) {
  const g = cleanGuess(guess);
  return card.answers.some((a) => cleanGuess(a) === g);
}

export function cardById(id: string) {
  return ROYALE_CARDS.find((c) => c.id === id) || null;
}
