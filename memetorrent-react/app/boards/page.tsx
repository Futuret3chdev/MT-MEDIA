import ScoreBoards from '@/components/games/ScoreBoards';

export default async function BoardsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Boards</h1>
      <p className="opacity-70 text-sm mb-8 max-w-2xl">
        Choose a title and a time window. Find a player by name. Each game keeps its own standings.
      </p>
      <ScoreBoards initialGame={game || 'tap'} />
    </div>
  );
}
