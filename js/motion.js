(function () {
  var d = document, w = window, h = d.documentElement;
  var ease = true;
  try { ease = w.matchMedia("(prefers-reduced-motion: no-preference)").matches; } catch (e) {}

  function qs(s, el) { return (el || d).querySelector(s); }
  function qsa(s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); }

  /* --top-h from strip + header */
  var demo = qs(".demo"), head = qs(".head"), spacer = qs(".top-spacer");
  function topH() {
    var t = (demo ? demo.offsetHeight : 0) + (head ? head.offsetHeight : 0);
    h.style.setProperty("--top-h", t + "px");
    if (spacer) spacer.style.height = t + "px";
  }
  topH();
  if (w.ResizeObserver) {
    var ro = new ResizeObserver(topH);
    if (demo) ro.observe(demo);
    if (head) ro.observe(head);
  } else { w.addEventListener("resize", topH); }

  /* Mobile menu */
  var burger = qs(".burger"), menu = qs("#menu");
  function closeMenu() {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
    menu.hidden = true;
  }
  function openMenu() {
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Закрыть меню");
    menu.hidden = false;
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      if (menu.hidden) openMenu(); else closeMenu();
    });
    qsa("a", menu).forEach(function (a) { a.addEventListener("click", closeMenu); });
    w.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* Map click-to-load */
  var map = qs("[data-map]"), mapBtn = qs("[data-map-btn]");
  if (map && mapBtn) {
    mapBtn.addEventListener("click", function () {
      var fr = d.createElement("iframe");
      fr.title = "ESELE на карте";
      fr.src = "https://yandex.ru/map-widget/v1/?ol=biz&oid=1542896835&lang=ru_RU";
      fr.loading = "lazy";
      fr.allowFullscreen = true;
      map.appendChild(fr);
      map.classList.add("is-on");
    });
  }

  /* Words: keep accessible text on the heading */
  qsa("[data-words]").forEach(function (el) {
    if (el.getAttribute("data-split")) return;
    var text = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", text);
    el.setAttribute("data-split", "1");
    el.textContent = "";
    text.split(" ").forEach(function (word, i) {
      var wEl = d.createElement("span");
      wEl.className = "w";
      wEl.setAttribute("aria-hidden", "true");
      var inner = d.createElement("span");
      inner.className = "wi";
      inner.style.setProperty("--i", String(i));
      inner.textContent = word;
      wEl.appendChild(inner);
      el.appendChild(wEl);
      el.appendChild(d.createTextNode(" "));
    });
  });

  qsa("[data-stagger]").forEach(function (g) {
    qsa("[data-rv]", g).forEach(function (el, i) { el.style.setProperty("--i", String(i)); });
  });

  /* Motion engine */
  if (!ease) {
    qsa("[data-lit]").forEach(function (el) { el.classList.add("is-lit"); });
    return;
  }

  h.classList.add("m-ready");

  function reveal(el) {
    if (!el || el.classList.contains("in")) return;
    el.classList.add("in");
    if (el.getAttribute("data-rv") === "cur") {
      var done = function (ev) {
        if (ev && ev.propertyName && ev.propertyName !== "clip-path") return;
        el.classList.add("is-done");
        el.removeEventListener("transitionend", done);
      };
      el.addEventListener("transitionend", done);
    }
  }

  function sweep() {
    var vh = w.innerHeight || 0;
    qsa("[data-rv]").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh) reveal(el);
    });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        reveal(en.target);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0, rootMargin: "0px 0px 0px 0px" });

  /* Hero chain after 300ms */
  var heroScheduled = false;
  function heroChain() {
    if (heroScheduled) return;
    heroScheduled = true;
    var groups = [[], [], []];
    qsa(".hero [data-rv]").forEach(function (el) {
      var n = +(el.getAttribute("data-h") || 0);
      if (!groups[n]) groups[n] = [];
      groups[n].push(el);
    });
    setTimeout(function () { groups[0].forEach(reveal); }, 300);
    setTimeout(function () { groups[1].forEach(reveal); }, 500);
    setTimeout(function () { groups[2].forEach(reveal); }, 800);
  }

  qsa("[data-rv]").forEach(function (el) {
    if (el.closest(".hero")) return;
    io.observe(el);
  });

  /* Light-up paragraph */
  var litIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("is-lit");
        litIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.5 });
  qsa("[data-lit]").forEach(function (el) { litIO.observe(el); });

  /* Gallery lane (>=900) */
  var lanes = qsa("[data-lane]");
  function laneSize() {
    lanes.forEach(function (s) {
      var tr = qs(".lane-track", s), vp = qs(".lane-view", s);
      if (!tr || !vp) return;
      if (w.innerWidth >= 900) {
        s.classList.add("lane-on");
        tr.style.transform = "";
        var dist = Math.max(0, tr.scrollWidth - vp.clientWidth);
        s._dist = dist;
        var pinH = (qs(".lane-pin", s) || s).clientHeight || (w.innerHeight - 100);
        s.style.setProperty("--lane-h", (pinH + dist) + "px");
      } else {
        s.classList.remove("lane-on");
        tr.style.transform = "";
        s.style.removeProperty("--lane-h");
        s._dist = 0;
      }
    });
  }

  /* Contacts panel --fx */
  var panel = qs("[data-panel]");

  var ticking = false;
  function onScroll() {
    lanes.forEach(function (s) {
      if (!s.classList.contains("lane-on") || !s._dist) return;
      var r = s.getBoundingClientRect();
      var run = Math.max(1, s.offsetHeight - (qs(".lane-pin", s).clientHeight || 0));
      var p = Math.min(1, Math.max(0, -r.top / run));
      qs(".lane-track", s).style.transform = "translate3d(" + (-p * s._dist).toFixed(1) + "px,0,0)";
      var bar = qs(".lane-progress i", s);
      if (bar) bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
    });
    if (panel) {
      var r = panel.getBoundingClientRect();
      var start = w.innerHeight;
      var end = w.innerHeight * 0.4;
      var p = 1;
      if (r.top > start) p = 0;
      else if (r.top > end) p = (start - r.top) / (start - end);
      panel.style.setProperty("--fx", (48 * (1 - p)).toFixed(1) + "px");
    }
    sweep();
    ticking = false;
  }
  function req() {
    if (!ticking) { ticking = true; w.requestAnimationFrame(onScroll); }
  }

  /* Cursor light + polaroid tilt (fine pointer only) */
  var spot = qs(".spot"), tilt = qs("[data-tilt]");
  var fine = false;
  try { fine = w.matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (e2) {}
  if (fine && (spot || tilt)) {
    w.addEventListener("pointermove", function (e) {
      if (spot) spot.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
      if (tilt) {
        var r = tilt.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width;
        var y = (e.clientY - (r.top + r.height / 2)) / r.height;
        var rot = 3.2 + x * 4;
        tilt.style.setProperty("--tilt", rot.toFixed(2) + "deg");
      }
    }, { passive: true });
  }

  function start() {
    sweep();
    heroChain();
    laneSize();
    req();
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", start);
  else start();
  w.addEventListener("scroll", req, { passive: true });
  w.addEventListener("resize", function () { topH(); laneSize(); req(); });
  w.addEventListener("load", function () { topH(); laneSize(); sweep(); req(); });
  w.addEventListener("hashchange", sweep);
  w.addEventListener("beforeprint", function () {
    qsa("[data-rv]").forEach(reveal);
    qsa("[data-lit]").forEach(function (el) { el.classList.add("is-lit"); });
  });
})();
