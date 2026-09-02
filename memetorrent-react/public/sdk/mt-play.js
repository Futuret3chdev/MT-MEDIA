/*! MT Play SDK — memetorrent.futuret3ch.com.au/sdk/mt-play.js */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MTPlay = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var DEFAULT_ORIGIN = 'https://memetorrent.futuret3ch.com.au';

  function originOf(url) {
    try { return new URL(url, location.href).origin; } catch (e) { return DEFAULT_ORIGIN; }
  }

  function create(opts) {
    opts = opts || {};
    var api = (opts.origin || DEFAULT_ORIGIN).replace(/\/$/, '');
    var gameId = String(opts.gameId || 'untitled').slice(0, 40);
    var wallet = '';
    try { wallet = localStorage.getItem('mt-game-wallet') || ''; } catch (e) { /* */ }
    var listeners = {};

    function emit(name, data) {
      (listeners[name] || []).forEach(function (fn) {
        try { fn(data); } catch (e) { /* */ }
      });
    }

    function on(name, fn) {
      (listeners[name] || (listeners[name] = [])).push(fn);
      return function off() {
        listeners[name] = (listeners[name] || []).filter(function (x) { return x !== fn; });
      };
    }

    function setWallet(addr) {
      if (!addr || addr === wallet) return;
      wallet = String(addr);
      try { localStorage.setItem('mt-game-wallet', wallet); } catch (e) { /* */ }
      emit('wallet', wallet);
    }

    function onMsg(e) {
      var d = e && e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === 'mt-wallet-ok' && d.addr) setWallet(d.addr);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('message', onMsg);
      window.addEventListener('storage', function (e) {
        if (e.key === 'mt-game-wallet' && e.newValue) setWallet(e.newValue);
      });
    }

    function requestWallet(kind) {
      kind = kind || 'phantom';
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'mt-wallet-request', wallet: kind }, '*');
        }
      } catch (e) { /* */ }
      emit('wallet-request', kind);
    }

    function me() {
      return fetch(api + '/api/portal/me', { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var user = d && d.ok ? d.user : null;
          emit('user', user);
          return user;
        });
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
        }),
      }).then(function (r) { return r.json(); });
    }

    function scores(query) {
      query = query || {};
      var g = encodeURIComponent(query.gameId || gameId);
      var limit = query.limit || 25;
      return fetch(api + '/api/scores?game_id=' + g + '&limit=' + limit, { credentials: 'include' })
        .then(function (r) { return r.json(); });
    }

    function loginUrl(next) {
      var n = encodeURIComponent(next || (typeof location !== 'undefined' ? location.href : '/'));
      return api + '/login?next=' + n;
    }

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
    };
  }

  return {
    version: VERSION,
    origin: DEFAULT_ORIGIN,
    init: create,
    create: create,
  };
});
