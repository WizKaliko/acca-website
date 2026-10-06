/* Who Controls the Market — renders the data-driven parts of /market/ from window.MARKET (market/data.js). */
(function () {
  var D = window.MARKET;
  if (!D) return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var money = function (x) {
    if (!x) return '—';
    if (x >= 1e6) return '$' + (x / 1e6).toFixed(x >= 1e7 ? 1 : 2).replace(/\.0+$/, '') + 'M';
    if (x >= 1e3) return '$' + Math.round(x / 1e3).toLocaleString('en-US') + 'K';
    return '$' + Math.round(x).toLocaleString('en-US');
  };

  // ---- stores by state ----
  var stKeys = Object.keys(D.states), cur = stKeys[0];
  function drawState() {
    var s = D.states[cur];
    $('st-fig').textContent = s.headline;
    $('st-lede').textContent = s.lede;
    $('st-ctx').textContent = s.context;
    $('st-src').innerHTML = 'Source: ' + (s.url ? '<a href="' + esc(s.url) + '">' + esc(s.source) + '</a>' : esc(s.source));
    var max = Math.max.apply(null, s.rows.map(function (r) { return r[2]; }));
    var html = '<div class="hd"><span>' + esc(s.colA) + '</span><span>' + esc(s.colB) + '</span></div>';
    s.rows.forEach(function (r) {
      var val = r[4] || (s.total ? (Math.round(r[2] / s.total * 1000) / 10) + '%' : r[2]);
      var w = s.total ? Math.round(r[2] / max * 100) : r[2];
      var label = esc(r[0]) + ': ' + (s.total ? r[2] + ' of ' + s.total + ' stores' : val);
      html += '<div class="bar' + (r[3] ? ' other' : '') + '" role="img" aria-label="' + label + '"><span class="lab">' + esc(r[0]) + '<small>' + esc(r[1]) + '</small></span>' +
        '<span class="track"><span class="fill" style="display:block;width:' + w + '%"></span></span><span class="val">' + esc(val) + '</span></div>';
    });
    $('st-bars').innerHTML = html;
    Array.prototype.forEach.call($('state-tabs').children, function (b) { b.setAttribute('aria-selected', b.dataset.k === cur ? 'true' : 'false'); });
  }
  stKeys.forEach(function (k) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.k = k; b.textContent = D.states[k].name;
    b.addEventListener('click', function () { cur = k; drawState(); });
    $('state-tabs').appendChild(b);
  });
  drawState();

  // ---- brands ----
  var bmax = D.brands[0][2];
  $('brand-bars').innerHTML = '<div class="hd"><span>Brand · owner</span><span>Stores carrying it</span></div>' + D.brands.map(function (b) {
    return '<div class="bar blue" role="img" aria-label="' + esc(b[0]) + ', ' + esc(b[1]) + ': ' + b[2] + ' stores"><span class="lab">' + esc(b[0]) + '<small>' + esc(b[1]) + '</small></span>' +
      '<span class="track"><span class="fill" style="display:block;width:' + Math.round(b[2] / bmax * 100) + '%"></span></span><span class="val">' + b[2].toLocaleString('en-US') + '</span></div>';
  }).join('');
  $('families').innerHTML = D.families.map(function (f) {
    return '<div class="fam"><h3>' + esc(f.owner) + ' <small>Stores: ' + esc(f.stores) + '</small></h3><div class="chips">' + f.brands.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div></div>';
  }).join('');

  // ---- money ----
  var list = function (rows) { return rows.map(function (d) { return '<li><span>' + esc(d.name) + '</span><b>' + money(d.amt) + '</b></li>'; }).join(''); };
  $('afaa').innerHTML = list(D.afaa.map(function (d) { return d.name === 'AYR Wellness' ? { name: 'Arboretum Bidco (AYR’s buyer)', amt: d.amt } : d; }).concat([{ name: 'American Rights and Reform PAC (MSO-funded)', amt: 1500000 }]));
  $('arr').innerHTML = list(D.arr.filter(function (d) { return d.name.indexOf('Chicago Atlantic') < 0; }));
  $('giving').innerHTML = D.giving.map(function (g) {
    return '<tr><th scope="row">' + esc(g.co) + '</th><td class="num">' + money(g.fedCo) + '</td><td class="num">' + money(g.fedEx) + '</td><td class="num">' + money(g.s527) +
      '</td><td class="num">' + money(g.state) + '</td><td class="note">' + esc(g.big) + '</td></tr>';
  }).join('');

  // ---- groups matrix ----
  $('mx-h').innerHTML = '<tr><th scope="col" style="text-align:left">Company</th>' + D.cols.map(function (c) { return '<th scope="col">' + esc(c.name) + '<small>' + esc(c.when) + '</small></th>'; }).join('') + '</tr>';
  $('mx-b').innerHTML = D.matrix.map(function (m) {
    return '<tr><th scope="row">' + esc(m.co) + '</th>' + m.cells.map(function (v) {
      var cls = !v ? '' : v.charAt(0) === '$' ? 'cash' : /chair|board/i.test(v) ? 'lead' : 'mem';
      return '<td class="' + cls + '">' + esc(v) + '</td>';
    }).join('') + '</tr>';
  }).join('');

  // ---- money by year (stacked columns + accessible table) ----
  var ks = Object.keys(D.cats), ymax = Math.max.apply(null, D.byYear.map(function (y) { return ks.reduce(function (a, k) { return a + y[k]; }, 0); }));
  $('yr-cols').innerHTML = D.byYear.map(function (y) {
    return '<div class="c">' + ks.map(function (k) { return y[k] ? '<i class="k-' + k + '" style="height:' + (y[k] / ymax * 100) + '%"></i>' : ''; }).join('') + '</div>';
  }).join('');
  $('yr-x').innerHTML = D.byYear.map(function (y) { return '<span>' + y.y + '</span>'; }).join('');
  $('yr-v').innerHTML = D.byYear.map(function (y) { return '<span>' + money(ks.reduce(function (a, k) { return a + y[k]; }, 0)) + '</span>'; }).join('');
  $('yr-legend').innerHTML = ks.map(function (k) { return '<span><i class="k-' + k + '"></i>' + esc(D.cats[k]) + '</span>'; }).join('');
  $('yr-t').innerHTML = D.byYear.map(function (y) { return '<tr><th scope="row">' + y.y + '</th>' + ks.map(function (k) { return '<td>' + money(y[k]) + '</td>'; }).join('') + '</tr>'; }).join('');

  // ---- 527 groups ----
  $('p527').innerHTML = D.p527.map(function (p) {
    return '<div class="mk-col" style="border-top-color:var(--black)"><span class="kicker" style="color:var(--mid)">' + money(p.total) + ' from MSOs</span><h3 style="font-size:26px">' + esc(p.org) + '</h3>' +
      '<ul class="mk-list light">' + p.donors.map(function (d) { return '<li><span>' + esc(d.name) + '</span><b>' + money(d.amt) + '</b></li>'; }).join('') + '</ul></div>';
  }).join('');

  // ---- company files ----
  var files = document.querySelectorAll('#co-files [data-co]'), tabs = $('co-tabs');
  var giv = {}; D.giving.forEach(function (g) { giv[g.co] = g; });
  var roles = {}; D.matrix.forEach(function (m) {
    roles[m.co] = m.cells.map(function (v, i) { return v && v.charAt(0) !== '$' ? D.cols[i].name + ' (' + v.toLowerCase() + ')' : null; }).filter(Boolean);
  });
  Array.prototype.forEach.call(files, function (f) {
    var name = f.getAttribute('data-co'), g = giv[name] || {};
    f.querySelector('[data-stats]').innerHTML = [['Federal giving, company', g.fedCo], ['Federal giving, executives', g.fedEx], ['Governor/AG/legislative 527s', g.s527], ['State giving (7 states)', g.state]]
      .map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + money(r[1]) + '</dd></div>'; }).join('');
    var li = f.querySelector('[data-groups]');
    if (roles[name] && roles[name].length) li.textContent = 'Trade groups: ' + roles[name].join('; ') + '.'; else li.remove();
    var b = document.createElement('button'); b.type = 'button'; b.textContent = name; b.setAttribute('aria-pressed', f.hidden ? 'false' : 'true');
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(files, function (x) { x.hidden = x !== f; });
      Array.prototype.forEach.call(tabs.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    });
    tabs.appendChild(b);
  });
})();
