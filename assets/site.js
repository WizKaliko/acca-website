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
