import GameEmbed from '@/components/games/GameEmbed';
import EmojiRoyale from '@/components/games/EmojiRoyale';
export default function Page() {
  return <GameEmbed><div className='h-full overflow-auto p-4'><EmojiRoyale /></div></GameEmbed>;
}
