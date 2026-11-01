// ======================================================================
// 18. 地球儀の描画  (18-globe-setup.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- globe view (zoomed out) ----
// GL＝地球儀の状態：on 表示中／rot 回転角／R0,R 半径／last 直前のズーム／quiet 静かに更新／byPlay 再生中か
const GL = { on: false, rot: [-62, -32, 0], R0: 1, R: 1, last: d3.zoomIdentity, quiet: false, byPlay: false };
// gsv＝地球儀用の SVG（平面の地図の上に重ねる）
const gsv = d3.select(stage).insert("svg", () => svg.node().nextSibling).attr("class", "globe").attr("role", "img").attr("aria-label", "2つの旅の地球儀。ドラッグで回せる").style("display", "none");
// gdefs＝グラデーション定義。海のグラデ（gSea）と光沢（gShine）
const gdefs = gsv.append("defs");
const grd = gdefs.append("radialGradient").attr("id", "gSea").attr("cx", "38%").attr("cy", "32%").attr("r", "75%");
grd.append("stop").attr("offset", "0%").attr("class", "gs0");
grd.append("stop").attr("offset", "100%").attr("class", "gs1");
const grd2 = gdefs.append("radialGradient").attr("id", "gShine").attr("cx", "34%").attr("cy", "28%").attr("r", "60%");
grd2.append("stop").attr("offset", "0%").attr("stop-color", "#fff").attr("stop-opacity", .55);
grd2.append("stop").attr("offset", "100%").attr("stop-color", "#fff").attr("stop-opacity", 0);
// gpj＝正射図法（球を横から見た図）。gp＝それを SVG パスにする関数
const gpj = d3.geoOrthographic().clipAngle(90).precision(.6);
const gp = d3.geoPath(gpj);
// 地球儀の層を下から順に作る：大気・球・経緯線・特別な緯線・陸地・線・再生・光沢・ふち・点
const gAir = gsv.append("circle").attr("class", "gatm");
const gSph = gsv.append("path").attr("class", "gsph");
const gGrat = gsv.append("path").attr("class", "ggrat");
const gPar = gsv.append("g");
const gLand = gsv.append("g");
const gSeg = gsv.append("g");
const gPlayG = gsv.append("g").attr("class", "gplay");
const gShine = gsv.append("circle").attr("class", "gshine").attr("fill", "url(#gShine)");
const gEdge = gsv.append("path").attr("class", "gedge");
const gPts = gsv.append("g");
// lighter land for smooth rotation
function thin(geom, n, minLen) {
    const th = r => r.length > n * 4 ? r.filter((p, i) => i % n === 0 || i === r.length - 1) : r;
    const keep = r => !!r && r.length >= 4 && (minLen ? d3.geoLength({ type: "LineString", coordinates: r }) > minLen : true);
    if (!geom)
        return null;
    if (geom.type === "Polygon") {
        const c = geom.coordinates.map(th).filter((r, i) => i === 0 || keep(r));
        return keep(c[0]) || !minLen ? { type: "Polygon", coordinates: c } : null;
    }
    if (geom.type === "MultiPolygon") {
        const c = geom.coordinates.map(p => p.map(th)).filter(p => keep(p[0]));
        return c.length ? { type: "MultiPolygon", coordinates: c } : null;
    }
    return geom;
}
// fixWind＝多角形の向きを球面用にそろえる（向きが逆だと球全体が塗られてしまう）
const fixWind = g => {
    if (!g)
        return g;
    const fp = poly => d3.geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI ? poly.map(r => r.slice().reverse()) : poly;
    if (g.type === "Polygon")
        return { type: "Polygon", coordinates: fp(g.coordinates) };
    if (g.type === "MultiPolygon")
        return { type: "MultiPolygon", coordinates: g.coordinates.map(fp) };
    return g;
};
// gWorld＝地球儀用の陸地（南極を除き、粗い版と細かい版を持つ）
const gWorld = (world || []).filter(f => f.id !== "ATA").map(f => ({ type: "Feature", id: f.id, fine: fixWind(thin(f.geometry, 3, 0)), coarse: fixWind(thin(f.geometry, 14, 0.02)), mc: fixWind(thin(f.geometry, 24, 0.035)) }));
// gGroups＝陸地を色分けするグループ（ふつう／ヨーロッパの旅／エジプト・ケニアの旅…）
const gGroups = [["", f => !EU.visited.has(f.id) && !AF.visited.has(f.id)], [" v", f => EU.visited.has(f.id)], [" v2", f => AF.visited.has(f.id)]].map(([c, fn]) => {
    const fs = gWorld.filter(fn);
    fs.forEach(f => {
        if (f.fine) {
            const b = d3.geoBounds(f.fine);
            f.bb = b;
        }
    });
    const mk = k => ({ type: "FeatureCollection", features: fs.filter(f => f[k]).map(f => ({ type: "Feature", geometry: f[k] })) });
    return { c, fs, fine: mk("fine"), coarse: mk("coarse"), mc: mk("mc") };
});
// when zoomed in, draw only the countries near the screen
// viewBox＝いま画面に映っている範囲（経緯度）を求める
function viewBox(pj) {
    if (!pj.invert)
        return null;
    const pts = [];
    for (let i = 0; i <= 4; i++)
        for (let j = 0; j <= 4; j++) {
            const q = pj.invert([W * i / 4, H * j / 4]);
            if (q && isFinite(q[0]))
                pts.push(q);
        }
    if (pts.length < 20)
        return null;
    const lo = pts.map(p => p[0]), la = pts.map(p => p[1]);
    const x0 = Math.min(...lo), x1 = Math.max(...lo);
    if (x1 - x0 > 180)
        return null;
    return [x0 - 6, Math.min(...la) - 6, x1 + 6, Math.max(...la) + 6];
}
// culled＝画面の外の国を描かないよう間引いた図形を返す（拡大時の軽量化）
function culled(g, key, vb) {
    return { type: "FeatureCollection", features: g.fs.filter(f => f[key] && f.bb && !(f.bb[1][0] < vb[0] && f.bb[0][0] <= f.bb[1][0] || f.bb[0][0] > vb[2] && f.bb[0][0] <= f.bb[1][0] || f.bb[1][1] < vb[1] || f.bb[0][1] > vb[3])).map(f => ({ type: "Feature", geometry: f[key] })) };
}
// 陸地のパスを作る
gLand.selectAll("path").data(gGroups).join("path").attr("class", d => "gland" + d.c);
// gCoarse＝いま粗い版で描いているか。gFineT＝細かい版へ戻すタイマー
let gCoarse = false, gFineT = 0;
// gSegs＝地球儀に描く路線のリスト
const gSegs = [];
TRIPS.forEach(t => t.seg.forEach(([m, kind, ks]) => {
    if (m === "plan")
        return;
    gSegs.push({ m, kind, t: t.key, geo: { type: "LineString", coordinates: ks.map(k => P[k]) } });
}));
gSeg.selectAll("path").data(gSegs).join("path").attr("class", d => `gseg ${d.m} ${d.t}`);
// gStops＝地球儀に出す寄港地の点
const gStops = TRIPS.flatMap(t => t.stops.map(s => ({ k: s.k, t: t.key, name: s.name })));
const gDot = gPts.selectAll("circle").data(gStops).join("circle").attr("class", d => "gpt " + d.t).attr("r", 4.2).on("click", (e, d) => {
    e.stopPropagation();
    exitGlobe(P[d.k], Math.max(kRef() * 1.25, 2));
});
// gLbl＝旅の名前の札（ヨーロッパ一周・エジプト・ケニアなど）
const gLbl = gPts.selectAll("text").data([["RVN", "ヨーロッパ一周 2025.1–2", "eu", 12, -2], ["NBO", "エジプト・ケニア 2025.12–2026.1", "af", 12, 18], ["HNL", "ハワイ（Mとお母さん）", "hi", 10, -10], ["SEL", "韓国（M）", "ko", -96, -8], ["ECT", "ロンドン（M）", "ld", 10, -8], ["BKK", "タイ（予定）", "th", 10, 10], ["TSN", "中国（小5）", "cn", 10, -10], ["NRT", "日本", "", 8, -8]]).join("text").attr("class", d => "glbl " + d[2]).text(d => d[1]);
// gName＝寄港地の名前
const gName = gPts.selectAll("text.gname").data(gStops).join("text").attr("class", d => "gname " + d.t).text(d => d.name);
// vis＝地球の裏側（見えない側）の点かどうかの判定
const vis = c => d3.geoDistance(c, [-GL.rot[0], -GL.rot[1]]) < Math.PI / 2 - 0.03;
// drawWith＝指定した図法 pj で地球儀を描く。t は平面との変形の進み具合
function drawWith(pj, t) {
    const pp = d3.geoPath(pj), r = pj.rotate(), ctr = [-r[0], -r[1]];
    const vv = c => t > 0.45 || d3.geoDistance(c, ctr) < Math.PI / 2 - 0.03;
    gAir.attr("cx", W / 2).attr("cy", H / 2).attr("r", GL.R + 7).style("opacity", Math.max(0, 1 - t * 2.5));
    gShine.attr("cx", W / 2).attr("cy", H / 2).attr("r", GL.R).style("opacity", Math.max(0, 1 - t * 2));
    gSph.attr("d", pp({ type: "Sphere" }));
    gEdge.attr("d", pp({ type: "Sphere" })).style("opacity", 1 - t);
    const mid = t > 0 && t < 1;
    pj.precision(mid ? 5 : gCoarse ? 2 : .6);
    gGrat.attr("d", pp(d3.geoGraticule().step(mid ? [30, 30] : [15, 15])()));
    const vb = t === 0 && GL.R > R0() * 2.5 ? viewBox(pj) : null;
    const key = mid ? "mc" : gCoarse ? "coarse" : "fine";
    gLand.selectAll("path").attr("d", d => pp(vb ? culled(d, key, vb) : d[key]));
    gPar.selectAll("path").data(PARS).join("path").attr("class", d => "gpar " + d.c).attr("d", d => pp(parGeo(d.lat)));
    gSeg.selectAll("path").attr("d", d => pp(d.geo));
    gPlayG.selectAll("path").attr("d", function () {
        return pp({ type: "LineString", coordinates: JSON.parse(this.dataset.c).map(k => P[k]) });
    });
    gDot.each(function (d) {
        const c = P[d.k];
        const q = pj(c);
        d3.select(this).attr("cx", q ? q[0] : -99).attr("cy", q ? q[1] : -99).style("display", q && vv(c) ? null : "none");
    });
    const showN = t === 0 && GL.R > flatS() * kRef() * 0.75;
    const nb = [];
    gName.each(function (d) {
        const c = P[d.k];
        const q = showN && pj(c);
        let ok = !!(q && vv(c) && tripOn(d.t));
        if (ok) {
            const w = d.name.length * 11.5 + 4, bx = [q[0] + 6, q[1] - 8, w, 15];
            ok = !nb.some(o => bx[0] < o[0] + o[2] && bx[0] + bx[2] > o[0] && bx[1] < o[1] + o[3] && bx[1] + bx[3] > o[1]);
            if (ok)
                nb.push(bx);
        }
        d3.select(this).attr("x", q ? q[0] + 7 : -99).attr("y", q ? q[1] + 4 : -99).style("display", ok ? null : "none");
    });
    gLbl.style("visibility", showN ? "hidden" : null);
    if (window.__vehRedraw)
        window.__vehRedraw("g");
    gLbl.each(function (d) {
        const c = P[d[0]];
        const q = pj(c);
        d3.select(this).attr("x", q ? q[0] + d[3] : -99).attr("y", q ? q[1] + d[4] : -99).style("display", q && vv(c) && (t > 0.45 || d3.geoDistance(c, ctr) < Math.PI / 2 - 0.25) ? null : "none");
    });
}
// renderGlobe＝いまの回転・半径で地球儀を描き直す
function renderGlobe() {
    gpj.translate([W / 2, H / 2]).scale(GL.R).rotate(GL.rot);
    drawWith(gpj, 0);
    if (window.__rlPin)
        window.__rlPin();
}
