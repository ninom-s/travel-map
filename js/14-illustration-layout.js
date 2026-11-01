// ======================================================================
// 14. イラストの置き場所とズーム設定  (14-illustration-layout.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- stable illustration layout ----
// Positions are worked out per zoom step (every x1.41) in map space, so they don't depend on panning,
// and they are checked against each other and against the route lines across the whole step.
// ICO＝イラスト配置の結果のキャッシュ（同じ段階なら計算を使い回す）
const ICO = { key: "", res: null, segs: null, segKey: "" };
// ICO_OFF＝イラストを置くときの候補のずらし位置（点から近い順）
const ICO_OFF = (() => {
    const off = [[30, -30], [-30, -30], [30, 30], [-30, 30], [0, -40], [0, 40], [44, 0], [-44, 0], [52, -34], [-52, -34], [52, 34], [-52, 34]];
    [[80, 16], [118, 20], [156, 24], [194, 28], [232, 32], [270, 36], [308, 40]].forEach(([r, n]) => {
        for (let i = 0; i < n; i++) {
            const a = -Math.PI / 2 + i * 2 * Math.PI / n;
            off.push([Math.round(r * Math.cos(a)), Math.round(r * Math.sin(a))]);
        }
    });
    return off;
})();
// icoSegs＝ルートの線を短い線分に刻む。イラストが線に重ならないか調べるのに使う
function icoSegs() {
    const key = W + "x" + H + "|" + proj.angle() + "|" + proj.scale() + "|" + JSON.stringify(SHOW);
    if (ICO.segKey === key && ICO.segs)
        return ICO.segs;
    const out = [];
    // use the route lines exactly as drawn
    gMap.selectAll("path.seg").each(function () {
        if ([...this.classList].some(c => c in SHOW && !SHOW[c]))
            return;
        const d = this.getAttribute("d") || "";
        let prev = null;
        const re = /([MLZ])([^MLZ]*)/g;
        let m;
        while ((m = re.exec(d))) {
            if (m[1] === "Z") {
                prev = null;
                continue;
            }
            const v = m[2].split(/[ ,]+/).filter(Boolean).map(Number);
            for (let k = 0; k + 1 < v.length; k += 2) {
                const q = [v[k], v[k + 1]];
                if (m[1] === "L" && prev)
                    out.push([prev[0], prev[1], q[0], q[1]]);
                prev = q;
            }
        }
    });
    ICO.segKey = key;
    ICO.segs = out;
    return out;
}
// segDist＝点 (px,py) と線分 (x1,y1)-(x2,y2) の距離
function segDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy;
    let t = l ? ((px - x1) * dx + (py - y1) * dy) / l : 0;
    t = Math.max(0, Math.min(1, t));
    const ex = x1 + t * dx - px, ey = y1 + t * dy - py;
    return Math.sqrt(ex * ex + ey * ey);
}
// icoLayout＝イラストの配置を決める。ズーム段階ごとに、イラスト同士・ルートと重ならない位置を探す
function icoLayout() {
    const n = Math.floor(2 * Math.log2(Math.max(1, cur.k)) + 1e-9), kb = Math.pow(2, n / 2), key = n + "|" + proj.angle() + "|" + W + "x" + H + "|" + JSON.stringify(SHOW);
    if (ICO.key === key)
        return ICO.res;
    const SC = [1, 1.19, 1.414], R0 = 18, G = 4, kk = kb / kRef(), maxT = kk < 1.6 ? 0 : kk < 3.2 ? 1 : kk < 12 ? 2 : 3, lodB = lodOf(kb);
    const segs = icoSegs();
    const nodes = [...gOver.node().querySelectorAll(".ill")].filter(g => tripOn(ILLS[+g.dataset.ill].trip));
    const ills = nodes.map(g => {
        const il = ILLS[+g.dataset.ill], p = proj(P[il.k]);
        return { g, t: +g.dataset.tier, a: [p[0] * kb, p[1] * kb] };
    }).sort((x, y) => x.t - y.t);
    // fixed obstacles: stop dots, stop names at their default place, way points and events when shown
    const obs = [];
    TRIPS.filter(t => tripOn(t.key)).forEach(t => t.stops.forEach(s => {
        const p = proj(P[s.k]);
        const a = [p[0] * kb, p[1] * kb];
        obs.push({ a, x: -7, y: -7, w: 14, h: 14 });
    }));
    if (lodB >= 3)
        gOver.selectAll(".wp").each(function () {
            const k = this.dataset.k;
            if (!P[k] || !tripOn(wpInfo[k].trip))
                return;
            const p = proj(P[k]);
            obs.push({ a: [p[0] * kb, p[1] * kb], x: -5, y: -5, w: 10, h: 10 });
        });
    if (lodB >= 3)
        EVENTS.forEach(ev => {
            if (!P[ev.k] || !tripOn(ev.trip || "eu"))
                return;
            const p = proj(P[ev.k]);
            obs.push({ a: [p[0] * kb, p[1] * kb], x: -10, y: -10, w: 20, h: 20 });
        });
    const res = new Map(), placed = [];
    const boxHit = (c, b, s) => {
        const ox = b.a[0] * s + b.x, oy = b.a[1] * s + b.y;
        return c[0] - R0 - G < ox + b.w && c[0] + R0 + G > ox && c[1] - R0 - G < oy + b.h && c[1] + R0 + G > oy;
    };
    for (const it of ills) {
        if (it.t > maxT) {
            res.set(it.g, null);
            continue;
        }
        const near = r => Math.abs(r[0] - it.a[0]) < 420 && Math.abs(r[1] - it.a[1]) < 420;
        const nObs = obs.filter(o => near(o.a)), nPl = placed.filter(o => near(o.a));
        const nSeg = segs.filter(sg => {
            const x0 = Math.min(sg[0], sg[2]) * kb, x1 = Math.max(sg[0], sg[2]) * kb, y0 = Math.min(sg[1], sg[3]) * kb, y1 = Math.max(sg[1], sg[3]) * kb;
            return SC.some(sc => x1 * sc > it.a[0] * sc - 240 && x0 * sc < it.a[0] * sc + 240 && y1 * sc > it.a[1] * sc - 240 && y0 * sc < it.a[1] * sc + 240);
        });
        const cand = kk >= 24 ? ICO_OFF : it.t < 3 ? ICO_OFF.slice(0, 100) : ICO_OFF.slice(0, 28);
        let got = null;
        for (const [dx, dy] of cand) {
            let bad = false;
            for (const s of SC) {
                const c = [it.a[0] * s + dx, it.a[1] * s + dy];
                if (nObs.some(o => boxHit(c, o, s))) {
                    bad = true;
                    break;
                }
                if (nPl.some(o => {
                    const q = [o.a[0] * s + o.d[0], o.a[1] * s + o.d[1]];
                    return Math.abs(q[0] - c[0]) < 2 * R0 + G && Math.abs(q[1] - c[1]) < 2 * R0 + G;
                })) {
                    bad = true;
                    break;
                }
                if (nSeg.some(sg => segDist(c[0], c[1], sg[0] * kb * s, sg[1] * kb * s, sg[2] * kb * s, sg[3] * kb * s) < R0 + 3)) {
                    bad = true;
                    break;
                }
            }
            if (!bad) {
                got = [dx, dy];
                break;
            }
        }
        if (got) {
            placed.push({ a: it.a, d: got });
        }
        res.set(it.g, got);
    }
    ICO.key = key;
    ICO.res = res;
    return res;
}
// applyIcons＝決まった配置を実際のイラスト要素に反映する（拡大率に合わせて大きさも変える）
function applyIcons() {
    if (lodOf(cur.k) < 2)
        return;
    const res = icoLayout(), R0 = 18;
    for (const [g, o] of res) {
        if (!o) {
            g.style.display = "none";
            continue;
        }
        g.style.display = "";
        const ic = g.querySelector(".ic"), ld = g.querySelector(".ld");
        if (g.__o !== o) {
            g.__o = o;
            ic.setAttribute("transform", `translate(${o[0]},${o[1]})`);
            const L = Math.hypot(o[0], o[1]), s = (L - R0) / L;
            ld.setAttribute("x1", o[0] * 0.22);
            ld.setAttribute("y1", o[1] * 0.22);
            ld.setAttribute("x2", o[0] * s);
            ld.setAttribute("y2", o[1] * s);
        }
    }
}
// dt＝ズーム中の再描画を間引くタイマー
let dt;
// KMAX＝最大の拡大率。画面が小さいほど大きく取る
const KMAX = () => Math.round(160 * Math.max(1, 1240 / Math.max(W, 320)));
// zoom＝地図の拡大・移動（d3.zoom）。動くたびに地図・名前・イラストを変換して再描画する
const zoom = d3.zoom().scaleExtent([1, KMAX()]).on("zoom", e => {
    cur = e.transform;
    gMap.attr("transform", cur);
    place();
    clearTimeout(dt);
    dt = setTimeout(declutter, 110);
});
// svg にズームを取り付ける
svg.call(zoom);
