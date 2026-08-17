/* aicourse.top — the platform shell
 * ---------------------------------------------------------------------------
 * Injects the same header and footer into every page, wires the language
 * menu, the theme toggle and the mobile nav. Depends on i18n.js being loaded
 * first.
 *
 * Pages opt in with:  <div data-shell="home"></div>   (or handbook | lab)
 * and                 <div data-shell-foot></div>
 */
(function () {
  "use strict";

  /* The PedaNova star crowning the A. Kept as a string so every page gets
     the identical mark from one place. */
  var MARK =
    '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<g fill="none" stroke="currentColor" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M8.5 43.5 L24 15.5 L39.5 43.5"/><path d="M16 33 H32"/></g>' +
      '<path d="M24.00 1.30C25.21 4.58 27.46 7.19 30.30 8.60C27.46 10.01 25.21 12.62 24.00 15.90C22.79 12.62 20.54 10.01 17.70 8.60C20.54 7.19 22.79 4.58 24.00 1.30Z" fill="#F7C948"/>' +
      '<path d="M24.00 5.68C24.44 7.14 25.26 8.09 26.52 8.60C25.26 9.11 24.44 10.06 24.00 11.52C23.56 10.06 22.74 9.11 21.48 8.60C22.74 8.09 23.56 7.14 24.00 5.68Z" fill="#90D0F5"/>' +
    '</svg>';

  var NAV = [
    { id: "home",     href: "index.html",    key: "nav.home" },
    { id: "handbook", href: "handbook.html", key: "nav.handbook" },
    { id: "lab",      href: "play.html",     key: "nav.lab" },
    { id: "course",   href: "https://github.com/HUDongpin/agent-edu/tree/main/course", key: "nav.course", ext: true },
    { id: "teach",    href: "https://github.com/HUDongpin/agent-edu/blob/main/TEACHING.md", key: "nav.teach", ext: true }
  ];

  function el(html) {
    var d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function buildHeader(active) {
    var nav = NAV.map(function (n) {
      return '<a href="' + n.href + '"' +
        (n.id === active ? ' aria-current="page"' : "") +
        (n.ext ? ' rel="noopener"' : "") +
        ' data-i18n="' + n.key + '"></a>';
    }).join("");

    return el(
      '<header class="topbar">' +
        '<div class="topbar-in">' +
          '<a class="logo" href="index.html">' + MARK +
            '<span><span class="wm">aicourse<i>.top</i></span>' +
            '<span class="tagline" data-i18n="brand.tag"></span></span>' +
          '</a>' +
          '<nav class="mainnav" id="aeNav">' + nav + '</nav>' +
          '<div class="topacts">' +
            '<button class="iconbtn navtoggle" id="aeNavBtn" type="button" ' +
              'aria-expanded="false" data-i18n-aria="nav.menu">☰</button>' +
            '<div class="langwrap">' +
              '<button class="iconbtn" id="aeLangBtn" type="button" aria-haspopup="true" ' +
                'aria-expanded="false" data-i18n-aria="nav.lang">' +
                '<span aria-hidden="true">🌐</span><span id="aeLangNow"></span></button>' +
              '<div class="langmenu" id="aeLangMenu" role="menu" hidden></div>' +
            '</div>' +
            '<button class="iconbtn" id="aeThemeBtn" type="button" ' +
              'data-i18n-aria="nav.theme" aria-label="Theme">◐</button>' +
          '</div>' +
        '</div>' +
      '</header>'
    );
  }

  function buildFooter() {
    return el(
      '<footer class="sitefoot">' +
        '<div class="sitefoot-in">' +
          '<div>' +
            '<h4><span class="wm">aicourse.top</span></h4>' +
            '<p data-i18n="brand.sub"></p>' +
            '<p class="muted" data-i18n="foot.licence"></p>' +
          '</div>' +
          '<div>' +
            '<h4 data-i18n="home.pathTitle"></h4>' +
            '<ul>' +
              '<li><a href="handbook.html" data-i18n="track.1.title"></a></li>' +
              '<li><a href="play.html" data-i18n="track.2.title"></a></li>' +
              '<li><a href="https://github.com/HUDongpin/agent-edu/tree/main/course" rel="noopener" data-i18n="track.3.title"></a></li>' +
              '<li><a href="https://github.com/HUDongpin/agent-edu/blob/main/TEACHING.md" rel="noopener" data-i18n="nav.teach"></a></li>' +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<h4 data-i18n="nav.lang"></h4>' +
            '<p class="muted" data-i18n="note.langHelp"></p>' +
            '<p><a href="https://github.com/HUDongpin/agent-edu/blob/main/assets/i18n.js" rel="noopener" data-i18n="foot.translate"></a></p>' +
          '</div>' +
          '<div>' +
            '<h4 data-i18n="foot.source"></h4>' +
            '<p><a href="https://github.com/HUDongpin/agent-edu" rel="noopener">github.com/HUDongpin/agent-edu</a></p>' +
            '<p class="muted"><span data-i18n="foot.built"></span> ' +
              '<a href="https://github.com/HUDongpin" rel="noopener">HU Dongpin</a></p>' +
            '<p class="muted" data-i18n="foot.disclaim"></p>' +
          '</div>' +
        '</div>' +
      '</footer>'
    );
  }

  function paintLangMenu() {
    var menu = document.getElementById("aeLangMenu");
    if (!menu) return;
    menu.innerHTML = "";
    I18N.langs.forEach(function (l) {
      var cov = I18N.coverage(l.code);
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "menuitem");
      b.setAttribute("lang", l.code);
      if (l.code === I18N.current) b.setAttribute("aria-current", "true");
      b.innerHTML = '<span class="flag" aria-hidden="true">' + l.flag + "</span>" +
        "<span>" + l.native + "</span>" +
        '<span class="en">' + (cov.pct === 100 ? l.name : l.name + " · " + cov.pct + "%") + "</span>";
      b.addEventListener("click", function () {
        I18N.set(l.code);
        closeLang();
        document.getElementById("aeLangBtn").focus();
      });
      menu.appendChild(b);
    });
  }

  function closeLang() {
    var m = document.getElementById("aeLangMenu"), b = document.getElementById("aeLangBtn");
    if (m) m.hidden = true;
    if (b) b.setAttribute("aria-expanded", "false");
  }

  function mount() {
    var slot = document.querySelector("[data-shell]");
    if (slot) slot.replaceWith(buildHeader(slot.getAttribute("data-shell")));
    var fslot = document.querySelector("[data-shell-foot]");
    if (fslot) fslot.replaceWith(buildFooter());

    /* language */
    var lb = document.getElementById("aeLangBtn");
    if (lb) {
      lb.addEventListener("click", function (e) {
        e.stopPropagation();
        var m = document.getElementById("aeLangMenu");
        m.hidden = !m.hidden;
        lb.setAttribute("aria-expanded", m.hidden ? "false" : "true");
      });
      document.addEventListener("click", closeLang);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLang(); });
      document.getElementById("aeLangMenu").addEventListener("click", function (e) { e.stopPropagation(); });
    }

    /* theme */
    var TKEY = "ae.theme";
    var saved;
    try { saved = localStorage.getItem(TKEY); } catch (e) { /* private mode */ }
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    var tb = document.getElementById("aeThemeBtn");
    if (tb) tb.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
      var next = dark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem(TKEY, next); } catch (e) { /* private mode */ }
    });

    /* mobile nav */
    var nb = document.getElementById("aeNavBtn");
    if (nb) nb.addEventListener("click", function () {
      var n = document.getElementById("aeNav");
      var open = n.classList.toggle("open");
      nb.setAttribute("aria-expanded", open ? "true" : "false");
    });

    /* i18n: paint now, and again whenever the language changes */
    I18N.onchange = function (code) {
      var now = document.getElementById("aeLangNow");
      if (now) now.textContent = I18N.meta(code).native;
      paintLangMenu();
      document.title = I18N.t(document.body.getAttribute("data-title-key") || "brand.name") +
        " · " + I18N.t("brand.tag");
      var banner = document.getElementById("enOnly");
      if (banner) banner.hidden = (code === "en");
      /* Untranslated article text keeps its own direction; see brand.css. */
      var enc = document.querySelector(".en-content");
      if (enc) enc.setAttribute("dir", code === "ar" ? "ltr" : "auto");
      if (typeof window.onLangChange === "function") window.onLangChange(code);
    };
    I18N.init();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
