/* GUIYEON — 모든 페이지가 함께 쓰는 스크립트.
   머리(메뉴)와 바닥을 그리고, data.js의 내용으로 목록을 채웁니다. */

(function () {
  "use strict";

  // 내용은 content 폴더의 JSON 파일에서 읽습니다 (관리 화면에서 수정하는 파일)
  Promise.all(["settings", "works", "journal"].map(function (n) {
    return fetch("content/" + n + ".json", { cache: "no-cache" }).then(function (r) { return r.json(); });
  })).then(function (r) {
    render({ site: r[0], works: r[1].works || [], journal: r[2].journal || [] });
  });

  function render(D) {
  var S = D.site;
  var page = document.body.getAttribute("data-page");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // [확인 필요] 표시는 낙관색으로 드러나게 합니다
  function txt(s) {
    return esc(s).replace(/\[확인 필요\]/g, '<span class="todo">[확인 필요]</span>');
  }

  function byId(id) {
    for (var i = 0; i < D.works.length; i++) if (D.works[i].id === id) return D.works[i];
    return null;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // 상태 표기: Sold / SOLD 는 화면에서 SOLD OUT 으로 씁니다
  function stateLabel(v) {
    var t = String(v || "").toUpperCase();
    return t === "SOLD" ? "SOLD OUT" : t;
  }

  // 사진 자리: 파일이 있으면 사진이 천천히 나타나고, 없으면 경로가 보입니다
  function plate(src, label, ratio, alt) {
    return (
      '<figure class="plate ' + (ratio || "") + '">' +
      '<figcaption class="plate__label" aria-hidden="true"><b>' + esc(label) + "</b>" + esc(src) + "</figcaption>" +
      '<img src="' + esc(src) + '" alt="' + esc(alt || label) + '" loading="lazy" decoding="async">' +
      "</figure>"
    );
  }

  function wirePlates(root) {
    var imgs = (root || document).querySelectorAll(".plate img");
    imgs.forEach(function (img) {
      function ok() { img.classList.add("is-loaded"); }
      function fail() { img.remove(); }
      if (img.complete) {
        if (img.naturalWidth > 0) ok(); else fail();
      } else {
        img.addEventListener("load", ok, { once: true });
        img.addEventListener("error", fail, { once: true });
      }
    });
  }

  function workCard(w, opts) {
    opts = opts || {};
    var state = w.sale && w.status === "Available" ? w.sale.state : w.status;
    return (
      '<a class="work" href="work.html?id=' + esc(w.id) + '" data-status="' + esc(w.status) + '" data-cursor="VIEW">' +
      plate(w.image, w.id, opts.ratio || "r-4x5", w.title + " — " + w.species) +
      '<div class="work__cap">' +
      '<span class="work__id">' + esc(w.id) + "</span>" +
      '<span class="work__title">' + esc(w.title) + "</span>" +
      '<span class="work__meta">' + esc(w.speciesEn) + " · " + esc(w.year) + "</span>" +
      (opts.state ? '<span class="work__state">' + esc(stateLabel(state)) +
        (opts.price && w.sale ? " · " + txt(w.sale.price) : "") + "</span>" : "") +
      "</div></a>"
    );
  }

  /* ---------- 머리와 바닥 ---------- */

  var NAV = [
    ["works", "WORKS", "works.html"],
    ["about", "ABOUT", "about.html"],
    ["available", "AVAILABLE", "available.html"],
    ["journal", "JOURNAL", "journal.html"],
    ["contact", "CONTACT", "contact.html"]
  ];

  var head = document.querySelector("[data-site-head]");
  if (head) {
    head.className = "site-head";
    head.innerHTML =
      '<div class="wrap">' +
      '<a class="brand" href="index.html" aria-label="GUIYEON 귀연 처음으로">' +
      '<span class="wordmark">GUIYEON</span><img class="seal-img" src="images/brand/seal-160.png" alt="" width="22" height="34"></a>' +
      '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">MENU</button>' +
      '<nav class="nav" id="site-nav" aria-label="주 메뉴"><ul>' +
      NAV.map(function (n) {
        var cur = page === n[0] || (page === "work" && n[0] === "works") || (page === "inquiry" && n[0] === "available");
        return '<li><a href="' + n[2] + '"' + (cur ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>";
      }).join("") +
      "</ul></nav></div>";

    var btn = head.querySelector(".menu-btn");
    var nav = head.querySelector(".nav");
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      head.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "CLOSE" : "MENU";
      document.body.style.overflow = open ? "hidden" : "";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) btn.click();
    });
  }

  var foot = document.querySelector("[data-site-foot]");
  if (foot) {
    foot.className = "site-foot";
    foot.innerHTML =
      '<div class="wrap grid">' +
      '<div class="brand-col"><img class="seal-foot" src="images/brand/seal-160.png" alt="귀연 낙관" width="41" height="64"><span class="wordmark">GUIYEON</span>' +
      '<p class="field" style="margin:0">Bonsai Artist · 귀연</p>' +
      '<p class="field" style="margin:0">' + esc(S.location) + "</p></div>" +
      '<div class="links-col">' +
      '<a href="' + esc(S.instagram) + '" target="_blank" rel="noopener">Instagram</a>' +
      '<a href="' + esc(S.smartstore) + '" target="_blank" rel="noopener">Naver Smart Store</a>' +
      '<a href="contact.html">Contact</a></div>' +
      '<div class="base"><span>Copyright © ' + new Date().getFullYear() + " GUIYEON</span>" +
      (S.notice ? "<span>" + esc(S.notice) + "</span>" : "") + "</div>" +
      "</div>";
  }

  /* ---------- HOME ---------- */

  if (page === "home") {
    // 첫 화면 액자: 가까이서 본 나무의 부분들이 천천히 바뀝니다
    var frames = document.querySelector("[data-frames]");
    if (frames && window.matchMedia("(min-width: 961px)").matches) {
      var shots = [
        ["images/works/gy-005.jpg", "밑동"],
        ["images/works/gy-002.jpg", "겨울 잔가지"],
        ["images/works/gy-006.jpg", "뿌리와 이끼"],
        ["images/works/gy-001-b.jpg", "철사를 건 가지"],
        ["images/works/gy-003-b.jpg", "새잎"],
        ["images/works/gy-002-b.jpg", "줄기"]
      ];
      var clip = frames.querySelector(".clip");
      clip.innerHTML = shots.map(function (x) { return '<img src="' + x[0] + '" alt="" decoding="async">'; }).join("");
      var imgs = clip.querySelectorAll("img");
      var cap = frames.querySelector("[data-frame-cap]");
      var num = frames.querySelector("[data-frame-n]");
      var k = 0;
      function showFrame() {
        imgs.forEach(function (im, j) { im.classList.toggle("is-on", j === k); });
        cap.textContent = shots[k][1];
        num.textContent = pad(k + 1) + " / " + pad(shots.length);
      }
      showFrame();
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setInterval(function () {
          if (document.hidden) return;
          k = (k + 1) % shots.length;
          showFrame();
        }, 7000);
      }
    }

    var sel = document.querySelector("[data-selected]");
    if (sel) sel.innerHTML = D.works.slice(0, 4).map(function (w) { return workCard(w); }).join("");

    var av = document.querySelector("[data-available]");
    if (av) {
      av.innerHTML = D.works
        .filter(function (w) { return w.sale && w.sale.state === "AVAILABLE"; })
        .slice(0, 3)
        .map(function (w) { return workCard(w, { sale: true, state: true, ratio: "r-3x4" }); })
        .join("");
    }

    var lg = document.querySelector("[data-log]");
    if (lg) {
      lg.innerHTML = D.journal.slice(0, 3).map(function (j, i) {
        return (
          '<li data-age="' + i + '"><a href="journal.html#' + esc(j.id) + '">' +
          '<span class="log__date">' + esc(j.date) + "</span>" +
          '<span class="log__what">' + esc(j.tree) + " / " + esc(j.act) +
          "<small>" + esc(j.treeKo) + " · " + esc(j.actKo) + "</small></span>" +
          '<span class="log__line">' + esc(j.body[1] || j.body[0]) + "</span></a></li>"
        );
      }).join("");
    }

    var ig = document.querySelector("[data-insta]");
    if (ig) {
      var html = "";
      for (var k = 1; k <= 6; k++) {
        html += '<a href="' + esc(S.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram 게시물 ' + k + '">' +
          plate("images/instagram/" + k + ".jpg", "IG " + pad(k), "r-1x1", "Instagram 게시물 " + k) + "</a>";
      }
      ig.innerHTML = html;
    }
    document.querySelectorAll("[data-ig-link]").forEach(function (a) { a.href = S.instagram; });
  }

  /* ---------- WORKS ---------- */

  if (page === "works") {
    var list = document.querySelector("[data-archive]");
    list.innerHTML = D.works.map(function (w) { return workCard(w, { state: true }); }).join("");
    document.querySelector("[data-count]").textContent = pad(D.works.length) + " WORKS";

    // 거르기: 해당하지 않는 작품은 자리를 지킨 채 옅어집니다
    var btns = document.querySelectorAll(".filters button");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filter");
        btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var shown = 0;
        list.querySelectorAll(".work").forEach(function (el) {
          var on = f === "all" || el.getAttribute("data-status") === f;
          el.classList.toggle("is-dim", !on);
          if (on) shown++;
          if (on) el.removeAttribute("tabindex"); else el.setAttribute("tabindex", "-1");
        });
        document.querySelector("[data-count]").textContent =
          (f === "all" ? pad(D.works.length) : pad(shown) + " / " + pad(D.works.length)) + " WORKS";
      });
    });
  }

  /* ---------- 작품 상세 ---------- */

  if (page === "work") {
    var id = new URLSearchParams(location.search).get("id") || D.works[0].id;
    var w = byId(id) || D.works[0];
    var idx = D.works.indexOf(w);
    var prev = D.works[(idx - 1 + D.works.length) % D.works.length];
    var next = D.works[(idx + 1) % D.works.length];
    document.title = w.title + " — GUIYEON";

    var logs = w.log || [];
    var years = [];
    logs.forEach(function (l) {
      var y = l.date.slice(0, 4);
      if (years.indexOf(y) < 0) years.push(y);
    });
    years.sort();

    var saleHtml = "";
    if (w.sale) {
      var st = w.sale.state;
      saleHtml =
        '<div class="detail-actions">' +
        (st === "AVAILABLE"
          ? '<a class="btn" href="inquiry.html?id=' + esc(w.id) + '">PURCHASE · 구매 문의</a>'
          : '<span class="btn" aria-disabled="true">' + stateLabel(st) + "</span>") +
        '<a class="textlink" href="available.html">Available works</a></div>';
    }

    var el = document.querySelector("[data-detail]");
    var grid = el.querySelector("[data-detail-grid]");
    var plateCol = el.querySelector("[data-plate]");
    var fig = el.querySelector("#detail-plate");
    var figImg = fig.querySelector("img");

    // 사진 자리: 목록에서 넘어올 때 이미 사진이 들어와 있으면 그대로 이어서 씁니다
    fig.querySelector(".plate__label").innerHTML = "<b>" + esc(w.id) + "</b>" + esc(w.image);
    figImg.alt = w.title + " — " + w.species;
    if (figImg.getAttribute("src") !== w.image) figImg.src = w.image;
    try { sessionStorage.removeItem("gy-vt-img"); } catch (e) {}

    el.querySelector("[data-info]").innerHTML =
      '<p class="field pos">' + esc(w.id) + " · " + pad(idx + 1) + " / " + pad(D.works.length) + "</p>" +
      '<p class="field" style="margin:0">' + esc(w.speciesEn) + "</p>" +
      '<h1 class="title-lg">' + esc(w.title) + "</h1>" +
      '<dl class="facts">' +
      "<div><dt>수종</dt><dd>" + esc(w.species) + " · " + esc(w.speciesEn) + "</dd></div>" +
      "<div><dt>함께한 해</dt><dd>" + esc(w.since) + " – </dd></div>" +
      "<div><dt>제작 연도</dt><dd>" + esc(w.year) + "</dd></div>" +
      "<div><dt>크기</dt><dd>" + esc(w.size) + "</dd></div>" +
      "<div><dt>상태</dt><dd>" + esc(stateLabel(w.sale && w.status === "Available" ? w.sale.state : w.status)) + "</dd></div>" +
      (w.sale ? "<div><dt>관리</dt><dd>" + esc(w.sale.care) + "</dd></div>" +
        "<div><dt>가격</dt><dd>" + txt(w.sale.price) + "</dd></div>" : "") +
      "</dl>" +
      '<div class="prose"><p>' + esc(w.summary) + "</p><p>" + esc(w.intent) + "</p></div>" +
      saleHtml +
      (logs.length ?
        '<p class="field" style="margin:64px 0 0">관찰 기록</p>' +
        '<div class="years" role="group" aria-label="연도별 기록">' +
        years.map(function (y) {
          return '<button type="button" data-year="' + y + '" aria-pressed="false">' + y + "</button>";
        }).join("") +
        "</div>" +
        '<ol class="observe">' +
        logs.map(function (l, i) {
          return '<li data-age="' + Math.min(i, 3) + '" data-year="' + esc(l.date).slice(0, 4) + '"><time>' +
            esc(l.date) + "</time><span>" + esc(l.text) + "</span></li>";
        }).join("") +
        "</ol>" : "");

    grid.insertAdjacentHTML("beforeend",
      '<nav class="pager" aria-label="다른 작품" style="grid-column:1 / -1">' +
      '<a href="work.html?id=' + esc(prev.id) + '">이전 작품<b>' + esc(prev.title) + "</b></a>" +
      '<a href="work.html?id=' + esc(next.id) + '" style="text-align:right">다음 작품<b>' + esc(next.title) + "</b></a>" +
      "</nav>");

    // 감상 모드: 대표 사진과 추가 사진(gallery)을 크게 넘겨 봅니다
    var shots = [w.image].concat(w.gallery || []).filter(Boolean);
    var current = 0;
    plateCol.querySelector(".detail-plate-btn").addEventListener("click", function () {
      openViewer(shots, current, w.title);
    });

    // 연도 띠: 해를 고르면 그해 기록이 진해지고, 그해 사진(gy-001-2023.jpg)이 있으면 바뀝니다
    var yBtns = el.querySelectorAll(".years button");
    yBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var y = b.getAttribute("data-year");
        var again = b.getAttribute("aria-pressed") === "true";
        yBtns.forEach(function (x) { x.setAttribute("aria-pressed", !again && x === b ? "true" : "false"); });
        el.querySelectorAll(".observe li").forEach(function (li) {
          li.classList.toggle("is-on", !again && li.getAttribute("data-year") === y);
        });
        var src = again ? w.image : w.image.replace(/(\.\w+)$/, "-" + y + "$1");
        var probe = new Image();
        probe.onload = function () {
          figImg.classList.remove("is-loaded");
          setTimeout(function () {
            figImg.src = src;
            figImg.classList.add("is-loaded");
          }, 300);
        };
        probe.src = src;
      });
    });
  }

  /* ---------- AVAILABLE ---------- */

  if (page === "available") {
    var items = D.works.filter(function (w) { return w.sale; });
    var order = { AVAILABLE: 0, RESERVED: 1, SOLD: 2 };
    items.sort(function (a, b) { return order[a.sale.state] - order[b.sale.state]; });
    document.querySelector("[data-count]").textContent =
      pad(items.filter(function (w) { return w.sale.state === "AVAILABLE"; }).length) + " AVAILABLE";

    document.querySelector("[data-pieces]").innerHTML = items.map(function (w) {
      var st = w.sale.state;
      return (
        '<article class="piece"><div class="grid">' +
        '<a class="plate-col" href="work.html?id=' + esc(w.id) + '" data-cursor="VIEW">' + plate(w.image, w.id, "r-4x5", w.title) + "</a>" +
        '<div class="info-col">' +
        '<p class="state state--' + st.toLowerCase() + '">' + stateLabel(st) + "</p>" +
        '<h2 class="title-md">' + esc(w.title) + "</h2>" +
        '<dl class="facts">' +
        "<div><dt>등록번호</dt><dd>" + esc(w.id) + "</dd></div>" +
        "<div><dt>수종</dt><dd>" + esc(w.species) + " · " + esc(w.speciesEn) + "</dd></div>" +
        "<div><dt>크기</dt><dd>" + esc(w.size) + "</dd></div>" +
        "<div><dt>관리</dt><dd>" + esc(w.sale.care) + "</dd></div>" +
        '<div><dt>가격</dt><dd class="price">' + txt(w.sale.price) + "</dd></div>" +
        "</dl>" +
        '<div class="prose"><p>' + esc(w.summary) + "</p></div>" +
        (st === "AVAILABLE"
          ? '<a class="btn" href="inquiry.html?id=' + esc(w.id) + '">PURCHASE · 구매 문의</a>'
          : '<span class="btn" aria-disabled="true">' + (st === "RESERVED" ? "RESERVED · 예약 중" : "SOLD OUT · 판매 완료") + "</span>") +
        "</div></div></article>"
      );
    }).join("");
  }

  /* ---------- 구매 신청 ---------- */

  if (page === "inquiry") {
    var qid = new URLSearchParams(location.search).get("id");
    var iw = byId(qid);
    var box = document.querySelector("[data-inquiry]");
    var form = document.querySelector("form");

    if (!iw || !iw.sale || iw.sale.state !== "AVAILABLE") {
      box.innerHTML = '<p class="title-md">' + (iw ? esc(iw.title) + "은 지금 구매 신청을 받지 않습니다." : "작품을 먼저 골라 주십시오.") + "</p>" +
        '<p class="small" style="margin-top:16px">구매 가능한 작품은 AVAILABLE에서 확인할 수 있습니다.</p>' +
        '<p><a class="textlink" href="available.html">Available works</a></p>';
      form.remove();
    } else {
      box.innerHTML =
        plate(iw.image, iw.id, "r-4x5", iw.title) +
        '<p class="field" style="margin:20px 0 0">' + esc(iw.id) + " · " + esc(iw.speciesEn) + "</p>" +
        '<p class="title-md" style="margin:4px 0 12px">' + esc(iw.title) + "</p>" +
        '<p class="small" style="margin:0">' + esc(iw.size) + " · " + txt(iw.sale.price) + "</p>";

      form.querySelector("[name=work]").value = iw.id + " " + iw.title;

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        form.querySelectorAll(".err").forEach(function (n) { n.remove(); });
        form.querySelectorAll("[aria-invalid]").forEach(function (n) { n.removeAttribute("aria-invalid"); });

        function need(name, msg, test) {
          var input = form.querySelector("[name=" + name + "]");
          var v = input.value.trim();
          if (!v || (test && !test(v))) {
            ok = false;
            input.setAttribute("aria-invalid", "true");
            var p = document.createElement("p");
            p.className = "err";
            p.id = name + "-err";
            p.textContent = msg;
            input.setAttribute("aria-describedby", p.id);
            input.parentNode.appendChild(p);
          }
        }
        need("name", "받으실 분의 이름을 적어 주십시오.");
        need("phone", "입금 확인 연락을 드릴 번호가 필요합니다. 숫자만 적어도 됩니다.", function (v) { return /[0-9]{9,}/.test(v.replace(/\D/g, "")); });
        var how = form.querySelector("[name=how]:checked");
        if (how && how.value === "배송") need("address", "배송 받으실 주소를 적어 주십시오.");

        if (!ok) {
          var first = form.querySelector("[aria-invalid=true]");
          if (first) first.focus();
          return;
        }

        var f = new FormData(form);
        var body = [
          "작품: " + f.get("work"),
          "이름: " + f.get("name"),
          "연락처: " + f.get("phone"),
          "수령 방법: " + f.get("how"),
          "주소: " + (f.get("address") || "-"),
          "남기실 말: " + (f.get("note") || "-")
        ].join("\n");

        document.querySelector("[data-bank]").innerHTML =
          '<div><dt>은행</dt><dd>' + txt(S.bank.name) + "</dd></div>" +
          '<div><dt>계좌</dt><dd>' + txt(S.bank.account) + "</dd></div>" +
          '<div><dt>예금주</dt><dd>' + txt(S.bank.holder) + "</dd></div>" +
          '<div><dt>금액</dt><dd>' + txt(iw.sale.price) + "</dd></div>";

        var mail = document.querySelector("[data-mail]");
        mail.href = "mailto:" + S.email + "?subject=" + encodeURIComponent("[구매 신청] " + iw.id + " " + iw.title) +
          "&body=" + encodeURIComponent(body);
        var done = document.querySelector(".done");
        var submit = form.querySelector("[type=submit]");
        var status = form.querySelector("[data-status]");

        function finish(viaSheet) {
          form.hidden = true;
          done.querySelector("[data-done-sheet]").hidden = !viaSheet;
          done.querySelector("[data-done-mail]").hidden = viaSheet;
          done.classList.add("is-shown");
          done.querySelector("h2").focus();
          if (!viaSheet) location.href = mail.href;
        }

        // 구글 시트 주소가 있으면 시트로 보내고, 없으면 메일 앱을 엽니다
        if (!S.inquiryEndpoint) { finish(false); return; }
        submit.disabled = true;
        submit.textContent = "보내는 중";
        status.textContent = "";
        var data = new URLSearchParams();
        ["work", "name", "phone", "how", "address", "note", "website"].forEach(function (k) { data.append(k, f.get(k) || ""); });
        data.append("page", location.href);
        fetch(S.inquiryEndpoint, { method: "POST", body: data })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (!res || !res.ok) throw new Error(res && res.error);
            finish(true);
          })
          .catch(function () {
            submit.disabled = false;
            submit.textContent = "다시 보내기";
            status.innerHTML = '신청서를 보내지 못했습니다. 잠시 뒤 다시 보내 주시거나, <a href="' + esc(mail.href) +
              '" style="text-decoration:underline;text-underline-offset:4px">메일로 신청해 주십시오</a>.';
          });
      });
    }
  }

  /* ---------- JOURNAL ---------- */

  if (page === "journal") {
    document.querySelector("[data-entries]").innerHTML = D.journal.map(function (j, i) {
      return (
        '<article class="entry" id="' + esc(j.id) + '" data-age="' + Math.min(i, 3) + '"><div class="grid">' +
        '<div class="meta-col"><p class="field" style="margin:0">' + esc(j.date) + "</p>" +
        '<h2 class="title-md" style="margin-top:6px">' + esc(j.tree) + " / " + esc(j.act) + "</h2>" +
        '<p class="small" style="margin:4px 0 0">' + esc(j.treeKo) + " · " + esc(j.actKo) +
        (j.work ? ' · <a href="work.html?id=' + esc(j.work) + '" style="text-decoration:underline;text-underline-offset:4px">' + esc(j.work) + "</a>" : "") +
        "</p></div>" +
        '<div class="plate-col">' + plate(j.image, j.date, "r-4x5", j.treeKo + " " + j.actKo) + "</div>" +
        '<div class="text-col prose">' + j.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
        "</div></article>"
      );
    }).join("");
  }

  /* ---------- CONTACT ---------- */

  if (page === "contact") {
    document.querySelector("[data-ig]").href = S.instagram;
    document.querySelector("[data-ig-handle]").textContent = S.instagramHandle;
    document.querySelector("[data-store]").href = S.smartstore;
    document.querySelector("[data-mail]").href = "mailto:" + S.email;
    document.querySelector("[data-mail-addr]").textContent = S.email;
  }

  wirePlates();
  motion();
  }

  /* ---------- 감상 모드 ---------- */

  var viewer;
  function openViewer(list, start, title) {
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function esc(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }
    if (!viewer) {
      viewer = document.createElement("dialog");
      viewer.className = "viewer";
      viewer.setAttribute("aria-label", "작품 사진");
      viewer.innerHTML =
        '<div class="viewer__bar viewer__bar--top"><span class="field" data-v-title></span>' +
        '<button type="button" data-v-close>CLOSE</button></div>' +
        '<div class="viewer__stage" data-v-stage></div>' +
        '<div class="viewer__bar viewer__bar--bottom"><button type="button" data-v-prev>PREV</button>' +
        '<span class="field" data-v-count></span><button type="button" data-v-next>NEXT</button></div>';
      document.body.appendChild(viewer);
      viewer.querySelector("[data-v-close]").addEventListener("click", function () { viewer.close(); });
      viewer.addEventListener("click", function (e) { if (e.target === viewer || e.target.hasAttribute("data-v-stage")) viewer.close(); });
      viewer.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") viewer.go(1);
        if (e.key === "ArrowLeft") viewer.go(-1);
      });
      viewer.querySelector("[data-v-prev]").addEventListener("click", function () { viewer.go(-1); });
      viewer.querySelector("[data-v-next]").addEventListener("click", function () { viewer.go(1); });
      // 휴대폰: 좌우로 밀어서 넘기기
      var sx = null;
      viewer.addEventListener("pointerdown", function (e) { sx = e.clientX; });
      viewer.addEventListener("pointerup", function (e) {
        if (sx === null) return;
        var dx = e.clientX - sx; sx = null;
        if (Math.abs(dx) > 50) viewer.go(dx < 0 ? 1 : -1);
      });
    }
    var i = start || 0;
    function show(first) {
      var stage = viewer.querySelector("[data-v-stage]");
      var src = list[i];
      var img = new Image();
      img.alt = title + " " + (i + 1);
      img.onload = function () {
        var old = stage.querySelector("img");
        if (old && !first) {
          old.classList.add("is-swapping");
          setTimeout(function () { stage.innerHTML = ""; img.classList.add("is-swapping"); stage.appendChild(img); requestAnimationFrame(function () { requestAnimationFrame(function () { img.classList.remove("is-swapping"); }); }); }, 300);
        } else { stage.innerHTML = ""; stage.appendChild(img); }
      };
      img.onerror = function () {
        stage.innerHTML = '<p class="viewer__empty">사진 준비 중<br>' + esc(src) + "</p>";
      };
      img.src = src;
      viewer.querySelector("[data-v-count]").textContent = pad(i + 1) + " / " + pad(list.length);
      viewer.querySelector("[data-v-prev]").disabled = i === 0;
      viewer.querySelector("[data-v-next]").disabled = i === list.length - 1;
    }
    viewer.go = function (d) {
      var n = i + d;
      if (n < 0 || n >= list.length) return;
      i = n; show(false);
    };
    viewer.querySelector("[data-v-title]").textContent = title;
    show(true);
    viewer.showModal();
  }

  /* ---------- 움직임: 머리, 커서, 등장, 깊이, 전환 ---------- */

  function motion() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // 머리: 내려가면 숨고, 올리면 나타납니다.
    // 휴대폰은 주소창이 줄고 늘 때와 화면 끝에서 튕길 때 스크롤 값이 조금씩 흔들리므로,
    // 한 방향으로 충분히 움직였을 때만 바꿉니다 (내려갈 때 80px, 올라올 때 40px).
    var head = document.querySelector(".site-head");
    var lastY = Math.max(0, window.scrollY);
    var travel = 0;
    var scrolled = null, hidden = false, queued = false;
    function setScrolled(v) { if (v !== scrolled) { scrolled = v; head.classList.toggle("is-scrolled", v); } }
    function setHidden(v) { if (v !== hidden) { hidden = v; head.classList.toggle("is-hidden", v); } }
    function onScroll() {
      queued = false;
      if (!head || head.classList.contains("is-open")) return;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var y = Math.min(Math.max(0, window.scrollY), Math.max(0, max));
      var d = y - lastY;
      lastY = y;
      setScrolled(y > 40);
      if (y < 120) { travel = 0; setHidden(false); return; }
      if (d === 0) return;
      if ((d > 0 && travel < 0) || (d < 0 && travel > 0)) travel = 0;
      travel += d;
      if (travel > 80) setHidden(true);
      else if (travel < -40) setHidden(false);
    }
    window.addEventListener("scroll", function () {
      if (!queued) { queued = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    // 페이지 전환: 누른 작품 사진이 상세 페이지 사진으로 이어집니다
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="work.html"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var p = a.querySelector(".plate");
      if (!p) return;
      document.querySelectorAll("[style*='work-plate']").forEach(function (n) { if (n !== p) n.style.viewTransitionName = ""; });
      p.style.viewTransitionName = "work-plate";
      var im = p.querySelector("img.is-loaded");
      try { if (im) sessionStorage.setItem("gy-vt-img", im.getAttribute("src")); else sessionStorage.removeItem("gy-vt-img"); } catch (err) {}
    });

    if (reduce) return;

    // 등장: 사진은 아래에서 위로 걷히고, 글은 천천히 떠오릅니다
    var textSel = ".work__cap, .lede p, .band-head, .log li, .chapter, .entry .meta-col, .entry .text-col, .piece .info-col, .page-head .title-lg, .page-head .small, .artist .text-col, .philosophy .register, .steps li, .channels li, .filters";
    var plateSel = ".selected .plate, .archive .plate, .avail-row .plate, .artist .plate, .piece .plate, .entry .plate, .insta .plate, .about-open .plate, .philosophy__plate, .pair .plate";
    var targets = [];
    document.querySelectorAll(textSel).forEach(function (n) { n.classList.add("reveal"); targets.push(n); });
    document.querySelectorAll(plateSel).forEach(function (n) { n.classList.add("reveal"); targets.push(n); });
    if ("IntersectionObserver" in window) {
      var batch = 0, timer;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          en.target.style.transitionDelay = Math.min(batch++, 5) * 90 + "ms";
          en.target.classList.add("is-in");
        });
        clearTimeout(timer);
        timer = setTimeout(function () { batch = 0; }, 120);
      }, { rootMargin: "0px 0px -8% 0px" });
      targets.forEach(function (n) { io.observe(n); });
    } else {
      targets.forEach(function (n) { n.classList.add("is-in"); });
    }

    // 깊이: 큰 사진은 글보다 조금 느리게 움직입니다
    var deep = document.querySelectorAll(".selected .plate, .artist .plate, .piece .plate, .entry .plate, .about-open .plate, .philosophy__plate, .pair .plate");
    deep.forEach(function (n) { n.classList.add("parallax"); });
    if (deep.length && window.innerWidth > 720) {
      var ticking = false;
      function drift() {
        var vh = window.innerHeight;
        deep.forEach(function (n) {
          var r = n.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          var t = (r.top + r.height / 2 - vh / 2) / vh;
          var img = n.querySelector("img");
          if (img) img.style.transform = "translate3d(0," + (t * -5).toFixed(2) + "%,0)";
        });
        ticking = false;
      }
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; requestAnimationFrame(drift); }
      }, { passive: true });
      drift();
    }

    // 커서: 사진 위에서는 VIEW 글자가 따라옵니다
    if (fine) {
      document.documentElement.classList.add("has-cursor");
      var cur = document.createElement("div");
      cur.className = "cursor";
      cur.setAttribute("aria-hidden", "true");
      cur.innerHTML = "<span></span>";
      document.body.appendChild(cur);
      var label = cur.querySelector("span");
      var tx = -200, ty = -200, cx = tx, cy = ty, running = false;
      function loop() {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        cur.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
        if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) requestAnimationFrame(loop); else running = false;
      }
      document.addEventListener("pointermove", function (e) {
        tx = e.clientX; ty = e.clientY;
        var t = e.target.closest && e.target.closest("[data-cursor]");
        if (t) { label.textContent = t.getAttribute("data-cursor"); cur.classList.add("is-on"); }
        else cur.classList.remove("is-on");
        if (!running) { running = true; requestAnimationFrame(loop); }
      }, { passive: true });
      document.addEventListener("pointerleave", function () { cur.classList.remove("is-on"); });
    }
  }
})();
