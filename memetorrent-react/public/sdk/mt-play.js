/*! MT Play SDK v1.1.0 — https://memetorrent.futuret3ch.com.au/sdk/mt-play.js */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MTPlay = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.1.0';
  var DEFAULT_ORIGIN = 'https://memetorrent.futuret3ch.com.au';

  function inFrame() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  function fail(err) {
    return { ok: false, error: String(err || 'Failed') };
  }

  function readJson(res) {
    return res.json().then(function (d) {
      if (!d || typeof d !== 'object') return fail('Bad response');
      if (d.ok === undefined) d.ok = !!res.ok;
      if (!res.ok && !d.error) d.error = res.statusText || 'HTTP ' + res.status;
      return d;
    }).catch(function () {
      return fail(res.ok ? 'Bad JSON' : 'HTTP ' + res.status);
    });
  }

  function create(opts) {
    opts = opts || {};
    var api = String(opts.origin || DEFAULT_ORIGIN).replace(/\/$/, '');
    var gameId = String(opts.gameId || 'untitled').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'untitled';
    var wallet = '';
    try { wallet = localStorage.getItem('mt-game-wallet') || ''; } catch (e) { /* */ }
    var listeners = {};
    var paused = false;

    function emit(name, data) {
      (listeners[name] || []).forEach(function (fn) {
        try { fn(data); } catch (e) { /* */ }
      });
    }

    function on(name, fn) {
      if (typeof fn !== 'function') return function () {};
      (listeners[name] || (listeners[name] = [])).push(fn);
      return function off() {
        listeners[name] = (listeners[name] || []).filter(function (x) { return x !== fn; });
      };
    }

    function setWallet(addr) {
      if (!addr) return;
      addr = String(addr);
      if (addr === wallet) return;
      wallet = addr;
      try { localStorage.setItem('mt-game-wallet', wallet); } catch (e) { /* */ }
      emit('wallet', wallet);
    }

    function setPaused(next) {
      next = !!next;
      if (next === paused) return;
      paused = next;
      emit(paused ? 'pause' : 'resume', { paused: paused });
      emit('visibility', { visible: !paused });
    }

    function onMsg(e) {
      var d = e && e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === 'mt-wallet-ok' && d.addr) setWallet(d.addr);
      if (d.type === 'mt-play-pause') setPaused(true);
      if (d.type === 'mt-play-resume') setPaused(false);
    }

    function tellParent(payload) {
      try {
        if (window.parent && window.parent !== window) window.parent.postMessage(payload, '*');
      } catch (e) { /* */ }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('message', onMsg);
      window.addEventListener('storage', function (e) {
        if (e.key === 'mt-game-wallet' && e.newValue) setWallet(e.newValue);
      });
      document.addEventListener('visibilitychange', function () {
        setPaused(document.hidden);
      });
    }

    function requestWallet(kind) {
      kind = kind || 'phantom';
      tellParent({ type: 'mt-wallet-request', wallet: kind });
      emit('wallet-request', kind);
    }

    function me() {
      return fetch(api + '/api/portal/me', { credentials: 'include' })
        .then(readJson)
        .then(function (d) {
          var user = d && d.ok ? d.user : null;
          emit('user', user);
          return d.ok ? { ok: true, user: user } : fail(d.error || 'Guest');
        })
        .catch(function (e) { return fail(e.message); });
    }

    function postScore(score, extra) {
      extra = extra || {};
      return fetch(api + '/api/scores', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: extra.gameId || gameId,
          score: Number(score) || 0,
          room: extra.room || undefined,
          player_name: extra.playerName || extra.name || undefined,
        }),
      }).then(readJson).catch(function (e) { return fail(e.message); });
    }

    function scores(query) {
      query = query || {};
      var g = encodeURIComponent(query.gameId || gameId);
      var qs = 'game_id=' + g + '&limit=' + (query.limit || 25);
      if (query.period) qs += '&period=' + encodeURIComponent(query.period);
      if (query.room) qs += '&room=' + encodeURIComponent(query.room);
      return fetch(api + '/api/scores?' + qs, { credentials: 'include' })
        .then(readJson)
        .catch(function (e) { return fail(e.message); });
    }

    function loginUrl(next) {
      var n = encodeURIComponent(next || (typeof location !== 'undefined' ? location.href : '/'));
      return api + '/login?next=' + n;
    }

    function openLogin() {
      var url = loginUrl();
      if (inFrame()) tellParent({ type: 'mt-play-login', url: url });
      else location.href = url;
    }

    function exit() {
      tellParent({ type: 'mt-play-exit' });
      if (!inFrame()) location.href = api + '/catalog';
    }

    function openCatalog() { exit(); }

    function ping() {
      tellParent({ type: 'mt-play-hello', gameId: gameId, version: VERSION });
      return { ok: true, version: VERSION, framed: inFrame(), gameId: gameId };
    }

    ping();

    return {
      version: VERSION,
      origin: api,
      gameId: gameId,
      on: on,
      wallet: function () { return wallet; },
      setWallet: setWallet,
      requestWallet: requestWallet,
      me: me,
      postScore: postScore,
      scores: scores,
      loginUrl: loginUrl,
      openLogin: openLogin,
      inPlayShell: inFrame,
      isFramed: inFrame,
      paused: function () { return paused; },
      exit: exit,
      openCatalog: openCatalog,
      ping: ping,
    };
  }

  return {
    version: VERSION,
    origin: DEFAULT_ORIGIN,
    init: create,
    create: create,
  };
});
