(function () {
  var d = document, w = window, h = d.documentElement;
  var ease = true;
  try { ease = w.matchMedia("(prefers-reduced-motion: no-preference)").matches; } catch (e) {}

  function qs(s, el) { return (el || d).querySelector(s); }
  function qsa(s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); }

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

  var burger = qs(".burger"), menu = qs("#menu");
  function closeMenu() {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
    menu.hidden = true;
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      if (menu.hidden) {
        burger.setAttribute("aria-expanded", "true");
        burger.setAttribute("aria-label", "Закрыть меню");
        menu.hidden = false;
      } else closeMenu();
    });
    qsa("a", menu).forEach(function (a) { a.addEventListener("click", closeMenu); });
    w.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closeMenu(); });
  }

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

  /* Marks: scramble only when motion is on */
  var marksSet = qsa("[data-marks]");
  var glyphs = "·+/=–×•";
  function scramble(el) {
    var face = qs(".marks-fx", el);
    if (!face) return;
    var real = face.getAttribute("data-real") || face.textContent;
    face.setAttribute("data-real", real);
    var out = "";
    for (var i = 0; i < real.length; i++) {
      out += real.charAt(i) === " " ? " " : glyphs.charAt(i % glyphs.length);
    }
    face.textContent = out;
  }
  function descramble(el) {
    var face = qs(".marks-fx", el);
    if (!face) return;
    face.textContent = face.getAttribute("data-real") || face.textContent;
  }

  if (!ease) {
    qsa("[data-lit]").forEach(function (el) { el.classList.add("is-lit"); });
    var sub0 = qs(".h1-sub");
    if (sub0) sub0.classList.add("is-in");
    return;
  }

  marksSet.forEach(scramble);
  h.classList.add("m-ready");

  function reveal(el) {
    if (!el || el.classList.contains("in")) return;
    el.classList.add("in");
    if (el.hasAttribute("data-marks") || qs("[data-marks]", el)) {
      descramble(el.hasAttribute("data-marks") ? el : el);
    }
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
      if (el.getBoundingClientRect().top < vh) reveal(el);
    });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        reveal(en.target);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0, rootMargin: "0px" });

  qsa("[data-rv]").forEach(function (el) { io.observe(el); });

  var litIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("is-lit");
        litIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.5 });
  qsa("[data-lit]").forEach(function (el) { litIO.observe(el); });

  var sub = qs(".h1-sub");
  setTimeout(function () { if (sub) sub.classList.add("is-in"); }, 300);

  /* Reviews lane >=900 */
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
        var pinH = vp.clientHeight || (w.innerHeight - 100);
        s.style.setProperty("--lane-h", (pinH + dist) + "px");
      } else {
        s.classList.remove("lane-on");
        tr.style.transform = "";
        s.style.removeProperty("--lane-h");
        s._dist = 0;
      }
    });
  }

  var panel = qs("[data-panel]");
  var ticking = false;
  function onScroll() {
    lanes.forEach(function (s) {
      if (!s.classList.contains("lane-on") || !s._dist) return;
      var r = s.getBoundingClientRect();
      var run = Math.max(1, s.offsetHeight - (qs(".lane-view", s).clientHeight || 0));
      var p = Math.min(1, Math.max(0, -r.top / run));
      qs(".lane-track", s).style.transform = "translate3d(" + (-p * s._dist).toFixed(1) + "px,0,0)";
      var bar = qs(".lane-progress i", s);
      if (bar) bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
    });
    if (panel) {
      var r2 = panel.getBoundingClientRect();
      var start = w.innerHeight, end = w.innerHeight * 0.4, p = 1;
      if (r2.top > start) p = 0;
      else if (r2.top > end) p = (start - r2.top) / (start - end);
      panel.style.setProperty("--fx", (48 * (1 - p)).toFixed(1) + "px");
    }
    sweep();
    ticking = false;
  }
  function req() {
    if (!ticking) { ticking = true; w.requestAnimationFrame(onScroll); }
  }

  var spot = qs(".spot"), tilt = qs("[data-tilt]");
  var fine = false;
  try { fine = w.matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (e2) {}
  if (fine && (spot || tilt)) {
    w.addEventListener("pointermove", function (e) {
      if (spot) spot.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
      if (tilt) {
        var r = tilt.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / Math.max(1, r.width);
        tilt.style.setProperty("--tilt", (2 + x * 5).toFixed(2) + "deg");
      }
    }, { passive: true });
  }

  function start() {
    sweep();
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
    marksSet.forEach(descramble);
    qsa("[data-lit]").forEach(function (el) { el.classList.add("is-lit"); });
    if (sub) sub.classList.add("is-in");
  });
})();
