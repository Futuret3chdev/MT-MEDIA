export type EmojiPuzzle = {
  id: string;
  emojis: string;
  answers: string[];
  hint: string;
  pack: 'phrase' | 'screen' | 'crypto' | 'mt';
};

export const EMOJI_PUZZLES: EmojiPuzzle[] = [
  { id: 'believe', emojis: '🐝🍃', answers: ['believe', 'belief'], hint: 'Bee + leaf', pack: 'phrase' },
  { id: 'moonwalk', emojis: '🌙🚶', answers: ['moonwalk', 'moon walk'], hint: 'Night step', pack: 'phrase' },
  { id: 'eyecandy', emojis: '👁️🍬', answers: ['eye candy', 'eyecandy'], hint: 'Looks sweet', pack: 'phrase' },
  { id: 'hotdog', emojis: '🔥🐕', answers: ['hot dog', 'hotdog'], hint: 'Ballpark', pack: 'phrase' },
  { id: 'honeymoon', emojis: '🍯🌙', answers: ['honeymoon', 'honey moon'], hint: 'After the vows', pack: 'phrase' },
  { id: 'snowman', emojis: '❄️👨', answers: ['snowman', 'snow man'], hint: 'Winter fellow', pack: 'phrase' },
  { id: 'brainstorm', emojis: '🧠💡', answers: ['brainstorm', 'brain storm'], hint: 'Idea weather', pack: 'phrase' },
  { id: 'timeismoney', emojis: '⏰💰', answers: ['time is money', 'timeismoney'], hint: 'Clock + cash', pack: 'phrase' },
  { id: 'rainingcatsdogs', emojis: '🌧️🐱🐶', answers: ['raining cats and dogs', 'raining cats & dogs'], hint: 'Bad weather saying', pack: 'phrase' },
  { id: 'sunflower', emojis: '☀️🌸', answers: ['sunflower', 'sun flower'], hint: 'Tall yellow', pack: 'phrase' },
  { id: 'butterfly', emojis: '🧈🪰', answers: ['butterfly', 'butter fly'], hint: 'Kitchen + wings', pack: 'phrase' },
  { id: 'keyboard', emojis: '🔑🪵', answers: ['keyboard', 'key board'], hint: 'Type on it', pack: 'phrase' },
  { id: 'football', emojis: '🦶⚽', answers: ['football', 'foot ball', 'soccer'], hint: 'Kick game', pack: 'phrase' },
  { id: 'cupcake', emojis: '☕🎂', answers: ['cupcake', 'cup cake'], hint: 'Tiny cake', pack: 'phrase' },
  { id: 'starfish', emojis: '⭐🐟', answers: ['starfish', 'star fish'], hint: 'Sea shape', pack: 'phrase' },
  { id: 'lionking', emojis: '🦁👑', answers: ['the lion king', 'lion king'], hint: 'Pride rock', pack: 'screen' },
  { id: 'spiderman', emojis: '🕷️👨', answers: ['spiderman', 'spider-man', 'spider man'], hint: 'Webs', pack: 'screen' },
  { id: 'batman', emojis: '🦇👨', answers: ['batman', 'bat man'], hint: 'Gotham', pack: 'screen' },
  { id: 'frozen', emojis: '❄️👸', answers: ['frozen'], hint: 'Let it go', pack: 'screen' },
  { id: 'starwars', emojis: '⭐⚔️', answers: ['star wars', 'starwars'], hint: 'A long time ago', pack: 'screen' },
  { id: 'jaws', emojis: '🦈', answers: ['jaws'], hint: 'You are gonna need a bigger boat', pack: 'screen' },
  { id: 'ghostbusters', emojis: '👻🚫', answers: ['ghostbusters', 'ghost busters'], hint: 'Who you gonna call', pack: 'screen' },
  { id: 'findingnemo', emojis: '🔎🐠', answers: ['finding nemo', 'findingnemo'], hint: 'Lost clownfish', pack: 'screen' },
  { id: 'titanic', emojis: '🚢❄️💔', answers: ['titanic'], hint: 'Iceberg', pack: 'screen' },
  { id: 'homealone', emojis: '🏠👦', answers: ['home alone', 'homealone'], hint: 'Forgot the kid', pack: 'screen' },
  { id: 'tothemoon', emojis: '🚀🌙', answers: ['to the moon', 'moon'], hint: 'Launchpad talk', pack: 'crypto' },
  { id: 'diamondhands', emojis: '💎🙌', answers: ['diamond hands', 'diamondhands'], hint: 'Do not sell', pack: 'crypto' },
  { id: 'bearmarket', emojis: '🐻📉', answers: ['bear market', 'bearmarket'], hint: 'Red days', pack: 'crypto' },
  { id: 'bullmarket', emojis: '🐂📈', answers: ['bull market', 'bullmarket'], hint: 'Green days', pack: 'crypto' },
  { id: 'whale', emojis: '🐋💰', answers: ['whale'], hint: 'Huge bag', pack: 'crypto' },
  { id: 'rugpull', emojis: '🧶⬇️', answers: ['rug pull', 'rugpull'], hint: 'Floor gone', pack: 'crypto' },
  { id: 'airdrop', emojis: '🪂🪙', answers: ['airdrop', 'air drop'], hint: 'Free bag from the sky', pack: 'crypto' },
  { id: 'memecoin', emojis: '🐸🪙', answers: ['meme coin', 'memecoin', 'pepe'], hint: 'Frog money', pack: 'crypto' },
  { id: 'blockchain', emojis: '🔗⛓️', answers: ['blockchain', 'block chain'], hint: 'Linked ledgers', pack: 'mt' },
  { id: 'mtnight', emojis: '🟢🪙🌙', answers: ['mt night', 'meme torrent', 'memetorrent', '$mt'], hint: 'Our colour + coin + night', pack: 'mt' },
  { id: 'infinitewallet', emojis: '♾️👛', answers: ['infinite wallet', 'infinitewallet'], hint: 'Never-ending purse', pack: 'mt' },
  { id: 'clubpool', emojis: '🎱💚', answers: ['clubpool', 'club pool', 'pocket'], hint: 'Table in the club', pack: 'mt' },
  { id: 'fruitninja', emojis: '🥷🍉', answers: ['fruit ninja', 'mt fruit', 'fruit'], hint: 'Blade + melon', pack: 'mt' },
  { id: 'chat', emojis: '💬🟢', answers: ['mt chat', 'chat'], hint: 'Talk on-chain-ish', pack: 'mt' },
];

export function normalizeGuess(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 $&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkAnswer(puzzle: EmojiPuzzle, guess: string) {
  const g = normalizeGuess(guess);
  return puzzle.answers.some((a) => normalizeGuess(a) === g);
}

export function publicPuzzle(p: EmojiPuzzle) {
  return { id: p.id, emojis: p.emojis, hint: p.hint, pack: p.pack };
}
