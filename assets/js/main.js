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
      '<a class="work" href="work.html?id=' + esc(w.id) + '" data-status="' + esc(w.status) + '">' +
      plate(w.image, w.id, opts.ratio || "r-4x5", w.title + " — " + w.species) +
      '<div class="work__cap">' +
      '<span class="work__id">' + esc(w.id) + "</span>" +
      '<span class="work__title">' + esc(w.title) + "</span>" +
      '<span class="work__meta">' + esc(w.speciesEn) + " · " + esc(w.year) + "</span>" +
      (opts.state ? '<span class="work__state">' + esc(String(state).toUpperCase()) +
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
      '<span class="wordmark">GUIYEON</span><span class="seal" aria-hidden="true">龜蓮</span></a>' +
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
      '<div class="brand-col"><span class="wordmark">GUIYEON</span>' +
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

    var years = [];
    w.log.forEach(function (l) {
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
          : '<span class="btn" aria-disabled="true">' + st + "</span>") +
        '<a class="textlink" href="available.html">Available works</a></div>';
    }

    var el = document.querySelector("[data-detail]");
    el.innerHTML =
      '<div class="wrap grid">' +
      '<div class="plate-col" data-plate>' + plate(w.image, w.id, "", w.title + " — " + w.species) + "</div>" +
      '<div class="info-col">' +
      '<p class="field pos">' + esc(w.id) + " · " + pad(idx + 1) + " / " + pad(D.works.length) + "</p>" +
      '<p class="field" style="margin:0">' + esc(w.speciesEn) + "</p>" +
      '<h1 class="title-lg">' + esc(w.title) + "</h1>" +
      '<dl class="facts">' +
      "<div><dt>수종</dt><dd>" + esc(w.species) + " · " + esc(w.speciesEn) + "</dd></div>" +
      "<div><dt>함께한 해</dt><dd>" + esc(w.since) + " – </dd></div>" +
      "<div><dt>제작 연도</dt><dd>" + esc(w.year) + "</dd></div>" +
      "<div><dt>크기</dt><dd>" + esc(w.size) + "</dd></div>" +
      "<div><dt>상태</dt><dd>" + esc(String(w.status).toUpperCase()) + "</dd></div>" +
      (w.sale ? "<div><dt>관리</dt><dd>" + esc(w.sale.care) + "</dd></div>" +
        "<div><dt>가격</dt><dd>" + txt(w.sale.price) + "</dd></div>" : "") +
      "</dl>" +
      '<div class="prose"><p>' + esc(w.summary) + "</p><p>" + esc(w.intent) + "</p></div>" +
      saleHtml +
      '<p class="field" style="margin:64px 0 0">관찰 기록</p>' +
      '<div class="years" role="group" aria-label="연도별 기록">' +
      years.map(function (y) {
        return '<button type="button" data-year="' + y + '" aria-pressed="false">' + y + "</button>";
      }).join("") +
      "</div>" +
      '<ol class="observe">' +
      w.log.map(function (l, i) {
        return '<li data-age="' + Math.min(i, 3) + '" data-year="' + l.date.slice(0, 4) + '"><time>' +
          esc(l.date) + "</time><span>" + esc(l.text) + "</span></li>";
      }).join("") +
      "</ol></div>" +
      '<nav class="pager" aria-label="다른 작품" style="grid-column:1 / -1">' +
      '<a href="work.html?id=' + esc(prev.id) + '">이전 작품<b>' + esc(prev.title) + "</b></a>" +
      '<a href="work.html?id=' + esc(next.id) + '" style="text-align:right">다음 작품<b>' + esc(next.title) + "</b></a>" +
      "</nav></div>";

    // 연도 띠: 해를 고르면 그해 기록이 진해지고, 그해 사진(gy-001-2023.jpg)이 있으면 바뀝니다
    var plateCol = el.querySelector("[data-plate]");
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
          plateCol.innerHTML = plate(src, w.id + " · " + y, "", w.title + " " + y);
          wirePlates(plateCol);
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
        '<a class="plate-col" href="work.html?id=' + esc(w.id) + '">' + plate(w.image, w.id, "r-4x5", w.title) + "</a>" +
        '<div class="info-col">' +
        '<p class="state state--' + st.toLowerCase() + '">' + st + "</p>" +
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
          : '<span class="btn" aria-disabled="true">' + (st === "RESERVED" ? "RESERVED · 예약 중" : "SOLD · 판매 완료") + "</span>") +
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

        form.hidden = true;
        var done = document.querySelector(".done");
        done.classList.add("is-shown");
        done.querySelector("h2").focus();
        location.href = mail.href;
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
  }
})();
