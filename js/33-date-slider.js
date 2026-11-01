// ======================================================================
// 33. 日付スライダー  (33-date-slider.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 日付スライダー（日付を動かすと、その日どこにいたかと一言が出て、地図がそこへ寄る） ----
(() => {
    // el＝id から要素を取る
    const el = id => document.getElementById(id);
    // WD＝曜日、DAY＝1日のミリ秒
    const WD = ["日", "月", "火", "水", "木", "金", "土"], DAY = 864e5;
    // yr＝旅と月から年を決める
    const yr = (tr, m) => tr === "af" && m < 6 ? 2026 : 2025;
    // parseDays＝「1/2〜1/5」のような日付の書き方を、日付の並びにする
    const parseDays = (d, tr) => {
        const out = [];
        String(d || "").split("・").forEach(tok => {
            const ms = [...tok.matchAll(/(\d{1,2})\/(\d{1,2})/g)];
            if (!ms.length)
                return;
            const a = ms[0], b = ms[1] || a, t0 = Date.UTC(yr(tr, +a[1]), a[1] - 1, +a[2]), t1 = Date.UTC(yr(tr, +b[1]), b[1] - 1, +b[2]);
            for (let t = t0; t <= t1; t += DAY)
                out.push(t);
        });
        return out;
    };
    // TL＝旅ごとのタイムライン
    const TL = {};
    // build＝旅の日ごとに、どこにいたか・ひとこと・使った手段を並べる
    const build = tr => {
        if (TL[tr])
            return TL[tr];
        const steps = PLAYS[tr].map((s, i) => ({ s, i, days: parseDays(s.d, tr) })).filter(x => x.days.length);
        const all = steps.flatMap(x => x.days), t0 = Math.min(...all), t1 = Math.max(...all), days = [];
        let prev = null;
        for (let t = t0; t <= t1; t += DAY) {
            let best = null;
            steps.forEach(x => {
                if (!x.days.includes(t))
                    return;
                if (!best || x.days.length < best.days.length || (x.days.length === best.days.length && x.i > best.i))
                    best = x;
            });
            if (best) {
                const nth = best.days.indexOf(t) + 1;
                days.push({ t, s: best.s, nth, tot: best.days.length });
                prev = best.s;
            }
            else
                days.push({ t, s: { t: prev ? prev.t : "", n: "", end: prev ? prev.end : null }, nth: 0, tot: 0, move: true });
        }
        return TL[tr] = days;
    };
    // tr＝いまの旅
    let tr = "eu";
    // idx＝旅ごとのスライダー位置
    const idx = { eu: 0, af: 0 };
    // スライダーの部品
    const box = el("dsl"), rng = el("dslr"), card = el("dslcard"), tb = el("dslc");
    // show＝選んだ日の場所とひとことを出し、地図をそこへ動かす
    const show = (fly) => {
        const days = build(tr), i = Math.min(+rng.value, days.length - 1), d = days[i], dt = new Date(d.t);
        const ds = `${dt.getUTCFullYear()}/${dt.getUTCMonth() + 1}/${dt.getUTCDate()}（${WD[dt.getUTCDay()]}）`;
        const sub = d.move ? "移動中（記録のない日）" : d.tot > 1 ? `${d.nth}日目／${d.tot}日間の滞在` : "";
        card.innerHTML = `<div class="dd"><b>${esc(ds)}</b><span>旅の${i + 1}日目／${days.length}日</span></div><div class="pl">${esc(d.s.t || "")}${sub ? `<span style="font-weight:400;font-size:12px;color:var(--muted)">　${esc(sub)}</span>` : ""}</div>${d.s.n ? `<p>${esc(d.s.n)}</p>` : ""}`;
        idx[tr] = i;
        if (fly && d.s.end && window.__focusKey)
            window.__focusKey(d.s.end, window.__kCity());
    };
    // render＝見られる旅（ヨーロッパ・エジプト）に合わせて、旅の切り替えボタンとスライダーの範囲を整える
    const render = () => {
        const av = ["eu", "af"].filter(tripOn);
        box.hidden = !av.length;
        if (!av.length)
            return;
        if (!av.includes(tr))
            tr = av[0];
        tb.innerHTML = av.length > 1 ? av.map(k => `<button type="button" data-t="${k}" aria-pressed="${k === tr}">${esc(TRIPNAME[k])}</button>`).join("") : `<span style="font-size:12px;color:var(--muted)">${esc(TRIPNAME[tr])}</span>`;
        const days = build(tr);
        rng.max = days.length - 1;
        rng.value = Math.min(idx[tr], days.length - 1);
        show(false);
    };
    // スライダーを動かすたびに表示
    rng.addEventListener("input", () => show(true));
    // 旅の切り替え
    tb.addEventListener("click", e => {
        const b = e.target.closest("[data-t]");
        if (!b)
            return;
        tr = b.dataset.t;
        render();
        show(true);
    });
    // 外から使える：旅ごとの日付表
    window.__days = () => ({ eu: build("eu"), af: build("af") });
    (window.__onTrips = window.__onTrips || []).push(render);
    render();
})();
