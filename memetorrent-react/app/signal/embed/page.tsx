import GameEmbed from '@/components/games/GameEmbed';
import SignalDesk from '@/components/games/SignalDesk';
export default function Page() {
  return <GameEmbed><div className='h-full overflow-auto p-4'><SignalDesk /></div></GameEmbed>;
}
