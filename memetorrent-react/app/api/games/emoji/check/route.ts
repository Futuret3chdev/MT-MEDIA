import { NextRequest } from 'next/server';
import { EMOJI_PUZZLES, checkAnswer } from '@/lib/emoji-puzzles';

export async function POST(request: NextRequest) {
  let body: { id?: string; guess?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const puzzle = EMOJI_PUZZLES.find((p) => p.id === body.id);
  if (!puzzle) return Response.json({ ok: false, error: 'Unknown card' }, { status: 400 });
  if (checkAnswer(puzzle, String(body.guess || ''))) {
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, hint: puzzle.hint });
}
