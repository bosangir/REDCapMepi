/* Homework page: theme, contents highlight, slide viewer, countdown, CRF page viewer, checklist. */
(function () {
  "use strict";
  var root = document.documentElement, tbtn = document.getElementById("themeToggle");
  function isDark() { var t = root.getAttribute("data-theme"); return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; }
  function label() { tbtn.textContent = isDark() ? "Light mode" : "Dark mode"; }
  try { var saved = localStorage.getItem("redcap-theme"); if (saved) root.setAttribute("data-theme", saved); } catch (e) {}
  label();
  tbtn.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark"; root.setAttribute("data-theme", next);
    try { localStorage.setItem("redcap-theme", next); } catch (e) {}
    label();
  });

  var links = document.querySelectorAll("nav.toc a");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); }); });
    }, { rootMargin: "-5% 0px -85% 0px" });
    document.querySelectorAll("main section").forEach(function (s) { io.observe(s); });
  }

  // ---------------------------------------------------------------- countdown to 13 Dec 2026, 11:00 Brussels (CET = UTC+1)
  var DEADLINE = Date.UTC(2026, 11, 13, 10, 0, 0);
  function tick() {
    var ms = DEADLINE - Date.now(), cd = document.getElementById("countdown");
    if (ms <= 0) { cd.innerHTML = "<div><b>Closed</b><span>deadline passed</span></div>"; return; }
    document.getElementById("cd-d").textContent = Math.floor(ms / 864e5);
    document.getElementById("cd-h").textContent = Math.floor(ms / 36e5) % 24;
    document.getElementById("cd-m").textContent = Math.floor(ms / 6e4) % 60;
  }
  tick(); setInterval(tick, 30000);

  // ---------------------------------------------------------------- slide viewer
  var TITLES = window.SLIDE_TITLES || [], N = TITLES.length, cur = 0;
  var SECTIONS = [[1, "Introduction"], [3, "Topic 1 · Longitudinal projects"], [7, "Topic 2 · Arms, events and repeating"], [13, "Topic 3 · Surveys"],
    [16, "Topic 4 · Data Access Groups"], [20, "Topic 5 · Embedding, piping, action tags"], [25, "Topic 6 · Class demo and homework"]];
  var img = document.getElementById("vimg"), vtitle = document.getElementById("vtitle"), vcount = document.getElementById("vcount");
  var thumbs = document.getElementById("thumbs"), jump = document.getElementById("vjump"), viewer = document.getElementById("viewer");
  function pad(i) { return (i < 10 ? "0" : "") + i; }
  SECTIONS.forEach(function (s) { var o = document.createElement("option"); o.value = s[0]; o.textContent = s[1] + "  (slide " + s[0] + ")"; jump.appendChild(o); });
  for (var i = 1; i <= N; i++) {
    var b = document.createElement("button"); b.type = "button"; b.className = "thumb"; b.dataset.i = i - 1;
    b.innerHTML = '<img loading="lazy" src="slides/t' + pad(i) + '.jpg" alt=""><span>' + i + "</span>"; b.title = i + ". " + TITLES[i - 1];
    b.addEventListener("click", function () { show(+this.dataset.i); }); thumbs.appendChild(b);
  }
  function show(k) {
    cur = Math.max(0, Math.min(N - 1, k));
    img.src = "slides/s" + pad(cur + 1) + ".jpg"; img.alt = "Slide " + (cur + 1) + ": " + TITLES[cur];
    vtitle.textContent = (cur + 1) + ". " + TITLES[cur]; vcount.textContent = (cur + 1) + " / " + N;
    thumbs.querySelectorAll(".thumb").forEach(function (t, j) { t.classList.toggle("on", j === cur); });
    var on = thumbs.children[cur]; if (on) thumbs.scrollTo({ left: on.offsetLeft - thumbs.clientWidth / 2 + on.clientWidth / 2, behavior: "smooth" });
    var sec = SECTIONS.filter(function (s) { return s[0] <= cur + 1; }).pop(); if (sec) jump.value = sec[0];
    var pre = new Image(); if (cur + 2 <= N) pre.src = "slides/s" + pad(cur + 2) + ".jpg";
  }
  document.getElementById("vprev").addEventListener("click", function () { show(cur - 1); });
  document.getElementById("vnext").addEventListener("click", function () { show(cur + 1); });
  jump.addEventListener("change", function () { show(+jump.value - 1); });
  viewer.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "PageDown") { show(cur + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { show(cur - 1); e.preventDefault(); }
  });
  var tx = null;
  img.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  img.addEventListener("touchend", function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); tx = null; });
  document.getElementById("vfull").addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen(); else if (viewer.requestFullscreen) viewer.requestFullscreen();
    viewer.focus();
  });
  var h = location.hash.match(/^#slide-(\d+)$/); show(h ? +h[1] - 1 : 0);

  // ---------------------------------------------------------------- CRF pages
  var PAGES = 8, cp = 1, PTABS = [["Protocol summary", 1], ["Schedule", 2], ["SELIG", 3], ["SEGE", 4], ["FSX", 5], ["FGE", 6], ["MV", 8]];
  var cimg = document.getElementById("crfimg"), ccount = document.getElementById("crfcount"), ctabs = document.getElementById("crftabs");
  PTABS.forEach(function (t) {
    var b = document.createElement("button"); b.type = "button"; b.className = "tab"; b.setAttribute("role", "tab"); b.textContent = t[0]; b.dataset.p = t[1];
    b.addEventListener("click", function () { page(t[1]); }); ctabs.appendChild(b);
  });
  function page(n) {
    cp = Math.max(1, Math.min(PAGES, n));
    cimg.src = "crf/p" + pad(cp) + ".jpg"; cimg.alt = "TUMAINI protocol and CRFs, page " + cp; ccount.textContent = "Page " + cp + " of " + PAGES;
    var act = PTABS.filter(function (t) { return t[1] <= cp; }).pop();
    ctabs.querySelectorAll(".tab").forEach(function (b) { var on = act && +b.dataset.p === act[1]; b.classList.toggle("active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
  }
  document.getElementById("crfprev").addEventListener("click", function () { page(cp - 1); });
  document.getElementById("crfnext").addEventListener("click", function () { page(cp + 1); });
  page(1);

  // ---------------------------------------------------------------- checklist (saved in this browser)
  var boxes = document.querySelectorAll("#checklist input"), bar = document.getElementById("ckbar"), state = [];
  try { state = JSON.parse(localStorage.getItem("redcap-hw-2026") || "[]"); } catch (e) {}
  function upd() {
    var n = 0, s = [];
    boxes.forEach(function (b, k) { s[k] = b.checked; if (b.checked) n++; });
    bar.style.width = (100 * n / boxes.length) + "%";
    try { localStorage.setItem("redcap-hw-2026", JSON.stringify(s)); } catch (e) {}
  }
  boxes.forEach(function (b, k) { b.checked = !!state[k]; b.addEventListener("change", upd); });
  upd();
})();
