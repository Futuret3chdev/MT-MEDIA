/*! MT Games SDK v1.0.0 — https://memetorrent.futuret3ch.com.au/sdk/mt-games.js
 * Licensed game clients (Android APK, future iOS/Win/Mac) + browser tools.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MTGames = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var ORIGIN = 'https://memetorrent.futuret3ch.com.au';

  function fail(err) {
    return { ok: false, error: String(err || 'Failed') };
  }

  function readJson(res) {
    return res.json().then(function (d) {
      if (!d || typeof d !== 'object') return fail('Bad response');
      if (d.status && d.status.error_code && !d.data) return fail(d.status.error_message || 'API error');
      if (d.data && d.status && d.status.error_code === 0) {
        var x = d.data;
        x.ok = true;
        return x;
      }
      if (d.ok === undefined) d.ok = !!res.ok;
      if (!res.ok && !d.error) d.error = res.statusText || 'HTTP ' + res.status;
      return d;
    }).catch(function () {
      return fail('Bad JSON');
    });
  }

  function partyCode() {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    var s = '';
    for (var i = 0; i < 4; i++) s += a.charAt(Math.floor(Math.random() * a.length));
    return s;
  }

  function create(opts) {
    opts = opts || {};
    var api = String(opts.origin || ORIGIN).replace(/\/$/, '');
    var gameId = String(opts.gameId || 'mt-games').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
    var license = '';
    try { license = localStorage.getItem('mt-games-license') || opts.license || ''; } catch (e) {
      license = opts.license || '';
    }

    function setLicense(key) {
      license = String(key || '');
      try { localStorage.setItem('mt-games-license', license); } catch (e) { /* */ }
    }

    function verify(key) {
      var k = key || license;
      return fetch(api + '/api/v1/games/license?key=' + encodeURIComponent(k), { credentials: 'include' })
        .then(readJson)
        .then(function (d) {
          if (d.ok && d.license_key) setLicense(d.license_key);
          return d;
        })
        .catch(function (e) { return fail(e.message); });
    }

    function me() {
      return fetch(api + '/api/portal/me', { credentials: 'include' })
        .then(readJson)
        .then(function (d) {
          if (d.ok && d.user && d.user.license_key) setLicense(d.user.license_key);
          return d.ok ? { ok: true, user: d.user, license_key: (d.user && d.user.license_key) || license } : fail(d.error || 'Guest');
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
          room: extra.room || extra.party || undefined,
        }),
      }).then(readJson).catch(function (e) { return fail(e.message); });
    }

    function scores(query) {
      query = query || {};
      var g = encodeURIComponent(query.gameId || gameId);
      return fetch(api + '/api/scores?game_id=' + g + '&limit=' + (query.limit || 25), { credentials: 'include' })
        .then(readJson)
        .catch(function (e) { return fail(e.message); });
    }

    function apkUrl() {
      return api + '/downloads/MTGames.apk';
    }

    return {
      version: VERSION,
      origin: api,
      gameId: gameId,
      license: function () { return license; },
      setLicense: setLicense,
      verify: verify,
      me: me,
      postScore: postScore,
      scores: scores,
      partyCode: partyCode,
      apkUrl: apkUrl,
      tools: {
        skin: api + '/software/games#skin',
        scores: api + '/software/games#scores',
        pads: api + '/software/games#pads',
        bracket: api + '/software/games#bracket',
        clock: api + '/software/games#clock',
        cover: api + '/software/games#cover',
      },
    };
  }

  return { version: VERSION, origin: ORIGIN, init: create, create: create };
});
