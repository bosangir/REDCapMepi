/* Course-work page: slide viewer, event matrix, data dictionary, data preview, R in the browser (webR). */
(function () {
  "use strict";

  // ---------------------------------------------------------------- theme (shared with the pre-course page)
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

  // ---------------------------------------------------------------- table of contents highlight
  var links = document.querySelectorAll("nav.toc a");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-5% 0px -85% 0px" });
    document.querySelectorAll("main section").forEach(function (s) { io.observe(s); });
  }

  // ---------------------------------------------------------------- slide viewer
  var TITLES = window.SLIDE_TITLES || [];
  var N = TITLES.length, cur = 0;
  var SECTIONS = [[1, "Introduction"], [5, "Topic 1 · Getting started"], [11, "Topic 2 · Building instruments"],
    [20, "Topic 3 · Project types"], [25, "Topic 4 · Longitudinal and repeating data"], [30, "Topic 5 · Data entry and quality"],
    [38, "Topic 6 · Users, exports, going live"], [46, "TBCARE · from CRF to analysis in R"], [59, "Hands-on lab"], [62, "Wrap-up"]];
  var img = document.getElementById("vimg"), vtitle = document.getElementById("vtitle"), vcount = document.getElementById("vcount");
  var thumbs = document.getElementById("thumbs"), jump = document.getElementById("vjump"), viewer = document.getElementById("viewer");
  function pad(i) { return (i < 10 ? "0" : "") + i; }
  SECTIONS.forEach(function (s) { var o = document.createElement("option"); o.value = s[0]; o.textContent = s[1] + "  (slide " + s[0] + ")"; jump.appendChild(o); });
  for (var i = 1; i <= N; i++) {
    var b = document.createElement("button"); b.type = "button"; b.className = "thumb"; b.dataset.i = i - 1;
    b.innerHTML = '<img loading="lazy" src="slides/t' + pad(i) + '.jpg" alt=""><span>' + i + "</span>";
    b.title = i + ". " + TITLES[i - 1];
    b.addEventListener("click", function () { show(+this.dataset.i); });
    thumbs.appendChild(b);
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

  // ---------------------------------------------------------------- event matrix
  var F = ["Screening", "e-Consent", "Enrolment", "Clinical assessment", "Laboratory", "ECG monitoring", "Quality of life", "Adverse events", "Medicines", "Treatment outcome", "Study completion"];
  var A1 = ["B", "M2", "M6", "M12", "Uns", "Logs"], A2 = ["B", "M1", "M2", "M4", "M6", "M9", "M12", "Uns", "Logs"];
  var G1 = ["x.....", "s.....", "x.....", "xxxxx.", "xxx.x.", "......", "s.ss..", ".....r", ".....r", "..x...", "...x.."];
  var G2 = ["x........", "s........", "x........", "xxxxxxxx.", "xxxxxx.x.", "xxxxxx...", "s...s.s..", "........r", "........r", ".....x...", "......x.."];
  var sym = { x: '<span class="c">✓</span>', s: '<span class="s">S</span>', r: '<span class="r">R</span>', ".": "" };
  var m = '<thead><tr><th rowspan="2">Form</th><th colspan="6" class="arm">Arm 1 · DS-TB</th><th colspan="9" class="arm">Arm 2 · DR-TB</th></tr><tr>' +
    A1.map(function (e) { return "<th>" + e + "</th>"; }).join("") + A2.map(function (e, j) { return "<th" + (j === 0 ? ' class="sep"' : "") + ">" + e + "</th>"; }).join("") + "</tr></thead><tbody>";
  F.forEach(function (f, i) {
    m += "<tr><td>" + f + "</td>" + G1[i].split("").map(function (c) { return "<td>" + sym[c] + "</td>"; }).join("") +
      G2[i].split("").map(function (c, j) { return "<td" + (j === 0 ? ' class="sep"' : "") + ">" + sym[c] + "</td>"; }).join("") + "</tr>";
  });
  document.getElementById("evmatrix").innerHTML = m + "</tbody>";

  // ---------------------------------------------------------------- CRF tabs
  var frame = document.getElementById("pdfframe"), openl = document.getElementById("pdfopen");
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); x.setAttribute("aria-selected", "false"); });
      t.classList.add("active"); t.setAttribute("aria-selected", "true");
      frame.src = t.dataset.pdf + "#view=FitH"; openl.href = t.dataset.pdf;
    });
  });

  // ---------------------------------------------------------------- CSV helpers
  function parseCSV(text) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (c !== "\r") f += c;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  // ---------------------------------------------------------------- data dictionary
  fetch("files/TBCARE_DataDictionary.csv").then(function (r) { return r.text(); }).then(function (t) {
    var rows = parseCSV(t), head = rows.shift();
    var ix = function (n) { return head.indexOf(n); };
    var c = { v: ix("Variable / Field Name"), f: ix("Form Name"), t: ix("Field Type"), l: ix("Field Label"), ch: ix("Choices, Calculations, OR Slider Labels"),
      val: ix("Text Validation Type OR Show Slider Number"), mn: ix("Text Validation Min"), mx: ix("Text Validation Max"), id: ix("Identifier?"),
      br: ix("Branching Logic (Show field only if...)"), rq: ix("Required Field?"), an: ix("Field Annotation"), mat: ix("Matrix Group Name") };
    var sel = document.getElementById("ddform"), search = document.getElementById("ddsearch"), tb = document.querySelector("#ddtable tbody");
    var forms = []; rows.forEach(function (r) { if (r[c.f] && forms.indexOf(r[c.f]) < 0) forms.push(r[c.f]); });
    forms.forEach(function (f) { var o = document.createElement("option"); o.value = f; o.textContent = f; sel.appendChild(o); });
    function render() {
      var fv = sel.value, s = search.value.toLowerCase(), n = 0, html = "";
      rows.forEach(function (r) {
        if (!r[c.v]) return;
        if (fv && r[c.f] !== fv) return;
        if (s && r.join(" ").toLowerCase().indexOf(s) < 0) return;
        n++;
        var val = r[c.val] + (r[c.mn] || r[c.mx] ? " " + r[c.mn] + "–" + r[c.mx] : "");
        var lab = r[c.l].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (lab.length > 90) lab = lab.slice(0, 88) + "…";
        html += "<tr class='t-" + r[c.t] + "'><td><code>" + esc(r[c.v]) + "</code>" + (r[c.rq] === "y" ? " <span class='req' title='required'>*</span>" : "") +
          "</td><td>" + esc(r[c.f]) + "</td><td><span class='ft'>" + esc(r[c.t]) + "</span></td><td>" + esc(lab) + "</td><td class='mono'>" + esc(r[c.ch]) +
          "</td><td>" + esc(val) + "</td><td class='mono'>" + esc(r[c.br]) + (r[c.mat] ? "<br><i>matrix: " + esc(r[c.mat]) + "</i>" : "") +
          "</td><td>" + (r[c.id] === "y" ? "<span class='idf'>yes</span>" : "") + "</td><td class='mono'>" + esc(r[c.an]) + "</td></tr>";
      });
      tb.innerHTML = html; document.getElementById("ddcount").textContent = n + " fields";
    }
    sel.addEventListener("change", render); search.addEventListener("input", render); render();
  });

  // ---------------------------------------------------------------- simulated data preview
  fetch("files/TBCARE_simulated_import.csv").then(function (r) { return r.text(); }).then(function (t) {
    var rows = parseCSV(t), head = rows.shift();
    rows = rows.filter(function (r) { return r.length > 3; });
    var H = function (n) { return head.indexOf(n); };
    var base = rows.filter(function (r) { return /^baseline/.test(r[H("redcap_event_name")]); });
    var arm1 = base.filter(function (r) { return /_arm_1$/.test(r[H("redcap_event_name")]); }).length;
    var mb = base.filter(function (r) { return r[H("redcap_data_access_group")] === "mbarara"; }).length;
    var ae = rows.filter(function (r) { return r[H("redcap_repeat_instrument")] === "adverse_events"; }).length;
    var un = rows.filter(function (r) { return /^unscheduled/.test(r[H("redcap_event_name")]); }).length;
    var st = [[base.length, "participants"], [arm1 + " / " + (base.length - arm1), "arm 1 / arm 2"], [(base.length - mb) + " / " + mb, "Antwerp / Mbarara"],
      [rows.length, "rows"], [un, "unscheduled visits"], [ae, "adverse events"]];
    document.getElementById("stats").innerHTML = st.map(function (s) { return "<div><b>" + s[0] + "</b><span>" + s[1] + "</span></div>"; }).join("");
    var SETS = {
      key: ["record_id", "redcap_event_name", "redcap_repeat_instrument", "redcap_repeat_instance", "redcap_data_access_group", "visit_date", "weight_kg"],
      clinical: ["record_id", "redcap_event_name", "redcap_repeat_instance", "visit_date", "weight_kg", "height_cm", "temp_c", "symptoms___1", "symptoms___6", "doses_missed", "unsched_reason"],
      lab: ["record_id", "redcap_event_name", "lab_eval", "spec_date", "test_type___1", "test_type___2", "test_type___3", "smear", "xpert", "culture", "qtcf"],
      logs: ["record_id", "redcap_event_name", "redcap_repeat_instrument", "redcap_repeat_instance", "ae_term", "ae_grade", "ae_serious", "med_name", "med_start", "med_ongoing"],
      ident: ["record_id", "redcap_event_name", "first_name", "last_name", "dob", "phone", "district", "cons_name"]
    };
    var evs = []; rows.forEach(function (r) { var e = r[H("redcap_event_name")]; if (evs.indexOf(e) < 0) evs.push(e); });
    var esel = document.getElementById("dsevent"), csel = document.getElementById("dscols");
    evs.forEach(function (e) { var o = document.createElement("option"); o.value = e; o.textContent = e; esel.appendChild(o); });
    function render() {
      var cols = SETS[csel.value], ev = esel.value;
      var sub = rows.filter(function (r) {
        if (ev && r[H("redcap_event_name")] !== ev) return false;
        if (csel.value === "logs" && !r[H("redcap_repeat_instrument")]) return false;
        return true;
      });
      var html = "<thead><tr>" + cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>";
      sub.slice(0, 60).forEach(function (r) { html += "<tr>" + cols.map(function (c) { return "<td>" + esc(r[H(c)] || "") + "</td>"; }).join("") + "</tr>"; });
      document.getElementById("dstable").innerHTML = html + "</tbody>";
      document.getElementById("dscount").textContent = "showing " + Math.min(60, sub.length) + " of " + sub.length + " rows" + (csel.value === "ident" ? " · fake names, still flagged as identifiers" : "");
    }
    esel.addEventListener("change", render); csel.addEventListener("change", render); render();
  });

  // ---------------------------------------------------------------- R in the browser
  var EX = window.R_EXAMPLES || [], webR = null, ready = null, statusEl = document.getElementById("webrstatus");
  var FILES = [["files/TBCARE_simulated_import.csv", "tbcare.csv"], ["files/TBCARE_simulated_with_errors.csv", "tbcare_errors.csv"],
    ["files/TBCARE_national_TB_register.csv", "register.csv"], ["files/TBCARE_DataDictionary.csv", "dictionary.csv"]];
  function status(t, cls) { statusEl.textContent = t; statusEl.className = "status " + (cls || ""); }
  function ensureR() {
    if (ready) return ready;
    ready = (async function () {
      status("Downloading R (about 15 MB, only the first time)…", "busy");
      var mod = await import("https://webr.r-wasm.org/latest/webr.mjs");
      webR = new mod.WebR(); await webR.init();
      status("Loading the TBCARE files…", "busy");
      for (var k = 0; k < FILES.length; k++) {
        var buf = new Uint8Array(await (await fetch(FILES[k][0])).arrayBuffer());
        await webR.FS.writeFile("/home/web_user/" + FILES[k][1], buf);
      }
      await webR.evalRVoid('setwd("/home/web_user"); options(width = 100)');
      status("R is ready. Files loaded: tbcare.csv, tbcare_errors.csv, register.csv, dictionary.csv", "ok");
    })().catch(function (e) { ready = null; status("Could not load R: " + e.message, "err"); throw e; });
    return ready;
  }
  var box = document.getElementById("examples");
  EX.forEach(function (ex, i) {
    var d = document.createElement("div"); d.className = "rex"; d.id = "rex-" + (i + 1);
    d.innerHTML = "<h3>" + (i + 1) + ". " + ex.title + "</h3><p>" + ex.intro + "</p>" +
      (ex.redcap ? "<details class='eq'><summary>" + (ex.redcapLabel || "The same step against REDCap, with REDCapR") + "</summary><pre><code>" + esc(ex.redcap) + "</code></pre></details>" : "") +
      "<textarea spellcheck='false' aria-label='R code for example " + (i + 1) + "'></textarea>" +
      "<div class='rbar'><button type='button' class='btn run'>Run</button><button type='button' class='btn ghost reset'>Reset code</button><span class='rtime'></span></div>" +
      "<pre class='rout' hidden></pre><div class='rplot'></div>";
    box.appendChild(d);
    var ta = d.querySelector("textarea"); ta.value = ex.code; ta.rows = Math.min(40, ex.code.split("\n").length + 1);
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Tab") { e.preventDefault(); var s = ta.selectionStart; ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + 2; }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); d.querySelector(".run").click(); }
    });
    d.querySelector(".reset").addEventListener("click", function () { ta.value = ex.code; });
    d.querySelector(".run").addEventListener("click", async function () {
      var btn = this, out = d.querySelector(".rout"), plot = d.querySelector(".rplot"), tm = d.querySelector(".rtime");
      btn.disabled = true; btn.textContent = "Running…"; out.hidden = false; out.textContent = ""; plot.innerHTML = "";
      try {
        await ensureR();
        var t0 = performance.now(), shelter = await new webR.Shelter();
        try {
          var res = await shelter.captureR(ta.value, { withAutoprint: true, captureStreams: true, captureConditions: false, captureGraphics: { width: 760, height: 440 } });
          out.textContent = res.output.filter(function (o) { return o.type === "stdout" || o.type === "stderr"; }).map(function (o) { return o.data; }).join("\n") || "(no printed output)";
          if (!out.textContent.replace("(no printed output)", "").trim() && (res.images || []).length) out.hidden = true;
          (res.images || []).forEach(function (im) {
            var cv = document.createElement("canvas"); cv.width = im.width; cv.height = im.height; cv.getContext("2d").drawImage(im, 0, 0); plot.appendChild(cv);
          });
        } finally { shelter.purge(); }
        tm.textContent = "done in " + ((performance.now() - t0) / 1000).toFixed(1) + " s";
      } catch (e) { out.textContent = "Error: " + (e.message || e); }
      btn.disabled = false; btn.textContent = "Run";
    });
  });
})();
