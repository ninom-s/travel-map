// ======================================================================
// 31. 検索  (31-search.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 検索（国名・都市名。旅した場所と、世界197か国865都市から探す） ----
(function () {
    // 検索の部品：ボタン・箱・入力欄・結果リスト・閉じるボタン
    const btn = document.getElementById("srbtn"), box = document.getElementById("srbox"), q = document.getElementById("srq"), ul = document.getElementById("srl"), xb = document.getElementById("srx");
    if (!btn || !box)
        return;
    // esc＝HTML 用の文字置き換え
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    // norm＝検索用に文字をそろえる（全角半角・大文字小文字・カタカナ→ひらがな）
    const norm = t => String(t).normalize("NFKC").toLowerCase().replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 96)).replace(/[・･\s\-_.,、。()（）]/g, "");
    // TG＝旅コード→旅のタブ名
    const TG = { eu: "sg", af: "fu", hi: "mina", ko: "mina", ld: "mina", th: "th", cn: "cn" };
    // VIS＝旅した場所の検索候補。seen＝重複防止
    const VIS = [], seen = new Set();
    // 旅の寄港地を候補に入れる
    TRIPS.forEach(t => (t.stops || []).forEach(s => {
        if (!s.name || !P[s.k] || seen.has(s.k))
            return;
        seen.add(s.k);
        VIS.push({ type: "visit", k: s.k, trip: t.key, name: s.name, n: norm(s.name), sub: s.d || "" });
    }));
    // RL＝rldata.js の中身。ldErr＝読み込み失敗
    let RL = null, ldErr = false;
    // ENT＝国と都市の候補を作る
    const ENT = () => {
        const a = VIS.slice();
        if (RL) {
            const vn = new Set(VIS.map(v => v.n));
            RL.forEach(c => {
                a.push({ type: "country", iso: c[0], flag: c[1], name: c[2], n: norm(c[2]), sub: c[3].length + "都市" });
                c[3].forEach(x => {
                    if (vn.has(norm(x[0])))
                        return;
                    a.push({ type: "city", iso: c[0], flag: c[1], name: x[0], n: norm(x[0]), sub: c[2] });
                });
            });
        }
        return a;
    };
    // ALL＝全候補のキャッシュ
    let ALL = null;
    // ord＝種類の並び順（旅した場所→国→都市）
    const ord = { visit: 0, country: 1, city: 2 };
    // load＝rldata.js を読み込み、候補を作る
    const load = () => {
        if (RL || !window.__rlLoad)
            return;
        window.__rlLoad().then(D => {
            RL = D;
            ALL = null;
            if (!box.hidden)
                render();
        }, () => {
            ldErr = true;
            if (!box.hidden)
                render();
        });
    };
    // li＝結果1行の HTML
    const li = e => {
        const ic = e.type === "visit" ? '<span class="pin" aria-hidden="true">📍</span>' : `<img src="flags/${e.flag}.svg" alt="" width="24" height="18" loading="lazy">`;
        return `<li><button type="button" data-t="${e.type}" data-i="${esc(e.type === "visit" ? e.k : e.type === "country" ? e.iso : e.iso + "|" + e.name)}">${ic}<b>${esc(e.name)}</b><small>${e.type === "visit" ? "旅した場所" + (e.sub ? "・" + esc(e.sub) : "") : e.type === "country" ? "国・" + esc(e.sub) : esc(e.sub)}</small></button></li>`;
    };
    let cur = null; // 国を選んだあと、その国の都市を出しているときの国
    const render = () => {
        const v = norm(q.value);
        ALL = ALL || ENT();
        if (cur) {
            const c = RL && RL.find(z => z[0] === cur);
            if (c && v === norm(c[2])) {
                ul.innerHTML = `<li class="srh">${esc(c[2])}の都市・見どころ（${c[3].length}か所）</li>` + c[3].map(x => li({ type: "city", iso: c[0], flag: c[1], name: x[0], sub: x[3] === "定" ? "定番" : "マニアック" })).join("");
                return;
            }
            cur = null;
        }
        if (!v) {
            ul.innerHTML = `<li class="srn">国名か都市名を入れてね（ひらがなでもOK）。${RL ? "世界197か国・865都市と、旅した場所から探せる。" : ldErr ? "世界の国・都市のデータを読み込めなかったので、いまは旅した場所だけ。" : "世界の国・都市のデータを読み込み中…"}</li>`;
            return;
        }
        const hit = [];
        ALL.forEach(e => {
            const i = e.n.indexOf(v);
            if (i < 0)
                return;
            hit.push([i === 0 ? 0 : 1, ord[e.type], e.n.length, e]);
        });
        hit.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
        ul.innerHTML = hit.length ? hit.slice(0, 40).map(h => li(h[3])).join("") + (hit.length > 40 ? `<li class="srn">ほか${hit.length - 40}件。もう少し絞ってね</li>` : "") : `<li class="srn">「${esc(q.value)}」は見つからなかった。${RL ? "都市は主要なところだけ入っているので、その国の名前で探してみて。" : ""}</li>`;
    };
    // open＝検索箱を開いて入力欄に合わせる
    const open = () => {
        box.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        const c = document.getElementById("rlcard");
        if (c)
            c.hidden = true;
        load();
        render();
        setTimeout(() => q.focus(), 0);
    };
    // close＝検索箱を閉じて表示をもとに戻す
    const close = () => {
        box.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        cur = null;
        q.blur();
    };
    // 虫めがねボタンで開閉
    btn.addEventListener("click", () => box.hidden ? open() : close());
    // × ボタンで、国から全体へ戻る／閉じる
    xb.addEventListener("click", () => {
        close();
        btn.focus();
    });
    // 入力するたびに検索結果を更新
    q.addEventListener("input", () => {
        cur = null;
        render();
    });
    // キー操作（↑↓で選択、Enter で決定、Esc で閉じる）
    box.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            close();
            btn.focus();
            return;
        }
        const bs = [...ul.querySelectorAll("button")];
        if (e.key === "Enter" && e.target === q && bs[0]) {
            e.preventDefault();
            bs[0].click();
            return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            const i = bs.indexOf(document.activeElement);
            const n = e.key === "ArrowDown" ? i + 1 : i - 1;
            if (e.target === q && e.key === "ArrowDown" && bs[0]) {
                e.preventDefault();
                bs[0].focus();
                return;
            }
            if (i >= 0) {
                e.preventDefault();
                if (n < 0)
                    q.focus();
                else if (bs[n])
                    bs[n].focus();
            }
        }
    });
    // 結果を押したとき：旅した場所なら地図でその場所へ、国や都市ならルーレットと同じ地球儀の移動で寄る
    ul.addEventListener("click", async (e) => {
        const b = e.target.closest("button");
        if (!b)
            return;
        const t = b.dataset.t, id = b.dataset.i;
        if (t === "country") {
            cur = id;
            const c = RL.find(z => z[0] === id);
            q.value = c[2];
            render();
            window.__rlGo(id);
            return;
        }
        if (t === "city") {
            const [iso, nm] = id.split("|");
            close();
            await window.__rlGo(iso, nm);
            return;
        }
        const v = VIS.find(z => z.k === id);
        close();
        if (document.body.classList.contains("off-" + v.trip) && window.__selTab && TG[v.trip]) {
            window.__selTab(TG[v.trip]);
            await new Promise(r => setTimeout(r, 1200));
        }
        const K = Math.min(KMAX(), 26);
        if (window.__globeOn)
            await window.__exitGlobe(P[v.k], K);
        else
            window.__zoomTo(v.k, K);
    });
    if (window.requestIdleCallback)
        window.addEventListener("load", () => requestIdleCallback(load, { timeout: 9000 }));
})();
