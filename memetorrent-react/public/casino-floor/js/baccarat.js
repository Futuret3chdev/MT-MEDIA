/** Punto Banco baccarat — 8-deck shoe, standard third-card rules. */

import { createDeck, shuffle } from './deck.js';

const DECKS = 8;

export const BET_TYPES = ['player', 'banker', 'tie'];
export const PAYOUTS = { player: 1, banker: 0.95, tie: 8 };

export function cardValue(card) {
  if (!card) return 0;
  if (card.rank >= 10) return 0;
  if (card.rank === 14) return 1;
  return card.rank;
}

export function handTotal(cards) {
  return cards.reduce((s, c) => s + cardValue(c), 0) % 10;
}

export function isNatural(cards) {
  return cards.length >= 2 && (handTotal(cards) === 8 || handTotal(cards) === 9);
}

export function createShoe() {
  let shoe = [];
  for (let i = 0; i < DECKS; i++) shoe = shoe.concat(createDeck());
  return shuffle(shoe);
}

export function draw(shoe) {
  if (shoe.length < 20) {
    const fresh = createShoe();
    return { shoe: fresh, card: fresh.pop() };
  }
  const card = shoe.pop();
  return { shoe, card };
}

function playerDrawsThird(total) {
  return total <= 5;
}

function bankerDrawsThird(bankerTotal, playerThird) {
  if (playerThird == null) return bankerTotal <= 5;
  const p3 = cardValue(playerThird);
  if (bankerTotal <= 2) return true;
  if (bankerTotal === 3) return p3 !== 8;
  if (bankerTotal === 4) return p3 >= 2 && p3 <= 7;
  if (bankerTotal === 5) return p3 >= 4 && p3 <= 7;
  if (bankerTotal === 6) return p3 === 6 || p3 === 7;
  return false;
}

export function dealRound(shoe) {
  let s = shoe;
  const player = [];
  const banker = [];
  const steps = [];

  const deal = (who) => {
    const pulled = draw(s);
    s = pulled.shoe;
    if (who === 'player') player.push(pulled.card);
    else banker.push(pulled.card);
    steps.push({ who, card: pulled.card, player: [...player], banker: [...banker] });
  };

  deal('player');
  deal('banker');
  deal('player');
  deal('banker');

  const pTotal = handTotal(player);
  const bTotal = handTotal(banker);
  let natural = isNatural(player) || isNatural(banker);

  let playerThird = null;
  if (!natural && playerDrawsThird(pTotal)) {
    deal('player');
    playerThird = player[2];
  }

  if (!natural && bankerDrawsThird(handTotal(banker), playerThird)) {
    deal('banker');
  }

  const finalPlayer = handTotal(player);
  const finalBanker = handTotal(banker);
  let winner = 'tie';
  if (finalPlayer > finalBanker) winner = 'player';
  else if (finalBanker > finalPlayer) winner = 'banker';

  return {
    shoe: s,
    player,
    banker,
    playerTotal: finalPlayer,
    bankerTotal: finalBanker,
    winner,
    natural,
    steps
  };
}

export function resolveBets(bets, winner) {
  let payout = 0;
  const results = [];

  for (const type of BET_TYPES) {
    const amount = bets[type] || 0;
    if (amount <= 0) continue;
    if (winner === 'tie') {
      if (type === 'tie') {
        const win = amount * PAYOUTS.tie;
        payout += amount + win;
        results.push({ type, amount, win, push: false });
      } else {
        payout += amount;
        results.push({ type, amount, win: 0, push: true });
      }
    } else if (type === winner) {
      const win = Math.floor(amount * PAYOUTS[type]);
      payout += amount + win;
      results.push({ type, amount, win, push: false });
    } else {
      results.push({ type, amount, win: 0, push: false });
    }
  }

  return { payout, results, net: payout - Object.values(bets).reduce((a, b) => a + b, 0) };
}

export function describeTotal(cards) {
  const t = handTotal(cards);
  if (isNatural(cards)) return `Natural ${t}`;
  return String(t);
}