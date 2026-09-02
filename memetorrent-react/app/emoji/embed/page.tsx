import GameEmbed from '@/components/games/GameEmbed';
import EmojiNight from '@/components/games/EmojiNight';
export default function Page() {
  return <GameEmbed><div className='h-full overflow-auto p-4'><EmojiNight /></div></GameEmbed>;
}
