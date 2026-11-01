// ======================================================================
// 15. 解説パネル  (15-detail-panel.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// selection panel
// selEl＝いま選ばれているイラスト／点
let selEl = null;
// esc＝HTML に入れる文字を安全にする（<, &, " の置き換え）
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// phList＝イラストの写真を配列にそろえる（photo 単数にも photos 複数にも対応）
const phList = il => il.photos || (il.photo ? [il.photo] : []);
// notesOf＝そのイラストに紐づく note の記事を返す（名前で指定があればそれ、なければ地点コードで探す）
function notesOf(il) {
    const by = NOTE_ARTICLES.filter(a => (a.names || []).includes(il.name));
    if (by.length)
        return by;
    return NOTE_ARTICLES.filter(a => (!a.trip || a.trip === il.trip) && (a.keys || []).includes(il.k));
}
// illURL＝イラストを指す共有用 URL（#ill=名前）
const illURL = il => location.href.split("#")[0] + "#ill=" + encodeURIComponent(il.name);
// noteHTML＝「ブログを読む」リンクの HTML
function noteHTML(il) {
    const ns = notesOf(il);
    if (!ns.length)
        return "";
    return `<div class="notelinks">${ns.map(a => `<a class="notelink" href="${esc(a.url)}" target="_blank" rel="noopener">📖 ブログを読む<small>${esc(a.title)}</small></a>`).join("")}</div>`;
}
// 「リンクをコピー」ボタンのクリック処理：そのイラストの共有 URL をクリップボードに入れる（使えないときは表示して手でコピーしてもらう）
document.addEventListener("click", e => {
    const b = e.target.closest(".copylink");
    if (!b)
        return;
    const il = ILLS.find(x => x.name === b.dataset.illName);
    if (!il)
        return;
    const u = illURL(il);
    const done = () => {
        const t = b.textContent;
        b.textContent = "✓ コピーした";
        setTimeout(() => {
            b.textContent = t;
        }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(u).then(done, () => prompt("このリンクをコピーしてね", u));
    else
        prompt("このリンクをコピーしてね", u);
});
// phHTML＝写真の並びの HTML（読み込みは遅延）
function phHTML(il) {
    const ph = phList(il);
    if (!ph.length)
        return "";
    const n = ph.length;
    return `<div class="phwrap${n > 1 ? " multi" : ""}"><div class="phs" tabindex="0" aria-label="${esc(il.name)}の写真${n > 1 ? "（" + n + "枚。横にスワイプで切り替え）" : ""}">${ph.map((u, i) => `<img class="ph" decoding="async" src="${u}" alt="${esc(il.name)}の写真${n > 1 ? " " + (i + 1) + "/" + n : ""}">`).join("")}</div>` +
        (n > 1 ? `<span class="phn" aria-hidden="true"><b>1</b>/${n}</span><button type="button" class="pha prev" aria-label="前の写真" hidden>‹</button><button type="button" class="pha next" aria-label="次の写真">›</button>` : "") + `</div>` +
        (n > 1 ? `<div class="dots">${ph.map((_, i) => `<button type="button" class="dot${i ? "" : " on"}" data-i="${i}" aria-label="${i + 1}枚目"></button>`).join("")}</div>` : "");
}
// initPhs＝パネル内の写真を押したときの拡大表示などを設定する
function initPhs(root = panel) {
    const c = root.querySelector(".phs");
    if (!c)
        return;
    const ds = [...root.querySelectorAll(".dot")];
    if (!ds.length)
        return;
    const imgs = [...c.querySelectorAll(".ph")], n = imgs.length, nb = root.querySelector(".phn b"), pv = root.querySelector(".pha.prev"), nx = root.querySelector(".pha.next");
    const step = () => imgs.length > 1 ? imgs[1].offsetLeft - imgs[0].offsetLeft : c.clientWidth;
    const go = i => c.scrollTo({ left: step() * Math.max(0, Math.min(n - 1, i)), behavior: "smooth" });
    let cur = 0;
    const upd = () => {
        cur = Math.max(0, Math.min(n - 1, Math.round(c.scrollLeft / step())));
        ds.forEach((d, j) => d.classList.toggle("on", cur === j));
        if (nb)
            nb.textContent = cur + 1;
        if (pv)
            pv.hidden = cur === 0;
        if (nx)
            nx.hidden = cur === n - 1;
    };
    c.addEventListener("scroll", upd, { passive: true });
    ds.forEach(d => d.addEventListener("click", () => go(+d.dataset.i)));
    if (pv)
        pv.addEventListener("click", () => go(cur - 1));
    if (nx)
        nx.addEventListener("click", () => go(cur + 1));
    c.addEventListener("keydown", e => {
        if (e.key === "ArrowRight") {
            go(cur + 1);
            e.preventDefault();
        }
        if (e.key === "ArrowLeft") {
            go(cur - 1);
            e.preventDefault();
        }
    });
}
// select＝イラストや点を選び、解説パネルを開いて中身を組み立てる
function select(el) {
    if (selEl)
        selEl.classList.remove("on");
    selEl = el;
    el.classList.add("on");
    panel.classList.remove("empty");
    if (el.classList.contains("ill")) {
        const il = ILLS[+el.dataset.ill];
        const near = TRIPS.flatMap(t => t.stops).find(s => s.k === il.k);
        panel.innerHTML = `<div class="illrow"><svg class="illbig" width="80" height="80" viewBox="-22 -22 44 44" aria-hidden="true"><circle r="21" fill="var(--card)" stroke="var(--rule)"/><g transform="scale(1.45)">${ICONS[il.ic]}</g></svg>
      <div class="illtx"><div class="k"><span class="tag ${il.trip}">${TRIPNAME[il.trip] || ""}</span><h2>${esc(il.name)}</h2></div>
      <p>${esc(il.cap)}</p>${near ? `<p class="m">${esc(near.name)}（${esc(near.d)}）</p>` : ""}${noteHTML(il)}</div></div>${phHTML(il)}`;
        initPhs();
    }
    else if (el.classList.contains("ev")) {
        const ev = EVENTS[+el.dataset.ev];
        panel.innerHTML = `<div class="k"><span class="tag ${ev.trip || "eu"}">${TRIPNAME[ev.trip || "eu"]}</span><h2>${esc(ev.title)}</h2><time>${esc(ev.d)}</time></div>
      <p class="m"><span class="mode ev">✕</span>${esc(ev.where)}</p><ul class="tl">${ev.tl.map(([t, x]) => `<li><time>${esc(t)}</time><span>${esc(x)}</span></li>`).join("")}</ul>${ev.photos ? phHTML({ name: ev.title, photos: ev.photos }) : ""}`;
        if (ev.photos)
            initPhs();
    }
    else if (el.classList.contains("flg")) {
        panel.innerHTML = window.__countryHTML ? window.__countryHTML(el.dataset.c) : "";
        if (window.__countryLive)
            window.__countryLive(el.dataset.c);
    }
    else if (el.classList.contains("stop")) {
        const t = TRIPS.find(x => x.key === el.dataset.trip) || EU;
        const s = t.stops[+el.dataset.n - 1];
        panel.innerHTML = `<div class="k"><span class="tag ${t.key}">${esc(TRIPNAME[t.key])}</span><h2>${esc(s.name)}</h2><time>${esc(s.d)}</time></div>
      <p>${esc(s.note)}</p><p class="m"><span class="mode ${s.lm}">${MODEJ[s.lm]}</span>${esc(s.lt)}</p>`;
    }
    else {
        const k = el.dataset.k, w = wpInfo[k], dt = DAYT[k];
        if (dt)
            panel.innerHTML = `<div class="k"><span class="tag ${w.trip}">日帰り</span><h2>${esc(WPN[k])}</h2><time>${esc(dt.d)}</time></div>
      <p class="m"><span class="mode ${dt.m}">${MODEJ[dt.m]}</span>${esc(dt.t)}</p>`;
        else
            panel.innerHTML = `<div class="k"><span class="tag g">経由地${KNOWN.has(k) ? "" : "（推測）"}</span><h2>${esc(WPN[k])}</h2></div>
      <p class="m"><span class="mode ${w.mode}">${MODEJ[w.mode]}</span>${esc(w.from)} → ${esc(w.to)}${w.kind === "trip" ? "（日帰り）" : ""}の途中</p>`;
    }
    panel.insertAdjacentHTML("afterbegin", '<button type="button" class="pclose" aria-label="解説を閉じて地図に戻る" title="閉じる">✕</button>');
    panel.querySelector(".pclose").addEventListener("click", closePanel);
    fitPanel();
    // the panel sits between the play button and the map: bring it into view
    if (!document.body.classList.contains("isfull")) {
        const r = panel.getBoundingClientRect();
        if (r.top < 0 || r.top > innerHeight * 0.6)
            panel.scrollIntoView({ block: "start", behavior: RM() ? "auto" : "smooth" });
    }
}
// MOBILE＝スマホ幅か（パネルを下から出すかの判定）
const MOBILE = matchMedia("(max-width:760px)");
// PANEL_EMPTY＝何も選んでいないときのパネルの初期内容
const PANEL_EMPTY = panel.innerHTML;
// fitPanel＝パネルの大きさと位置を、画面幅に合わせて整える
function fitPanel() {
    const w = panel.querySelector(".phwrap"), d = panel.querySelector(".dots");
    if (!w)
        return;
    w.style.width = "";
    w.style.maxWidth = "";
    if (d)
        d.style.maxWidth = "";
    if (!document.body.classList.contains("isfull") || panel.classList.contains("empty"))
        return;
    for (let i = 0; i < 4; i++) {
        const over = panel.scrollHeight - panel.clientHeight;
        if (over <= 1)
            break;
        const ph = w.querySelector(".ph"), h = ph ? ph.getBoundingClientRect().height : 0, ww = w.getBoundingClientRect().width;
        if (!h || !ww)
            break;
        const nh = Math.max(100, h - over - 2);
        if (nh >= h)
            break;
        w.style.width = w.style.maxWidth = Math.floor(ww * nh / h) + "px";
    }
    if (d)
        d.style.maxWidth = w.style.maxWidth;
}
// ウィンドウの大きさが変わったらパネルを合わせ直す
addEventListener("resize", () => {
    clearTimeout(fitPanel.t);
    fitPanel.t = setTimeout(fitPanel, 120);
});
// closePanel＝パネルを閉じて選択を外す
function closePanel() {
    if (selEl)
        selEl.classList.remove("on");
    selEl = null;
    panel.classList.add("empty");
    panel.innerHTML = PANEL_EMPTY;
    if (!document.body.classList.contains("isfull")) {
        const st = document.getElementById("stage");
        const r = st.getBoundingClientRect();
        if (r.top < -4 || r.top > innerHeight * 0.5)
            st.scrollIntoView({ block: "start", behavior: "smooth" });
    }
}
// Esc キーでパネルを閉じる
addEventListener("keydown", e => {
    if (e.key === "Escape" && !panel.classList.contains("empty"))
        closePanel();
});
