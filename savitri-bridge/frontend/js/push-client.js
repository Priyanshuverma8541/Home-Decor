/*!
 * PushBridgeClient - generic browser-side Web Push integration for SavitriBridge.
 * Plain JavaScript, no dependencies, no secrets. Copy this single file to any website.
 *
 *   PushBridgeClient.init({ apiBase: 'https://YOUR-API/api/v1/public', projectId: 'pk_xxxxxxxxxxxxxxxxxxxx', serviceWorkerPath: '/sw.js' });
 *   button.onclick = () => PushBridgeClient.enableNotifications();   // must come from a user click
 */
(function (global) {
  'use strict';
  var state = { apiBase: '', projectId: '', serviceWorkerPath: '/sw.js', scope: undefined, prefix: 'pbc' };

  function init(opts) {
    opts = opts || {};
    state.apiBase = String(opts.apiBase || '').replace(/\/+$/, '');
    state.projectId = opts.projectId || '';
    state.serviceWorkerPath = opts.serviceWorkerPath || '/sw.js';
    state.scope = opts.scope;
    if (opts.storagePrefix) state.prefix = opts.storagePrefix;
    if (!state.apiBase || !state.projectId) throw new Error('PushBridgeClient.init needs apiBase and projectId');
    return state;
  }

  // ---- local identity (subscriberId + proof token issued by the platform) ----
  function idKey() { return state.prefix + ':' + state.projectId; }
  function loadIdentity() { try { return JSON.parse(localStorage.getItem(idKey()) || 'null'); } catch (e) { return null; } }
  function saveIdentity(v) { try { localStorage.setItem(idKey(), JSON.stringify(v)); } catch (e) { /* storage may be blocked */ } }
  function clearIdentity() { try { localStorage.removeItem(idKey()); } catch (e) { /* ignore */ } }

  function api(path, body, method) {
    return fetch(state.apiBase + path, {
      method: method || 'POST', mode: 'cors', credentials: 'omit',
      headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (json) {
        if (!res.ok || !json || !json.success) {
          var err = new Error((json && json.error && json.error.message) || 'Request failed (' + res.status + ')');
          err.code = json && json.error && json.error.code; err.status = res.status; throw err;
        }
        return json.data;
      });
    });
  }

  function isPushSupported() { return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in global && 'Notification' in global; }
  function getNotificationPermission() { return 'Notification' in global ? Notification.permission : 'unsupported'; }
  function requestNotificationPermission() { return Notification.requestPermission(); } // call ONLY from a user gesture

  function registerServiceWorker() {
    var opts = state.scope ? { scope: state.scope } : undefined;
    return navigator.serviceWorker.register(state.serviceWorkerPath, opts).then(function () { return navigator.serviceWorker.ready; });
  }
  function getRegistration() { return navigator.serviceWorker.getRegistration(state.scope || undefined); }
  function getExistingSubscription() {
    if (!isPushSupported()) return Promise.resolve(null);
    return getRegistration().then(function (reg) { return reg ? reg.pushManager.getSubscription() : null; });
  }

  function urlBase64ToUint8Array(b64) {
    var pad = '='.repeat((4 - (b64.length % 4)) % 4);
    var raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function sameKey(sub, keyBytes) {
    var k = sub.options && sub.options.applicationServerKey; if (!k) return true;
    var a = new Uint8Array(k); if (a.length !== keyBytes.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== keyBytes[i]) return false;
    return true;
  }

  function fetchProjectConfig() { return api('/config/' + encodeURIComponent(state.projectId), null, 'GET'); }

  /** Creates (or reuses) the browser PushSubscription. Requires notification permission to be granted or promptable. */
  function subscribeToPush() {
    var keyBytes;
    return fetchProjectConfig().then(function (cfg) {
      keyBytes = urlBase64ToUint8Array(cfg.vapidPublicKey);
      return registerServiceWorker();
    }).then(function (reg) {
      return reg.pushManager.getSubscription().then(function (existing) {
        if (existing && sameKey(existing, keyBytes)) return existing;
        var drop = existing ? existing.unsubscribe() : Promise.resolve(); // VAPID key changed -> must resubscribe
        return drop.then(function () { return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes }); });
      });
    });
  }

  function collectDeviceMetadata() {
    var nav = navigator; var s = global.screen || {};
    return {
      language: nav.language, languages: (nav.languages ? Array.prototype.slice.call(nav.languages, 0, 5) : []),
      timezone: (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return undefined; } })(),
      screenWidth: s.width, screenHeight: s.height, pixelRatio: global.devicePixelRatio, platform: (nav.userAgentData && nav.userAgentData.platform) || nav.platform,
      notificationPermission: getNotificationPermission()
    };
  }

  function registerSubscriptionWithPlatform(subscription) {
    var id = loadIdentity() || {};
    var json = subscription.toJSON();
    return api('/subscribe', {
      publicProjectId: state.projectId,
      subscription: { endpoint: json.endpoint, expirationTime: json.expirationTime || null, keys: json.keys },
      device: collectDeviceMetadata(), subscriberId: id.subscriberId, token: id.token
    }).then(function (res) { saveIdentity({ subscriberId: res.subscriberId, token: res.token }); return res; });
  }

  /** One call for a click handler: permission -> subscription -> register with platform. */
  function enableNotifications() {
    if (!isPushSupported()) return Promise.reject(new Error('Web Push is not supported in this browser'));
    return requestNotificationPermission().then(function (perm) {
      if (perm !== 'granted') throw new Error(perm === 'denied' ? 'Notifications are blocked for this site in the browser settings' : 'Notification permission was dismissed');
      return subscribeToPush();
    }).then(registerSubscriptionWithPlatform);
  }

  function unsubscribeFromPush() {
    var id = loadIdentity();
    return getExistingSubscription().then(function (sub) {
      var tell = id && sub ? api('/unsubscribe', { subscriberId: id.subscriberId, token: id.token, endpoint: sub.endpoint }).catch(function () { /* still unsubscribe locally */ }) : Promise.resolve();
      return tell.then(function () { return sub ? sub.unsubscribe() : false; });
    });
  }

  function getSubscriptionStatus() {
    var out = { supported: isPushSupported(), permission: getNotificationPermission(), serviceWorker: false, browserSubscribed: false, subscriberId: null, platform: null, locationPermission: 'unknown' };
    var id = loadIdentity(); if (id) out.subscriberId = id.subscriberId;
    if (!out.supported) return Promise.resolve(out);
    var perms = navigator.permissions && navigator.permissions.query ? navigator.permissions.query({ name: 'geolocation' }).then(function (p) { out.locationPermission = p.state; }).catch(function () {}) : Promise.resolve();
    return perms.then(getRegistration).then(function (reg) {
      out.serviceWorker = !!reg;
      return reg ? reg.pushManager.getSubscription() : null;
    }).then(function (sub) {
      out.browserSubscribed = !!sub;
      if (!id) return out;
      return api('/status', { subscriberId: id.subscriberId, token: id.token, endpoint: sub ? sub.endpoint : undefined })
        .then(function (p) { out.platform = p; return out; })
        .catch(function (e) { out.platformError = e.message; if (e.status === 403) clearIdentity(); return out; });
    });
  }

  // ---- optional location: ONLY from an explicit user action, never on page load ----
  function requestLocationPermission() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) return reject(new Error('Geolocation is not available in this browser'));
      navigator.geolocation.getCurrentPosition(
        function (p) { resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy, timestamp: p.timestamp }); },
        function (e) { var err = new Error(e.code === 1 ? 'Location permission denied' : 'Could not get location'); err.denied = e.code === 1; reject(err); },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
    });
  }
  function updateLocation() {
    var id = loadIdentity(); if (!id) return Promise.reject(new Error('Enable notifications first so the platform knows this device'));
    return requestLocationPermission().then(function (pos) {
      return api('/location', { subscriberId: id.subscriberId, token: id.token, latitude: pos.latitude, longitude: pos.longitude, accuracy: pos.accuracy, timestamp: pos.timestamp });
    }, function (err) {
      if (err.denied) api('/location-permission', { subscriberId: id.subscriberId, token: id.token, permission: 'denied' }).catch(function () {});
      throw err; // push keeps working without location
    });
  }

  global.PushBridgeClient = {
    init: init, isPushSupported: isPushSupported, registerServiceWorker: registerServiceWorker, getNotificationPermission: getNotificationPermission,
    requestNotificationPermission: requestNotificationPermission, getExistingSubscription: getExistingSubscription, subscribeToPush: subscribeToPush,
    registerSubscriptionWithPlatform: registerSubscriptionWithPlatform, unsubscribeFromPush: unsubscribeFromPush, getSubscriptionStatus: getSubscriptionStatus,
    collectDeviceMetadata: collectDeviceMetadata, requestLocationPermission: requestLocationPermission, updateLocation: updateLocation,
    enableNotifications: enableNotifications, getIdentity: loadIdentity
  };
})(typeof window !== 'undefined' ? window : this);
