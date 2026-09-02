import GameEmbed from '@/components/games/GameEmbed';
import StudioJam from '@/components/games/StudioJam';
export default function Page() {
  return <GameEmbed><div className='h-full overflow-auto p-4'><StudioJam /></div></GameEmbed>;
}
