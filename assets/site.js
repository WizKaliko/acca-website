/* ACCA shared script: mobile menu, MailerLite signup, vote countdown, Scorecard flag. */

/* Flip to true when the Scorecard is approved for public launch.
   It reveals every element marked data-scorecard (nav link, homepage teaser). */
var SCORECARD_LIVE = false;
if (SCORECARD_LIVE) document.documentElement.classList.add('scorecard-live');

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
  function submitToML(email, first, last) {
    var ml = document.querySelector('.ml-embedded');
    if (!ml) return false;
    var e = ml.querySelector('input[type="email"]'),
        f = ml.querySelector('input[name*="first"], input[placeholder*="First"]'),
        l = ml.querySelector('input[name*="last"], input[placeholder*="Last"]'),
        b = ml.querySelector('button[type="submit"], input[type="submit"]');
    if (!e || !b) return false;
    e.value = email; if (f) f.value = first || ''; if (l) l.value = last || '';
    b.click();
    return true;
  }
  document.querySelectorAll('form[data-signup]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var msg = form.querySelector('.form-msg');
      var val = function (n) { var i = form.querySelector('[name="' + n + '"]'); return i ? i.value.trim() : ''; };
      var email = val('email');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Enter an email address like name@example.com.'; form.querySelector('[name="email"]').focus(); return; }
      if (submitToML(email, val('first'), val('last'))) {
        msg.textContent = "You're on the list. We'll email you when something moves.";
        form.reset();
      } else {
        msg.textContent = "The signup service didn't load. Check your connection and try again.";
      }
    });
  });

  // ---- Scorecard state picker (teaser) ----
  var pick = document.getElementById('state-pick');
  if (pick) pick.addEventListener('change', function () { if (pick.value) location.href = '/scorecard/#' + pick.value; });
})();
