/** Baccarat — Iconic21 / Asia Gaming live-dealer layout. */

import {
  BET_TYPES, createShoe, dealRound, resolveBets, describeTotal, handTotal
} from './baccarat.js';
import { cardLabel, cardColor } from './deck.js';
import { casinoSound, unlockAudio } from './sounds.js';
import { celebrateWin, winTier } from './celebration.js?v=53';
import { burstAt } from './game-fx.js?v=53';
import { formatFloorAmt, formatFloorChipLabel, floorSymbol } from './floor-format.js?v=53';
import { FLOOR_MODES } from './modes.js?v=53';

const SUIT_SYM = { h: '♥', d: '♦', c: '♣', s: '♠' };
const RESULT_RESET_MS = 2600;
const ROAD_MAX = 72;
const BEAD_ROWS = 6;

function renderCard(card) {
  const color = cardColor(card.suit);
  const label = cardLabel(card.rank);
  const sym = SUIT_SYM[card.suit];
  return `<div class="bc-card bc-card-${color}">
    <span class="bc-card-corner tl"><span>${label}</span><span>${sym}</span></span>
    <span class="bc-card-face">${sym}</span>
    <span class="bc-card-corner br"><span>${label}</span><span>${sym}</span></span>
  </div>`;
}

function buildBigRoad(road) {
  const cols = [];
  let col = [];
  let last = null;
  for (const w of road) {
    if (w === 'tie') continue;
    if (last === null || w === last) col.push(w);
    else { cols.push(col); col = [w]; }
    last = w;
  }
  if (col.length) cols.push(col);
  return cols.slice(-20);
}

function buildDerivedMarks(bigRoad, offset) {
  const marks = [];
  for (let c = offset; c < bigRoad.length; c++) {
    for (let r = 1; r < bigRoad[c].length; r++) {
      const stable = (bigRoad[c - 1]?.length || 0) === (bigRoad[c - offset]?.length || 0);
      marks.push(stable ? 'banker' : 'player');
    }
    if (bigRoad[c].length === 1 && c >= offset) {
      const left = bigRoad[c - offset]?.length || 0;
      const up = bigRoad[c - 1]?.length || 0;
      marks.push(left === up ? 'banker' : 'player');
    }
  }
  return marks.slice(-60);
}

export class BaccaratUI {
  constructor({ getBalance, onBalanceChange, mode = FLOOR_MODES['baccarat-free'] }) {
    this.mode = mode;
    this.chips = mode.chipValues;
    this.minBet = mode.minBet;
    this.maxBet = mode.maxBet;
    this.sym = floorSymbol(mode);
    this.getBalance = getBalance;
    this.onBalanceChange = onBalanceChange;
    this.shoe = createShoe();
    this.chip = this.chips[1] ?? this.chips[0];
    this.bets = { player: 0, banker: 0, tie: 0 };
    this.phase = 'bet';
    this.road = [];
    this._resetTimer = null;
    this.cacheEls();
    this.updateLimitsLabel();
    this.buildChips();
    this.bind();
    this.renderBalance();
    this.renderBets();
    this.resetScoreboard();
    this.renderAllRoads();
    this.setMessage('Place your bets');
  }

  cacheEls() {
    this.els = {
      balance: document.getElementById('bc-balance'),
      limits: document.getElementById('bc-limits'),
      player: document.getElementById('bc-player-cards'),
      banker: document.getElementById('bc-banker-cards'),
      pVal: document.getElementById('bc-player-val'),
      bVal: document.getElementById('bc-banker-val'),
      scoreP: document.getElementById('bc-score-player'),
      scoreB: document.getElementById('bc-score-banker'),
      scoreResult: document.getElementById('bc-score-result'),
      scoreboard: document.getElementById('bc-scoreboard'),
      pctP: document.getElementById('bc-pct-player'),
      pctB: document.getElementById('bc-pct-banker'),
      pctT: document.getElementById('bc-pct-tie'),
      statB: document.getElementById('bc-stat-b'),
      statP: document.getElementById('bc-stat-p'),
      statT: document.getElementById('bc-stat-t'),
      road: document.getElementById('bc-road'),
      bigRoad: document.getElementById('bc-big-road'),
      eyeRoad: document.getElementById('bc-eye-road'),
      smallRoad: document.getElementById('bc-small-road'),
      cockRoad: document.getElementById('bc-cock-road'),
      totalBet: document.getElementById('bc-total-bet'),
      playerCount: document.getElementById('bc-player-count'),
      bankerCount: document.getElementById('bc-banker-count'),
      msg: document.getElementById('bc-message'),
      chips: document.getElementById('bc-chip-tray'),
      deal: document.getElementById('btn-bc-deal'),
      next: document.getElementById('btn-bc-next'),
      clear: document.getElementById('btn-bc-clear'),
      table: document.getElementById('bc-table'),
      wrap: document.getElementById('bc-table-wrap'),
      shoe: document.getElementById('bc-shoe'),
      spots: {
        player: document.getElementById('bc-bet-player'),
        banker: document.getElementById('bc-bet-banker'),
        tie: document.getElementById('bc-bet-tie')
      }
    };
  }

  updateLimitsLabel() {
    if (!this.els.limits) return;
    const sym = this.sym;
    const min = this.mode.currency === 'mt' ? this.minBet : 2;
    const max = this.maxBet;
    const fmt = (n) => this.mode.currency === 'mt' ? `${n} ${sym}` : n.toLocaleString();
    this.els.limits.textContent = `${fmt(min)} — ${fmt(max)}`;
  }

  get totalBet() {
    return this.bets.player + this.bets.banker + this.bets.tie;
  }

  buildChips() {
    if (!this.els.chips) return;
    this.els.chips.innerHTML = this.chips.map((v) => `
      <button type="button" class="bc-chip${v === this.chip ? ' on' : ''}" data-chip="${v}">
        ${formatFloorChipLabel(this.mode, v)}
      </button>
    `).join('');
    this.els.chips.querySelectorAll('[data-chip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.chip = Number(btn.dataset.chip);
        this.els.chips.querySelectorAll('.bc-chip').forEach((b) => b.classList.toggle('on', b === btn));
        casinoSound.chip();
      });
    });
  }

  bind() {
    this.els.deal?.addEventListener('click', () => this.dealHand());
    this.els.clear?.addEventListener('click', () => this.clearBets());
    this.els.next?.addEventListener('click', () => this.resetForNewHand());
    BET_TYPES.forEach((type) => {
      this.els.spots[type]?.addEventListener('click', () => this.addBet(type));
    });
  }

  renderBalance() {
    if (this.els.balance) {
      const bal = this.getBalance();
      this.els.balance.textContent = this.mode.currency === 'mt'
        ? bal.toFixed(bal % 1 ? 2 : 0)
        : bal.toLocaleString();
    }
  }

  renderBets() {
    BET_TYPES.forEach((type) => {
      const spot = this.els.spots[type];
      const amt = this.bets[type];
      const label = spot?.querySelector('.bc-spot-amt');
      if (label) {
        if (amt > 0) {
          const short = this.mode.currency === 'mt'
            ? amt.toFixed(amt < 1 ? 2 : 0)
            : (amt >= 1000 ? `${(amt / 1000).toFixed(amt % 1000 === 0 ? 0 : 1)}k` : String(amt));
          label.textContent = short;
        } else {
          label.textContent = '—';
        }
      }
      spot?.classList.toggle('has-bet', amt > 0);
    });
    if (this.els.playerCount) {
      this.els.playerCount.textContent = this.bets.player > 0 ? '1' : '0';
    }
    if (this.els.bankerCount) {
      this.els.bankerCount.textContent = this.bets.banker > 0 ? '1' : '0';
    }
    if (this.els.totalBet) {
      this.els.totalBet.textContent = this.totalBet > 0
        ? `Total bet ${formatFloorAmt(this.mode, this.totalBet)}`
        : 'Total bet —';
    }
  }

  setMessage(msg, type = '') {
    if (this.els.msg) {
      this.els.msg.textContent = msg;
      this.els.msg.className = `bc-message${type ? ` bc-msg-${type}` : ''}`;
    }
  }

  setPhase(phase) {
    this.phase = phase;
    this.els.table?.setAttribute('data-phase', phase);
    const betting = phase === 'bet';
    const showing = phase === 'result';
    this.els.deal.hidden = !betting;
    this.els.deal.disabled = !betting || this.totalBet < this.minBet;
    this.els.next.hidden = !showing;
    this.els.clear.disabled = !betting || this.totalBet === 0;
    BET_TYPES.forEach((type) => {
      this.els.spots[type]?.classList.toggle('bc-spot-locked', !betting);
    });
  }

  resetScoreboard() {
    if (this.els.scoreP) this.els.scoreP.textContent = '—';
    if (this.els.scoreB) this.els.scoreB.textContent = '—';
    if (this.els.scoreResult) {
      this.els.scoreResult.hidden = true;
      this.els.scoreResult.textContent = '';
      this.els.scoreResult.className = 'bc-stage-result';
    }
    this.els.scoreboard?.classList.remove('bc-score-show-result');
  }

  updateLiveScore(player, banker) {
    if (this.els.scoreP) {
      this.els.scoreP.textContent = player.length ? String(handTotal(player)) : '—';
    }
    if (this.els.scoreB) {
      this.els.scoreB.textContent = banker.length ? String(handTotal(banker)) : '—';
    }
  }

  showFinalScore(round) {
    if (this.els.scoreP) this.els.scoreP.textContent = String(round.playerTotal);
    if (this.els.scoreB) this.els.scoreB.textContent = String(round.bankerTotal);
    const res = this.els.scoreResult;
    if (!res) return;
    const labels = { player: 'PLAYER WINS', banker: 'BANKER WINS', tie: 'TIE' };
    res.textContent = round.natural
      ? `NATURAL ${labels[round.winner]}`
      : labels[round.winner];
    res.className = `bc-stage-result bc-result-${round.winner}`;
    res.hidden = false;
    this.els.scoreboard?.classList.add('bc-score-show-result');
  }

  pushRoad(winner) {
    this.road.push(winner);
    if (this.road.length > ROAD_MAX) this.road.shift();
    this.renderAllRoads();
  }

  renderRoadStats() {
    const b = this.road.filter((w) => w === 'banker').length;
    const p = this.road.filter((w) => w === 'player').length;
    const t = this.road.filter((w) => w === 'tie').length;
    const total = b + p + t || 1;
    if (this.els.statB) this.els.statB.textContent = String(b);
    if (this.els.statP) this.els.statP.textContent = String(p);
    if (this.els.statT) this.els.statT.textContent = String(t);
    if (this.els.pctP) this.els.pctP.textContent = `${Math.round((p / total) * 100)}%`;
    if (this.els.pctB) this.els.pctB.textContent = `${Math.round((b / total) * 100)}%`;
    if (this.els.pctT) this.els.pctT.textContent = `${Math.round((t / total) * 100)}%`;
  }

  renderBeadRoad() {
    if (!this.els.road) return;
    const letters = { player: 'P', banker: 'B', tie: 'T' };
    this.els.road.innerHTML = this.road.map((w) => `
      <span class="bc-bead-cell bc-road-${w}">${letters[w]}</span>
    `).join('');
  }

  renderBigRoad() {
    if (!this.els.bigRoad) return;
    const cols = buildBigRoad(this.road);
    this.els.bigRoad.innerHTML = cols.map((col) => `
      <div class="bc-big-col">${Array.from({ length: BEAD_ROWS }, (_, r) => {
        const w = col[r];
        return w
          ? `<span class="bc-big-cell bc-road-${w}"></span>`
          : '<span class="bc-big-cell bc-big-empty"></span>';
      }).join('')}</div>
    `).join('');
  }

  renderDerivedRoad(el, offset, cock = false) {
    if (!el) return;
    const marks = buildDerivedMarks(buildBigRoad(this.road), offset);
    el.innerHTML = marks.map((m) => `
      <span class="bc-derived-dot bc-derived-${m}"></span>
    `).join('');
    if (cock) el.classList.add('bc-road-cock-grid');
  }

  renderAllRoads() {
    this.renderBeadRoad();
    this.renderBigRoad();
    this.renderDerivedRoad(this.els.eyeRoad, 1);
    this.renderDerivedRoad(this.els.smallRoad, 2);
    this.renderDerivedRoad(this.els.cockRoad, 3, true);
    this.renderRoadStats();
  }

  scheduleReset() {
    if (this._resetTimer) clearTimeout(this._resetTimer);
    this._resetTimer = setTimeout(() => this.resetForNewHand(), RESULT_RESET_MS);
  }

  resetForNewHand() {
    if (this._resetTimer) {
      clearTimeout(this._resetTimer);
      this._resetTimer = null;
    }
    this.clearCards();
    this.resetScoreboard();
    this.els.table?.removeAttribute('data-winner');
    this.bets = { player: 0, banker: 0, tie: 0 };
    this.renderBets();
    this.setPhase('bet');
    this.setMessage('Place your bets');
  }

  addBet(type) {
    if (this.phase !== 'bet') return;
    if (this.getBalance() < this.chip) {
      this.setMessage('Not enough balance', 'lose');
      return;
    }
    if (this.totalBet + this.chip > this.maxBet) {
      this.setMessage(`Max total bet ${formatFloorAmt(this.mode, this.maxBet)}`, 'lose');
      return;
    }
    this.bets[type] += this.chip;
    this.onBalanceChange(-this.chip);
    this.renderBalance();
    this.renderBets();
    casinoSound.chip();
    this.setPhase('bet');
  }

  clearBets() {
    if (this.phase !== 'bet' || this.totalBet === 0) return;
    this.onBalanceChange(this.totalBet);
    this.bets = { player: 0, banker: 0, tie: 0 };
    this.renderBalance();
    this.renderBets();
    this.setMessage('Bets cleared');
  }

  pulseShoe() {
    this.els.shoe?.classList.add('bc-shoe-deal');
    setTimeout(() => this.els.shoe?.classList.remove('bc-shoe-deal'), 280);
  }

  clearCards() {
    if (this.els.player) this.els.player.innerHTML = '';
    if (this.els.banker) this.els.banker.innerHTML = '';
    if (this.els.pVal) this.els.pVal.textContent = '';
    if (this.els.bVal) this.els.bVal.textContent = '';
  }

  async dealCard(who, card, index) {
    this.pulseShoe();
    const el = who === 'player' ? this.els.player : this.els.banker;
    const wrap = document.createElement('div');
    wrap.className = 'bc-card-slot';
    wrap.style.setProperty('--deal-i', index);
    wrap.innerHTML = renderCard(card);
    el?.appendChild(wrap);
    casinoSound.deal();
    await this.wait(240);
  }

  updateTotals(player, banker) {
    if (this.els.pVal) {
      this.els.pVal.textContent = player.length ? describeTotal(player) : '';
    }
    if (this.els.bVal) {
      this.els.bVal.textContent = banker.length ? describeTotal(banker) : '';
    }
    this.updateLiveScore(player, banker);
  }

  async dealHand() {
    if (this.phase !== 'bet' || this.totalBet < this.minBet) return;
    unlockAudio();
    const cost = this.totalBet;
    const betsSnapshot = { ...this.bets };

    this.setPhase('dealing');
    this.setMessage('No more bets — dealing…');
    this.clearCards();
    this.resetScoreboard();
    this.els.table?.removeAttribute('data-winner');

    const round = dealRound(this.shoe);
    this.shoe = round.shoe;

    let pCount = 0;
    let bCount = 0;
    for (const step of round.steps) {
      const idx = step.who === 'player' ? pCount++ : bCount++;
      await this.dealCard(step.who, step.card, idx);
      this.updateTotals(step.player, step.banker);
    }

    this.els.table?.setAttribute('data-winner', round.winner);
    this.showFinalScore(round);
    this.pushRoad(round.winner);

    const { payout, net } = resolveBets(betsSnapshot, round.winner);
    const winAmt = Math.max(0, payout - cost);

    if (winAmt > 0) {
      this.onBalanceChange(payout);
      casinoSound.win();
      const tier = winTier(winAmt, cost);
      if (tier === 'big' || tier === 'jackpot') {
        celebrateWin({
          amount: winAmt,
          staked: cost,
          tier,
          symbol: this.sym,
          label: round.winner === 'tie' ? 'TIE WINS' : `${round.winner.toUpperCase()} WINS`
        });
      } else {
        burstAt(this.els.wrap, 'coins', 10);
      }
      this.setMessage(`Won ${formatFloorAmt(this.mode, winAmt)}`, 'win');
    } else if (net < 0) {
      casinoSound.lose();
      this.setMessage('No win this hand', 'lose');
    } else {
      this.setMessage('Push — stake returned', 'win');
    }

    this.renderBalance();
    this.setPhase('result');
    this.scheduleReset();
  }

  wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  destroy() {
    if (this._resetTimer) clearTimeout(this._resetTimer);
    this.els.table?.removeAttribute('data-phase');
    this.els.table?.removeAttribute('data-winner');
  }
}