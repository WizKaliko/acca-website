/* ACCA shared script: mobile menu, MailerLite signup, vote countdown, Scorecard and Market flags. */

/* Flip to true when the Scorecard is approved for public launch.
   It reveals every element marked data-scorecard (nav link, homepage teaser). */
var SCORECARD_LIVE = false;
if (SCORECARD_LIVE) document.documentElement.classList.add('scorecard-live');

/* Flip to true when Who Controls the Market (/market/) is approved for public launch.
   It reveals every element marked data-market (nav and footer links). */
var MARKET_LIVE = false;
if (MARKET_LIVE) document.documentElement.classList.add('market-live');

(function () {
  // ---- mobile menu ----
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    });
  }

  // ---- countdown: <div data-countdown="2026-11-03"> with [data-days], [data-before], [data-today], [data-after] ----
  document.querySelectorAll('[data-countdown]').forEach(function (box) {
    var p = box.getAttribute('data-countdown').split('-').map(Number);
    var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var days = Math.round((new Date(p[0], p[1] - 1, p[2]) - today) / 86400000);
    var show = function (sel) { box.querySelectorAll('[data-before],[data-today],[data-after]').forEach(function (el) { el.hidden = !el.matches(sel); }); };
    if (days > 0) {
      box.querySelectorAll('[data-days]').forEach(function (el) { el.textContent = days; });
      box.querySelectorAll('[data-unit]').forEach(function (el) { el.textContent = days === 1 ? 'day' : 'days'; });
      show('[data-before]');
    } else if (days === 0) show('[data-today]');
    else show('[data-after]');
  });

  // ---- signup: any <form data-signup> posts through the hidden MailerLite embed ----
  // MailerLite's form requires email and ZIP. We fill its hidden fields, click its submit button,
  // then report success only when MailerLite shows its own success state.
  function mlParts() {
    var ml = document.querySelector('.ml-embedded');
    if (!ml) return null;
    var q = function (s) { return ml.querySelector(s); };
    return { ml: ml, email: q('input[name="fields[email]"], input[type="email"]'), first: q('input[name="fields[name]"]'),
             last: q('input[name="fields[last_name]"]'), zip: q('input[name="fields[z_i_p]"], input[name*="zip"]'),
             btn: q('button.primary, button[type="submit"], input[type="submit"]'), ok: q('.ml-form-successBody') };
  }
  // The embed sits in a hidden wrapper, so check the success panel's own display value.
  function visible(el) { return el && getComputedStyle(el).display !== 'none'; }
  document.querySelectorAll('form[data-signup]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var msg = form.querySelector('.form-msg');
      var field = function (n) { return form.querySelector('[name="' + n + '"]'); };
      var val = function (n) { var i = field(n); return i ? i.value.trim() : ''; };
      var email = val('email'), zip = val('zip');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Enter an email address like name@example.com.'; field('email').focus(); return; }
      if (!/^\d{5}(-?\d{4})?$/.test(zip)) { msg.textContent = 'Enter your 5-digit ZIP code so we can tell you about bills where you live.'; field('zip').focus(); return; }
      var m = mlParts();
      if (!m || !m.email || !m.btn) { msg.textContent = "The signup service didn't load. Check your connection and try again."; return; }
      // After a signup, MailerLite leaves its form in a "thanks" state and won't send again.
      // Put it back to its starting state so every signup is a fresh submission.
      var body = m.ml.querySelector('.ml-form-embedBody'), primary = m.ml.querySelector('button.primary'), loading = m.ml.querySelector('button.loading');
      if (body) body.style.display = ''; if (m.ok) m.ok.style.display = 'none';
      if (primary) { primary.style.display = ''; primary.disabled = false; } if (loading) loading.style.display = 'none';
      m.ml.querySelectorAll('.ml-error').forEach(function (e) { e.classList.remove('ml-error'); });
      m.email.value = email; if (m.zip) m.zip.value = zip;
      if (m.first) m.first.value = val('first'); if (m.last) m.last.value = val('last');
      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
      msg.textContent = 'Signing you up…';
      m.btn.click();
      var tries = 0, timer = setInterval(function () {
        tries++;
        var err = m.ml.querySelector('.ml-error');
        if (visible(m.ok)) {
          clearInterval(timer); btn.disabled = false; form.reset();
          msg.textContent = "You're signed up. Check your inbox for a confirmation email and click the link to finish.";
        } else if (err && tries > 2) {
          clearInterval(timer); btn.disabled = false;
          msg.textContent = 'MailerLite rejected that signup. Check your email and ZIP code and try again.';
        } else if (tries > 40) {
          clearInterval(timer); btn.disabled = false;
          msg.textContent = "We couldn't confirm your signup. Try again in a minute.";
        }
      }, 250);
    });
  });

  // ---- Scorecard state picker (teaser) ----
  var pick = document.getElementById('state-pick');
  if (pick) pick.addEventListener('change', function () { if (pick.value) location.href = '/scorecard/#' + pick.value; });
})();

/* ---- rotating home hero: auto-advances every 8s; pauses on hover or focus; Pause button stops it;
   no autoplay for people who ask for reduced motion. Inactive slides are hidden from screen readers. ---- */
(function () {
  var root = document.querySelector('.hero-visual');
  if (!root) return;
  var slides = [].slice.call(root.querySelectorAll('.slide'));
  var dots = [].slice.call(root.querySelectorAll('.slide-dot'));
  var pauseBtn = root.querySelector('.slide-pause');
  if (slides.length < 2) return;
  var i = 0, timer = null, stopped = false, hovering = false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (s, k) {
      var on = k === i;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      if ('inert' in s) s.inert = !on;
    });
    dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  }
  // Phones: no rotation (the layout shows only the goal).
  var small = window.matchMedia ? window.matchMedia('(max-width: 820px)') : { matches: false };
  function tick() { if (!stopped && !hovering && !small.matches) show(i + 1); }
  function start() { if (!timer && !reduce) timer = setInterval(tick, 8000); }
  function stop() { clearInterval(timer); timer = null; }
  dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); stop(); start(); }); });
  if (pauseBtn) {
    if (reduce) { stopped = true; pauseBtn.textContent = 'Play'; pauseBtn.setAttribute('aria-label', 'Play slides'); }
    pauseBtn.addEventListener('click', function () {
      stopped = !stopped;
      pauseBtn.textContent = stopped ? 'Play' : 'Pause';
      pauseBtn.setAttribute('aria-label', stopped ? 'Play slides' : 'Pause slides');
      if (stopped) stop(); else { reduce = false; start(); }
    });
  }
  root.addEventListener('mouseenter', function () { hovering = true; });
  root.addEventListener('mouseleave', function () { hovering = false; });
  root.addEventListener('focusin', function () { hovering = true; });
  root.addEventListener('focusout', function () { hovering = false; });
  if (small.addEventListener) small.addEventListener('change', function () { if (small.matches) show(0); });
  show(0);
  start();
})();

/* ---- founding pledges and volunteer sign-ups: post to the ACCA CRM ----
   Sent as text/plain JSON so the browser makes a simple request (no preflight).
   The CRM only lets americancannabisconsumer.com read its answers. */
(function () {
  var ENDPOINT = 'https://thndr-strm-hub.base44.app/api/apps/6ac14247389deaa864f0553d/functions/publicPledge';
  var WORKSPACE = 'american-cannabis-consumer-alliance';
  var MESSAGES = {
    first: 'Enter your first name.', last: 'Enter your last name.', email: 'Enter an email address like name@example.com.',
    zip: 'Enter your 5-digit ZIP code.', plan: 'Choose how you would like to pay.', roles: 'Choose at least one way to help.',
  };
  function post(body) {
    body.workspace = WORKSPACE;
    return fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), credentials: 'omit' })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.status = r.status; return j; }); });
  }
  function check(form, kind) {
    var v = function (n) { var i = form.querySelector('[name="' + n + '"]'); return i ? i.value.trim() : ''; };
    var errs = {};
    if (!v('first')) errs.first = 1;
    if (!v('last')) errs.last = 1;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) errs.email = 1;
    if (!/^\d{5}(-?\d{4})?$/.test(v('zip'))) errs.zip = 1;
    if (kind === 'volunteer' && !form.querySelector('[name="roles"]:checked')) errs.roles = 1;
    return errs;
  }
  function mark(form, errs, msg) {
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    var keys = Object.keys(errs);
    if (!keys.length) return false;
    keys.forEach(function (k) { var el = form.querySelector('[name="' + k + '"]'); if (el && el.type !== 'checkbox' && el.type !== 'radio') el.setAttribute('aria-invalid', 'true'); });
    msg.className = 'form-msg is-error';
    msg.textContent = keys.map(function (k) { return MESSAGES[k] || 'Check the ' + k + ' field.'; }).join(' ');
    var first = form.querySelector('[name="' + keys[0] + '"]'); if (first) first.focus();
    return true;
  }
  function wire(form, kind, done) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var msg = form.querySelector('.form-msg');
      if (mark(form, check(form, kind), msg)) return;
      var data = { kind: kind };
      new FormData(form).forEach(function (val, key) {
        if (key === 'roles') (data.roles = data.roles || []).push(val); else data[key] = typeof val === 'string' ? val.trim() : val;
      });
      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
      msg.className = 'form-msg'; msg.textContent = 'Saving…';
      post(data).then(function (r) {
        btn.disabled = false;
        if (r.ok) { done(form, data); return; }
        if (r.fields) { mark(form, r.fields, msg); return; }
        msg.className = 'form-msg is-error';
        msg.textContent = r.status === 429 ? 'Too many tries from this connection. Wait a few minutes and try again.' : "We couldn't save that just now. Please try again in a few minutes.";
      }).catch(function () {
        btn.disabled = false; msg.className = 'form-msg is-error';
        msg.textContent = "We couldn't reach our server. Check your connection and try again.";
      });
    });
  }
  function thanks(form, title, text) {
    var box = document.createElement('div');
    box.className = 'pledge-done'; box.setAttribute('role', 'status'); box.tabIndex = -1;
    var h = document.createElement('h3'); h.textContent = title;
    var p = document.createElement('p'); p.textContent = text;
    box.appendChild(h); box.appendChild(p);
    form.replaceWith(box); box.focus();
  }
  document.querySelectorAll('form[data-pledge]').forEach(function (f) {
    wire(f, 'pledge', function (form, d) {
      thanks(form, 'Thank you, ' + d.first + '. We’re holding your founding spot.',
        'We’ve recorded your pledge (' + (d.plan === 'monthly' ? '$100 a month for 10 months' : '$1,000 at once') + '). Nothing has been charged. When ACCA’s bank account is open, we’ll email ' + d.email + ' a secure payment link. Once you’ve paid, we’ll confirm your founding membership.');
    });
  });
  document.querySelectorAll('form[data-volunteer]').forEach(function (f) {
    wire(f, 'volunteer', function (form, d) {
      thanks(form, 'Thank you, ' + d.first + '.', 'We’ll be in touch at ' + d.email + ' soon about how you can help.');
    });
  });
  // Founding counter: shown only once there are at least 10 pledges.
  var counter = document.querySelector('[data-founding-count]');
  if (counter) post({ kind: 'count' }).then(function (r) {
    if (r.ok && typeof r.founding === 'number' && r.founding >= 10) {
      counter.textContent = r.founding + ' of 100 founding spots pledged.'; counter.hidden = false;
    }
  }).catch(function () {});
})();
