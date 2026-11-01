// ======================================================================
// 34. 旅の最高記録  (34-records.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 旅の記録（最北・最南・いちばん遠い場所・長い移動などのベスト3。旅のデータから計算） ----
(() => {
    // el＝id から要素を取る。R＝地球の半径(km)
    const el = id => document.getElementById(id), R = 6371;
    // lenKm＝地点コードの並びを通る線の長さ(km)
    const lenKm = ids => {
        let d = 0;
        for (let i = 1; i < ids.length; i++) {
            const a = P[ids[i - 1]], b = P[ids[i]];
            if (!a || !b)
                return 0;
            d += d3.geoDistance(a, b) * R;
        }
        return d;
    };
    // fmt＝桁区切り、r100＝100単位に丸める
    const fmt = x => Math.round(x).toLocaleString("ja-JP"), r100 = x => Math.round(x / 100) * 100;
    // days＝日付の書き方から、滞在日数を求める
    const days = (d, tr) => {
        const out = new Set();
        String(d || "").split("・").forEach(tok => {
            const ms = [...tok.matchAll(/(\d{1,2})\/(\d{1,2})/g)];
            if (!ms.length)
                return;
            const a = ms[0], b = ms[1] || a, y = m => tr === "af" && m < 6 ? 2026 : 2025, t0 = Date.UTC(y(+a[1]), a[1] - 1, +a[2]), t1 = Date.UTC(y(+b[1]), b[1] - 1, +b[2]);
            for (let t = t0; t <= t1; t += 864e5)
                out.add(t);
        });
        return out.size;
    };
    // STAYX＝日付がない滞在の補足
    const STAYX = { TSN: { days: 365, txt: "ほぼ1年" } }; // 天津（小5）は日付がないので、ninomから聞いた「ほぼ1年」
    // lat＝緯度を「北緯○°」「南緯○°」の文字にする
    const lat = y => y >= 0 ? `北緯${y.toFixed(1)}°` : `南緯${(-y).toFixed(1)}°`;
    // top3＝key の大きい順（dir=-1 なら小さい順）に上位3つ
    const top3 = (arr, key, dir) => arr.slice().sort((a, b) => dir * (b[key] - a[key])).slice(0, 3);
    // render＝最北・最南・最も遠い場所・長い移動などのベスト3を計算し、カードにする
    const render = () => {
        const ts = TRIPS.filter(t => tripOn(t.key) && t.key !== "th"), multi = ts.length > 1, ok = new Set(ts.map(t => t.key));
        const stops = [];
        ts.forEach(t => t.stops.forEach(s => {
            const g = P[s.k];
            if (g)
                stops.push({ name: s.name, k: s.k, tr: t.key, lon: g[0], lat: g[1], dist: d3.geoDistance(P.NRT || [140.4, 35.8], g) * R, days: STAYX[s.k] ? STAYX[s.k].days : days(s.d, t.key), txt: STAYX[s.k] ? STAYX[s.k].txt : "" });
        }));
        const legs = [];
        ts.forEach(t => t.seg.forEach(sg => {
            const m = sg[0];
            if (m === "plan")
                return;
            const ids = m === "air" ? sg[2].filter(k => !/^PL\d$/.test(k)) : sg[2], km = lenKm(ids);
            if (!km)
                return;
            const a0 = ids[0], z = ids[ids.length - 1];
            let name = `${nameOf(a0)} → ${nameOf(z)}`;
            if (a0 === z) {
                let far = a0, fd = 0;
                ids.forEach(k => {
                    const dd = d3.geoDistance(P[a0], P[k]);
                    if (dd > fd) {
                        fd = dd;
                        far = k;
                    }
                });
                name = `${nameOf(a0)}発着（${nameOf(far)}まで）`;
            }
            legs.push({ m, km, tr: t.key, name, loop: a0 === z });
        }));
        const memo = {};
        ILLS.forEach(il => {
            if (!ok.has(il.trip))
                return;
            const o = memo[il.k] || (memo[il.k] = { name: nameOf(il.k), k: il.k, tr: il.trip, n: 0, ph: 0 });
            o.n++;
            o.ph += phList(il).length;
        });
        const tg = tr => multi ? `<span class="tag ${tr}" style="margin-left:6px">${esc(TRIPNAME[tr])}</span>` : "";
        const card = (h, items) => items.length ? `<div class="reccard"><h3>${h}</h3><ol>${items.map((x, i) => `<li class="r${i + 1}"${x.k ? ` data-k="${x.k}"` : ""}><span class="rk">${i + 1}</span><span class="nm">${esc(x.name)}${tg(x.tr)}</span><span class="vl">${x.v}</span></li>`).join("")}</ol></div>` : "";
        const air = legs.filter(l => l.m === "air"), gnd = legs.filter(l => l.m !== "air");
        const MJ = { train: "列車", bus: "バス", boat: "船", car: "サファリジープ", van: "ツアーのバン", taxi: "タクシー", walk: "徒歩", mix: "乗り継ぎ" };
        const cards = [
            card("いちばん北の場所", top3(stops, "lat", 1).map(x => ({ ...x, v: lat(x.lat) }))),
            card("いちばん南の場所", top3(stops, "lat", -1).map(x => ({ ...x, v: lat(x.lat) }))),
            card("日本からいちばん遠い場所", top3(stops, "dist", 1).map(x => ({ ...x, v: `日本から約${fmt(r100(x.dist))} km` }))),
            card("いちばん長く過ごした場所", top3(stops.filter(x => x.days > 0), "days", 1).map(x => ({ ...x, v: x.txt || `${x.days}日間` }))),
            card("いちばん長いフライト（1区間）", top3(air, "km", 1).map(x => ({ ...x, v: `約${fmt(r100(x.km))} km` }))),
            card("いちばん長い地上の移動（1区間）", top3(gnd, "km", 1).map(x => ({ ...x, v: `${MJ[x.m] || x.m}・約${fmt(Math.round(x.km / 10) * 10)} km${x.loop ? "（往復ぶん）" : ""}` }))),
            card("思い出（イラスト）がいちばん多い場所", top3(Object.values(memo), "n", 1).map(x => ({ ...x, v: `思い出${x.n}個${x.ph ? `・写真${x.ph}枚` : ""}` })))
        ].filter(Boolean);
        el("recgrid").innerHTML = cards.join("") || `<p class="empty">この旅は、まだ記録に入れるデータがない。</p>`;
        el("recnote").textContent = "";
    };
    // カードを押したら、その場所へ飛ぶ
    el("recgrid").addEventListener("click", e => {
        const li = e.target.closest("li[data-k]");
        if (!li)
            return;
        window.__setPage("map");
        setTimeout(() => window.__focusKey && window.__focusKey(li.dataset.k, window.__kCity()), 260);
    });
    (window.__onTrips = window.__onTrips || []).push(render);
    render();
})();
