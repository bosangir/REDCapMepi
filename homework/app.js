/* Homework page: theme, contents highlight, slide viewer, countdown. */
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
  var SECTIONS = [[1, "Introduction"], [4, "Longitudinal projects"], [8, "Arms, events and Data Access Groups"], [11, "Events and data entry"],
    [15, "Calendar"], [17, "Branching logic, embedding, piping, action tags"], [22, "Surveys"], [27, "Reports, practicals and extras"],
    [32, "Homework"], [34, "Class demonstration project"]];
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

})();
