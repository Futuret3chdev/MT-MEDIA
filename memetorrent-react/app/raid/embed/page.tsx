import GameEmbed from '@/components/games/GameEmbed';
import RaidRug from '@/components/games/RaidRug';
export default function Page() {
  return <GameEmbed><div className='h-full overflow-auto p-4'><RaidRug /></div></GameEmbed>;
}
