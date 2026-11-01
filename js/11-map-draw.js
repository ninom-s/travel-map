// ======================================================================
// 11. 地図の描画  (11-map-draw.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// Arctic Circle (66°33'49" N, 2026) and the Equator
// PARS＝地図に引く特別な緯線（北極圏と赤道）
const PARS = [{ c: "arc", lat: 66.5636, name: "北極圏（北緯66°34′）" }, { c: "eq", lat: 0, name: "赤道（緯度0°）" }];
// parGeo＝緯度 lat の線を、経度 -180〜180 の折れ線として作る
const parGeo = lat => ({ type: "LineString", coordinates: d3.range(-180, 180.001, 1).map(x => [x, lat]) });
// drawBase＝土台の描画：海・陸地・緯線・国境を、いまの図法（proj）で描き直す
function drawBase() {
    if (typeof ICO !== "undefined") {
        ICO.segKey = "";
        ICO.key = "";
    }
    gMap.selectAll("*").remove();
    gMap.append("path").attr("class", "grat").attr("d", path(d3.geoGraticule().step([10, 10])()));
    if (world)
        gMap.append("g").selectAll("path").data(world).join("path")
            .attr("class", d => "land" + (EU.visited.has(d.id) ? " v" : AF.visited.has(d.id) ? " v2" : "")).attr("d", path);
    PARS.forEach(p => gMap.append("path").attr("class", "par " + p.c).attr("d", path(parGeo(p.lat))));
    // アンボセリ国立公園：サバンナの広がり（範囲と湖の位置は目安）。キリマンジャロの三角印は別レイヤー
    gMap.append("path").attr("class", "park t-af").attr("d", path(d3.geoCircle().center([37.27, -2.60]).radius(.16).precision(2)()));
    gMap.append("path").attr("class", "parklake t-af").attr("d", path(d3.geoCircle().center([37.22, -2.56]).radius(.06).precision(2)()));
    TRIPS.forEach(t => t.seg.forEach(([m, kind, ks]) => {
        gMap.append("path").attr("class", `seg ${m} ${m === "air" ? "" : kind} ${t.key}`).attr("d", path({ type: "LineString", coordinates: ks.map(k => P[k]) }));
    }));
}
// overlay items: {el, geo, kind}
let items = [];
// addItem＝一覧に1件足す。el＝DOM、geo＝座標、dx/dy＝ずらし量、anchor＝文字の揃え
function addItem(el, geo, dx, dy, anchor) {
    items.push({ el, geo, dx, dy, anchor });
}
// drawOverlay＝点・線・名前・イラストなど、旅のデータに基づく部分をすべて描き直す。
// 旅の選択やウィンドウの大きさが変わったときに呼ばれる
function drawOverlay() {
    gOver.selectAll("*").remove();
    items = [];
    // region labels (only when zoomed out)
    [["RVN", "ヨーロッパ一周 2025.1–2", "eu", 12, 4], ["NBO", "エジプト・ケニア 2025.12–2026.1", "af", 16, 26], ["HNL", "ハワイ（Mとお母さん）", "hi", 12, -12], ["SEL", "韓国（M）", "ko", -104, -10], ["ECT", "ロンドン（M）", "ld", -118, 18], ["BKK", "タイ（予定）", "th", 12, 10], ["TSN", "中国（小5）", "cn", 12, -12], ["NRT", "日本", "", 10, -10]].forEach(([k, t, c, dx, dy]) => {
        const el = gOver.append("text").attr("class", `lbl big ${c} l1`).attr("data-pr", 0).attr("data-must", 1).attr("data-d", 6).text(t).node();
        addItem(el, P[k], dx, dy, "start");
    });
    // waypoints
    Object.keys(wpInfo).forEach(k => {
        const tc = " t-" + wpInfo[k].trip;
        const g = gOver.append("g").attr("class", "wp l3 l4" + tc).attr("data-k", k).attr("tabindex", 0).attr("role", "button").attr("aria-label", WPN[k]);
        g.append("circle").attr("class", "hit").attr("r", HIT);
        g.append("circle").attr("class", "pt").attr("r", 3.4);
        addItem(g.node(), P[k], 0, 0);
        const lb = gOver.append("text").attr("class", "lbl wpn l4" + tc).attr("data-pr", 6).attr("data-d", 7).text(WPN[k]).node();
        addItem(lb, P[k], 7, 4, "start");
    });
    // transit cities
    Object.keys(TRN).forEach(k => {
        const tc = TRNT[k] ? " t-" + TRNT[k] : "";
        const g = gOver.append("g").attr("class", "tr l2 l3 l4" + tc);
        g.append("circle").attr("class", "pt").attr("r", 3.6);
        addItem(g.node(), P[k], 0, 0);
        const lb = gOver.append("text").attr("class", "lbl sm l2 l3 l4" + tc).attr("data-pr", 2).attr("data-d", 8).text(TRN[k]).node();
        addItem(lb, P[k], 8, 4, "start");
    });
    // durations
    TRIPS.forEach(t => (t.dur || []).forEach(d => {
        const lv = d.c === "air" ? "l2 l3 l4" : "l3 l4";
        const el = gOver.append("text").attr("class", `dur ${d.c} ${lv} t-${t.key}`).attr("data-pr", d.c === "air" ? 3 : 4).attr("data-d", 9).text(d.t).node();
        addItem(el, alongRoute(d.r, d.f), 9, 4, "start");
    }));
    // Kilimanjaro
    const mk = gOver.append("path").attr("class", "mk l3 l4 t-af").attr("d", "M0,-7L7,5L-7,5Z").node();
    addItem(mk, P.KIL, 0, 0);
    const ml = gOver.append("text").attr("class", "lbl sm l3 l4 t-af").attr("data-pr", 5).attr("data-d", 10).text("キリマンジャロ（5,895m）").node();
    addItem(ml, P.KIL, 10, 5, "start");
    // events
    EVENTS.forEach((ev, i) => {
        const g = gOver.append("g").attr("class", "ev l2 l3 l4 t-" + (ev.trip || "eu")).attr("data-ev", i).attr("tabindex", 0).attr("role", "button").attr("aria-label", `${ev.d} ${ev.title}`);
        g.append("circle").attr("class", "hit").attr("r", HIT + 2);
        g.append("circle").attr("class", "bg").attr("r", 8);
        g.append("path").attr("d", "M-3.6,-3.6L3.6,3.6M3.6,-3.6L-3.6,3.6");
        addItem(g.node(), P[ev.k], 0, 0);
        const lb = gOver.append("text").attr("class", "lbl evn l3 l4 t-" + (ev.trip || "eu")).attr("data-pr", 2).attr("data-d", 11).text(`${ev.d} ${ev.title}`).node();
        addItem(lb, P[ev.k], 11, 4, "start");
    });
    // illustrations
    ILLS.forEach((il, i) => {
        const pick = PICK_EXTRA.has(il.name) || (!il.lv && !(il.trip === "af" && DROP_AF.has(il.ic)));
        const g = gOver.append("g").attr("class", "ill l2 l3 l4 t-" + il.trip + (pick ? " pick" : "")).attr("data-ill", i).attr("data-tier", TOP0.has(il.name) ? 0 : (TOP.has(il.name) || TOP1AF.has(il.name)) ? 1 : pick ? 2 : 3).attr("tabindex", 0).attr("role", "button").attr("aria-label", il.name);
        g.append("line").attr("class", "ld");
        const inner = g.append("g").attr("class", "ic");
        inner.append("circle").attr("class", "bg").attr("r", 18);
        const hasPh = (il.photos && il.photos.length) || il.photo;
        inner.append("g").attr("transform", "scale(1.15)").html(ICONS[il.ic]);
        if (hasPh) {
            const pn = phList(il).length;
            inner.append("circle").attr("class", "phb").attr("cx", 13).attr("cy", -13).attr("r", pn > 1 ? 5.6 : 4);
            if (pn > 1)
                inner.append("text").attr("class", "phn2").attr("x", 13).attr("y", -12.6).text(pn);
        }
        addItem(g.node(), P[il.k], 0, 0);
    });
    // stops
    TRIPS.forEach(t => t.stops.forEach(s => {
        const g = gOver.append("g").attr("class", `stop ${t.key}`).attr("data-trip", t.key).attr("data-n", s.n).attr("tabindex", 0).attr("role", "button").attr("aria-label", `${s.name} ${s.d}`);
        g.append("circle").attr("class", "hit").attr("r", HIT + 4);
        g.append("circle").attr("class", "pt").attr("r", 5.2);
        addItem(g.node(), P[s.k], 0, 0);
        const lb = gOver.append("text").attr("class", "lbl stopn l2 l3 l4 t-" + t.key).attr("data-pr", 1).attr("data-must", 1).attr("data-d", 10).text(s.name).node();
        addItem(lb, P[s.k], 10, 4, "start");
    }));
    gOver.selectAll(".stop,.wp,.ev,.ill").on("click", (e) => select(e.currentTarget)).on("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            select(e.currentTarget);
        }
    });
}
// lodOf＝いまの拡大率 k から、ズームの段階（1＝全体、2＝国、3＝街…）を返す
function lodOf(k) {
    return k < 1.7 ? 1 : k < 7 ? 2 : k < 22 ? 3 : 4;
}
// LODTXT＝段階ごとの、左上の説明札の文言
const LODTXT = { 1: "<b>全体</b>：ズームすると寄港地の名前と飛行時間が出る", 2: "<b>寄港地</b>：イラストをタップすると思い出が出る。寄るほど思い出のイラストが増える", 3: "", 4: "" };
// lastLod＝直前の段階（変わったときだけ札や表示を更新するため）
let lastLod = 0;
