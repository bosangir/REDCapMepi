/* CRF browser: renders a REDCap data dictionary (CSV) as clean, numbered case report forms.
   Used by the course-work page (TBCARE) and the homework page.
   Usage: CRFBrowser(element, {dict, events, mapping, surveys:[], repeatForms:[], repeatEvents:[], formLabels:{}, formNotes:{}}) */
(function () {
  "use strict";

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
  function objs(text) {
    var rows = parseCSV(text), head = rows.shift();
    return rows.filter(function (r) { return r.length > 1; }).map(function (r) {
      var o = {}; head.forEach(function (h, i) { o[h] = r[i] || ""; }); return o;
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function choices(s) {
    if (!s) return [];
    return s.split("|").map(function (p) { var k = p.indexOf(","); return [p.slice(0, k).trim(), p.slice(k + 1).trim()]; });
  }
  var DATEFMT = { date_dmy: "DD-MM-YYYY", date_ymd: "YYYY-MM-DD", date_mdy: "MM-DD-YYYY", datetime_dmy: "DD-MM-YYYY hh:mm" };
  var TYPE = { text: "Text", notes: "Notes box", radio: "Radio buttons", dropdown: "Drop-down list", checkbox: "Checkboxes (tick all that apply)",
    yesno: "Yes / No", truefalse: "True / False", calc: "Calculated field", descriptive: "Descriptive text", file: "File upload", slider: "Slider (0 to 100)" };

  window.CRFBrowser = function (el, cfg) {
    Promise.all([cfg.dict, cfg.events, cfg.mapping].map(function (u) { return fetch(u).then(function (r) { return r.text(); }); }))
      .then(function (t) { build(el, cfg, objs(t[0]), objs(t[1]), objs(t[2])); })
      .catch(function (e) { el.innerHTML = "<p class='note'>Could not load the forms: " + esc(e.message) + "</p>"; });
  };

  function build(el, cfg, dd, events, mapping) {
    var V = "Variable / Field Name", FN = "Form Name", FT = "Field Type", LB = "Field Label", CH = "Choices, Calculations, OR Slider Labels",
      NOTE = "Field Note", VAL = "Text Validation Type OR Show Slider Number", MIN = "Text Validation Min", MAX = "Text Validation Max",
      ID = "Identifier?", BR = "Branching Logic (Show field only if...)", RQ = "Required Field?", MAT = "Matrix Group Name", AN = "Field Annotation", SH = "Section Header";
    var byVar = {}, forms = [];
    dd.forEach(function (r) { byVar[r[V]] = r; if (forms.indexOf(r[FN]) < 0) forms.push(r[FN]); });
    var evLabel = {}; events.forEach(function (e) { evLabel[e.unique_event_name] = e.event_name + " (arm " + e.arm_num + ")"; });
    var armName = cfg.armNames || {};
    // which events each form is collected at
    var formEvents = {}; forms.forEach(function (f) { formEvents[f] = []; });
    mapping.forEach(function (m) { if (formEvents[m.form]) formEvents[m.form].push(m.unique_event_name); });
    // fields embedded in another field's text ({var}) are drawn inside that field, not on their own
    var embeddedIn = {};
    dd.forEach(function (r) { (r[LB] + " " + r[NOTE] + " " + r[SH]).replace(/\{([a-z0-9_]+)\}/g, function (_, v) { embeddedIn[v] = r[V]; }); });
    var flabel = function (f) { return (cfg.formLabels && cfg.formLabels[f]) || f; };
    var fnum = function (f) { return "F" + (forms.indexOf(f) + 1); };

    // ---- plain-language branching logic
    function choiceLabel(v, code) {
      var r = byVar[v]; if (!r) return code;
      if (r[FT] === "yesno") return code === "1" ? "Yes" : "No";
      if (r[FT] === "truefalse") return code === "1" ? "True" : "False";
      var c = choices(r[CH]).filter(function (x) { return x[0] === code; })[0];
      return c ? c[1] : code;
    }
    function short(v) { var r = byVar[v]; if (!r) return v; var l = r[LB].replace(/<[^>]+>/g, "").replace(/\[[^\]]+\]/g, "…").trim(); return l.length > 48 ? l.slice(0, 46) + "…" : l; }
    function plain(logic) {
      if (!logic) return "";
      var s = logic;
      s = s.replace(/\[event-name\]\s*(=|<>)\s*'([a-z0-9_]+)'/g, function (_, op, ev) { return "\u0001visit " + (op === "=" ? "is " : "is not ") + (evLabel[ev] || ev) + "\u0002"; });
      s = s.replace(/\[first-event-name\]\[([a-z0-9_]+)\]\s*(=|<>)\s*'([^']*)'/g, function (_, v, op, c) { return "\u0001at baseline, “" + short(v) + "” " + (op === "=" ? "is " : "is not ") + choiceLabel(v, c) + "\u0002"; });
      s = s.replace(/\[([a-z0-9_]+)\((\w+)\)\]\s*=\s*'1'/g, function (_, v, c) { return "\u0001“" + choiceLabel(v, c) + "” is ticked\u0002"; });
      s = s.replace(/\[([a-z0-9_]+)\]\s*<>\s*''/g, function (_, v) { return "\u0001“" + short(v) + "” is filled in\u0002"; });
      s = s.replace(/\[([a-z0-9_]+)\]\s*(=|<>)\s*'([^']*)'/g, function (_, v, op, c) {
        var r = byVar[v], lab = r && /radio|dropdown|yesno|truefalse/.test(r[FT]) ? choiceLabel(v, c) : c;
        if (r && r[FT] === "calc") lab = c === "1" ? "yes" : c === "0" ? "no" : c;
        return "\u0001“" + short(v) + "” " + (op === "=" ? "is " : "is not ") + lab + "\u0002";
      });
      s = s.replace(/\[([a-z0-9_]+)\]\s*(>=|<=|>|<)\s*'?([0-9.]+)'?/g, function (_, v, op, n) { return "\u0001“" + short(v) + "” " + { ">=": "≥", "<=": "≤", ">": ">", "<": "<" }[op] + " " + n + "\u0002"; });
      s = s.replace(/\s+and\s+/g, " and ").replace(/\s+or\s+/g, " or ");
      return esc(s).replace(/\u0001/g, "").replace(/\u0002/g, "");
    }
    // piping: [var] or [event][var] in text becomes a highlighted placeholder
    function pipeSpan(m, pre, v) {
      var what = byVar[v] ? short(v) : v.replace(/-/g, " ");
      return "<span class='pipe' title='Piping: REDCap shows the value of " + esc(m) + " here'>" + esc(what) + "</span>";
    }
    function piped(text) { return esc(text).replace(/(\[[a-z0-9_\-]+\])?\[([a-z0-9_\-]+)\]/g, pipeSpan); }
    function richLabel(r) {
      // descriptive fields may contain HTML (tables) and embedded fields; keep their structure but make it safe
      var t = r[LB];
      if (r[FT] === "descriptive") {
        var tmp = document.createElement("div"); tmp.innerHTML = t.replace(/\{([a-z0-9_]+)\}/g, "@@$1@@");
        tmp.querySelectorAll("script,style,iframe").forEach(function (n) { n.remove(); });
        tmp.querySelectorAll("*").forEach(function (n) { n.removeAttribute("style"); });
        var h = tmp.innerHTML.replace(/(\[[a-z0-9_\-]+\])?\[([a-z0-9_\-]+)\]/g, pipeSpan);
        return h.replace(/@@([a-z0-9_]+)@@/g, function (_, v) { return "<span class='emb' title='Field embedding: the field " + v + " is shown here'>" + answer(byVar[v], true) + "</span>"; });
      }
      return piped(t.replace(/<[^>]+>/g, ""));
    }
    function answer(r, inline) {
      if (!r) return "";
      var t = r[FT], v = r[VAL], o = "";
      if (t === "radio" || t === "dropdown" || t === "yesno" || t === "truefalse" || t === "checkbox") {
        var cs = t === "yesno" ? [["1", "Yes"], ["0", "No"]] : t === "truefalse" ? [["1", "True"], ["0", "False"]] : choices(r[CH]);
        var box = t === "checkbox" ? "☐" : "○";
        o = "<span class='opts" + (inline || cs.length <= 3 ? " row" : "") + "'>" + cs.map(function (c) {
          return "<span class='opt'><i>" + box + "</i>" + piped(c[1]) + " <code class='ann code'>" + esc(c[0]) + "</code></span>";
        }).join("") + "</span>";
      } else if (t === "calc") {
        o = "<span class='calc'>Calculated by REDCap</span>";
      } else if (t === "file") {
        o = "<span class='box wide'>" + (v === "signature" ? "Signature" : "File") + "</span>";
      } else if (t === "notes") {
        o = "<span class='box area'></span>";
      } else if (t === "slider") {
        var sl = r[CH].split("|"); o = "<span class='slider'><span>" + esc((sl[0] || "").trim()) + "</span><b></b><span>" + esc((sl[2] || sl[1] || "").trim()) + "</span></span>";
      } else if (t === "text") {
        var hint = DATEFMT[v] || (v === "integer" ? "whole number" : /number/.test(v) ? "number" : v || "text");
        o = "<span class='box" + (DATEFMT[v] ? " date" : v ? "" : " wide") + "'>" + esc(hint) + "</span>";
        if (r[MIN] || r[MAX]) o += " <span class='range'>" + esc(r[MIN] || "…") + " to " + esc(r[MAX] || "…") + "</span>";
      }
      return o;
    }
    function tags(r) {
      var b = [];
      if (r[RQ] === "y") b.push("<span class='tag req'>required</span>");
      if (r[ID] === "y") b.push("<span class='tag id'>identifier</span>");
      if (/\[[a-z0-9_\-]+\]/.test(r[LB] + r[NOTE] + r[SH]) && r[FT] !== "calc") b.push("<span class='tag pipe-t'>piping</span>");
      if (/\{[a-z0-9_]+\}/.test(r[LB])) b.push("<span class='tag emb-t'>field embedding</span>");
      if (r[AN]) b.push("<span class='tag at'>" + esc(r[AN].split(/\s+/)[0].replace(/=.*/, "").replace(/\(.*/, "")) + "</span>");
      return b.join("");
    }
    function annotation(r) {
      var a = "<span class='ann'><code>" + esc(r[V]) + "</code> · " + esc(r[FT]) + (r[VAL] ? " · " + esc(r[VAL]) : "") +
        (r[AN] ? " · <code>" + esc(r[AN]) + "</code>" : "") + "</span>";
      if (r[FT] === "calc") a += "<span class='ann'><code>" + esc(r[CH]) + "</code></span>";
      if (r[BR]) a += "<span class='ann'>logic: <code>" + esc(r[BR]) + "</code></span>";
      return a;
    }
    function renderForm(f) {
      var rows = dd.filter(function (r) { return r[FN] === f; });
      var evs = formEvents[f].map(function (e) { return evLabel[e] || e; });
      var who = cfg.surveys.indexOf(f) >= 0 ? "Participant (survey)" : "Study staff";
      var rep = cfg.repeatForms.indexOf(f) >= 0 ? "<span class='tag rep'>repeating form</span>" : "";
      var h = "<div class='crf-head'><span class='fno'>" + fnum(f) + "</span><div><h3>" + esc(flabel(f)) + " " +
        (cfg.surveys.indexOf(f) >= 0 ? "<span class='tag survey'>survey</span>" : "") + rep + "</h3>" +
        "<p><b>Completed by</b> " + who + " · <b>Instrument name</b> <code>" + esc(f) + "</code></p>" +
        "<p><b>Collected at</b> " + esc(evs.join(", ")) + "</p>" +
        (cfg.formNotes && cfg.formNotes[f] ? "<p class='fnote'>" + cfg.formNotes[f] + "</p>" : "") + "</div></div><ol class='qs'>";
      var n = 0, inMatrix = null;
      rows.forEach(function (r, i) {
        if (embeddedIn[r[V]] && embeddedIn[r[V]] !== r[V]) {
          h += "<li class='q embedded-src'><span class='ann'><code>" + esc(r[V]) + "</code> is embedded above (" + esc(TYPE[r[FT]] || r[FT]) + ")" + (r[BR] ? "; logic: <code>" + esc(r[BR]) + "</code>" : "") + "</span></li>";
          return;
        }
        if (r[SH]) { if (inMatrix) { h += "</tbody></table></li>"; inMatrix = null; } h += "<li class='sh'>" + piped(r[SH]) + "</li>"; }
        if (r[MAT]) {
          var cs = choices(r[CH]);
          if (inMatrix !== r[MAT]) {
            if (inMatrix) h += "</tbody></table></li>";
            inMatrix = r[MAT];
            h += "<li class='q mat'><span class='tag'>matrix group <code>" + esc(r[MAT]) + "</code></span><table class='mtx'><thead><tr><th></th>" +
              cs.map(function (c) { return "<th>" + esc(c[1]) + "<code class='ann code'>" + esc(c[0]) + "</code></th>"; }).join("") + "</tr></thead><tbody>";
          }
          n++;
          h += "<tr><td><b>" + n + ".</b> " + piped(r[LB]) + annotation(r) + "</td>" + cs.map(function () { return "<td>○</td>"; }).join("") + "</tr>";
          return;
        }
        if (inMatrix) { h += "</tbody></table></li>"; inMatrix = null; }
        var isDesc = r[FT] === "descriptive";
        if (!isDesc) n++;
        var cond = r[BR] ? "<div class='cond'><span>Only if</span> " + plain(r[BR]) + "</div>" : "";
        h += "<li class='q t-" + esc(r[FT]) + (r[BR] ? " has-cond" : "") + "'>" + cond +
          "<div class='qrow'><span class='qn'>" + (isDesc ? "" : n + ".") + "</span><div class='qbody'><div class='ql'>" + richLabel(r) + " " + tags(r) + "</div>" +
          (r[NOTE] ? "<div class='qnote'>" + piped(r[NOTE]) + "</div>" : "") +
          (isDesc ? "" : "<div class='qa'>" + answer(r) + "</div>") + annotation(r) + "</div></div></li>";
      });
      if (inMatrix) h += "</tbody></table></li>";
      return h + "</ol>";
    }

    // ---- layout
    var arms = []; events.forEach(function (e) { if (arms.indexOf(e.arm_num) < 0) arms.push(e.arm_num); });
    var visitBtns = "<span class='lab'>1. Choose a visit</span><span class='chips'><button type='button' class='vchip on' data-ev=''>All forms</button></span>" + arms.map(function (a) {
      return "<span class='armlab'>" + esc(armName[a] || "Arm " + a) + "</span><span class='chips'>" + events.filter(function (e) { return e.arm_num === a; }).map(function (e) {
        return "<button type='button' class='vchip' data-ev='" + esc(e.unique_event_name) + "'>" + esc(e.event_name) + "</button>";
      }).join("") + "</span>";
    }).join("");
    el.innerHTML = "<div class='crf-visits' role='group' aria-label='Choose a visit'>" + visitBtns + "</div>" +
      "<div class='crf-tools'><span class='lab'>2. Choose a form</span><label class='annt'><input type='checkbox' class='anntoggle'> Show the REDCap build details (variable names, codes, logic)</label>" +
      "<button type='button' class='vbtn printbtn'>Print this form</button></div>" +
      "<div class='crf-layout'><nav class='crf-list' aria-label='Forms'></nav><article class='crf-paper' tabindex='-1'></article></div>";
    var list = el.querySelector(".crf-list"), paper = el.querySelector(".crf-paper"), curForm = forms[0], curEv = "";
    function drawList() {
      var fs = curEv ? forms.filter(function (f) { return formEvents[f].indexOf(curEv) >= 0; }) : forms;
      if (fs.indexOf(curForm) < 0) curForm = fs[0];
      list.innerHTML = (curEv ? "<p class='lhead'>" + esc(evLabel[curEv]) + ": " + fs.length + " forms</p>" : "<p class='lhead'>All " + forms.length + " forms</p>") +
        fs.map(function (f) {
          var nq = dd.filter(function (r) { return r[FN] === f && r[FT] !== "descriptive"; }).length;
          return "<button type='button' class='fbtn" + (f === curForm ? " on" : "") + "' data-f='" + esc(f) + "'><span class='fno'>" + fnum(f) + "</span><span><b>" + esc(flabel(f)) + "</b><small>" + nq + " questions" +
            (cfg.surveys.indexOf(f) >= 0 ? " · survey" : "") + (cfg.repeatForms.indexOf(f) >= 0 ? " · repeats" : "") + "</small></span></button>";
        }).join("");
      list.querySelectorAll(".fbtn").forEach(function (b) { b.addEventListener("click", function () { curForm = b.dataset.f; drawList(); paper.focus({ preventScroll: true }); }); });
      paper.innerHTML = renderForm(curForm);
    }
    el.querySelectorAll(".vchip").forEach(function (b) {
      b.addEventListener("click", function () {
        el.querySelectorAll(".vchip").forEach(function (x) { x.classList.toggle("on", x === b); });
        curEv = b.dataset.ev; drawList();
      });
    });
    el.querySelector(".anntoggle").addEventListener("change", function () { el.classList.toggle("show-ann", this.checked); });
    el.querySelector(".printbtn").addEventListener("click", function () {
      var w = window.open("", "_blank"); if (!w) return;
      var css = Array.prototype.map.call(document.querySelectorAll("style"), function (s) { return s.outerHTML; }).join("") +
        Array.prototype.map.call(document.querySelectorAll("link[rel=stylesheet]"), function (l) { return "<link rel='stylesheet' href='" + l.href + "'>"; }).join("");
      w.document.write("<!doctype html><html><head><meta charset='utf-8'><title>" + esc(flabel(curForm)) + "</title>" + css +
        "</head><body class='crf-print'><div class='crf" + (el.classList.contains("show-ann") ? " show-ann" : "") + "'><article class='crf-paper'>" + paper.innerHTML + "</article></div></body></html>");
      w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 300);
    });
    drawList();
  }
})();
