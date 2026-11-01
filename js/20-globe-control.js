// ======================================================================
// 20. 地球儀の操作と外部から呼ぶ関数  (20-globe-control.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 次の旅ルーレット用：地球儀を回して、指定の場所を正面（やや上）に止める ----
// __spinGlobe＝ルーレット用。地球儀を回して、指定の場所を正面に止める
window.__spinGlobe = async (ll, opt = {}) => {
    await enterGlobe(null, { k: 1 });
    gsv.interrupt("grot");
    const r0 = GL.rot.slice(), lat1 = Math.max(-85, Math.min(85, -ll[1] + (opt.shift || 0)));
    let t0 = -ll[0];
    if (RM()) {
        GL.rot = [t0, lat1, 0];
        renderGlobe();
        return;
    }
    t0 += 360 * Math.floor((r0[0] - 360 * (opt.turns || 3) - t0) / 360);
    if (opt.onStart)
        opt.onStart();
    await gsv.transition("grot").duration(opt.dur || 4200).ease(d3.easeCubicOut).tween("rot", () => t => {
        GL.rot = [r0[0] + (t0 - r0[0]) * t, r0[1] + (lat1 - r0[1]) * t, 0];
        gCoarse = t < 1;
        renderGlobe();
    }).end().catch(() => { });
    GL.rot = [((GL.rot[0] + 180) % 360 + 360) % 360 - 180, GL.rot[1], 0];
    gCoarse = false;
    renderGlobe();
};
// ルーレットで国が決まったら、その場所へ地球儀をぐっと寄せる（平らな地図に切り替わる手前まで）
window.__zoomGlobe = async (ll, opt = {}) => {
    if (!GL.on)
        return;
    const k0 = GL.R / R0(), kT = Math.min(opt.k || 3.2, 0.9 * swR() / R0());
    if (kT <= k0 * 1.1)
        return;
    const sh = Math.asin(Math.sin((opt.shift || 0) * Math.PI / 180) / kT) * 180 / Math.PI, lat1 = Math.max(-85, Math.min(85, -ll[1] + sh)), r0 = GL.rot.slice(), k = t => k0 + (kT - k0) * t;
    if (RM()) {
        GL.R = R0() * kT;
        setGlobeZoom(kT);
        GL.rot = [-ll[0], lat1, 0];
        renderGlobe();
        if (opt.onFrame)
            opt.onFrame();
        return;
    }
    await gsv.transition("grot").duration(opt.dur || 1500).ease(d3.easeCubicInOut).tween("rot", () => t => {
        GL.R = R0() * k(t);
        setGlobeZoom(k(t));
        GL.rot = [r0[0] + (-ll[0] - r0[0]) * t, r0[1] + (lat1 - r0[1]) * t, 0];
        gCoarse = t < 1;
        renderGlobe();
        if (opt.onFrame)
            opt.onFrame();
    }).end().catch(() => { });
    gCoarse = false;
    renderGlobe();
    if (opt.onFrame)
        opt.onFrame();
};
// 地図上の場所（経度・緯度）を、いまの表示（地球儀でも平らな地図でも）の画面位置に直す。裏側・移動中は null
// __llPt＝経緯度を、いまの表示（地球儀でも平面でも）の画面上の位置にする
window.__llPt = ll => {
    if (GL.morph)
        return null;
    if (GL.on) {
        if (d3.geoDistance(ll, [-GL.rot[0], -GL.rot[1]]) > Math.PI / 2 - 0.02)
            return null;
        const q = window.__globePt(ll);
        return q && isFinite(q[0]) ? q : null;
    }
    const p = proj(ll);
    if (!p || !isFinite(p[0]))
        return null;
    const q = cur.apply(p);
    return isFinite(q[0]) ? q : null;
};
// __globePt＝経緯度を地球儀上の画面位置にする
window.__globePt = ll => {
    gpj.translate([W / 2, H / 2]).scale(GL.R).rotate(GL.rot);
    return gpj(ll);
};
// 外部（ルーレット・検索）から使う小さな操作：回転を止める／地球儀を抜ける／半径を返す
window.__spinStop = () => gsv.interrupt("grot");
window.__exitGlobe = (c, k) => exitGlobe(c, k);
window.__globeR = () => GL.R;
// __focusKey＝地点コードの場所へ視点を移す
window.__focusKey = (key, k) => {
    const g = P[key];
    if (!g)
        return;
    if (GL.on) {
        exitGlobe(g, k);
        return;
    }
    const p = proj(g), t = d3.zoomIdentity.translate(W / 2, H / 2).scale(Math.min(k, KMAX())).translate(-p[0], -p[1]);
    if (RM())
        svg.call(zoom.transform, t);
    else
        svg.transition("dsl").duration(700).call(zoom.transform, t);
};
// __kCity＝街が見える拡大率
window.__kCity = () => Math.min(KMAX(), kRef() * 5);
// exitGlobe＝地球儀から平面の地図へ戻る（指定の中心・拡大率へ）
async function exitGlobe(center, k, opt = {}) {
    if (!GL.on || GL.morph)
        return;
    gsv.interrupt("grot");
    const c = center || [-GL.rot[0], -GL.rot[1]];
    const kk = Math.max(1, Math.min(KMAX(), k || 1)), p = proj(c);
    const T = opt.T || d3.zoomIdentity.translate(W / 2, H / 2).scale(kk).translate(-p[0], -p[1]);
    if (!RM() && !opt.instant)
        await runMorph(0, 1, [-GL.rot[0], -GL.rot[1]], GL.rot, GL.R, T, opt.mdur || 700);
    GL.on = false;
    window.__globeOn = false;
    GL.flatQuiet = true;
    svg.interrupt();
    svg.call(zoom.transform, T);
    GL.flatQuiet = false;
    gsv.style("display", "none");
    svg.style("visibility", null);
    stage.classList.remove("isglobe");
    lastLod = 0;
    if (typeof updCompass === "function")
        updCompass();
    place();
    clearTimeout(dt);
    dt = setTimeout(declutter, 30);
    const n = svg.node();
    n.classList.remove("ffade");
    void n.getBoundingClientRect();
    n.classList.add("ffade");
}
// jumpT＝ジャンプ先の地点が画面に収まる拡大・移動（ズームの変換）を返す
function jumpT(key) {
    const pts = JUMP[key].map(k => proj(P[k]));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = Math.max(1, Math.min(160, 0.8 / Math.max((x1 - x0) / W, (y1 - y0) / H, 1e-3)));
    return d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
}
// __globeRedraw＝地球儀の再描画
window.__globeRedraw = () => {
    if (GL.on) {
        GL.R = R0() * GL.last.k;
        renderGlobe();
    }
};
// flat map: pinch/scroll out past the whole map -> globe
zoom.scaleExtent([0.82, KMAX()]);
// gPrevK＝直前の拡大率（縮小方向かの判定用）
let gPrevK = 1;
// 平面でさらに縮小したら、地球儀へ切り替える（ズーム中）
zoom.on("zoom.globe", e => {
    const k = e.transform.k, out = k < gPrevK;
    gPrevK = k;
    if (GL.flatQuiet || GL.on || GL.morph || PS.on || !e.sourceEvent)
        return;
    const back = kRef() * 0.9;
    if (out && k < back) {
        const kg = Math.max(1, k * flatS() / R0());
        enterGlobe(null, { k: kg, T: e.transform });
    }
});
// ズームが終わったとき：地球儀へ移るか、元の位置へ戻すかを決める
zoom.on("end.globe", e => {
    if (!GL.on && cur.k < 1) {
        svg.transition().duration(200).call(zoom.transform, d3.zoomIdentity);
    }
});
// buttons
// 拡大ボタン
document.getElementById("zin").addEventListener("click", e => {
    if (GL.morph) {
        e.stopImmediatePropagation();
        return;
    }
    if (!GL.on)
        return;
    e.stopImmediatePropagation();
    const k = GL.last.k * 1.6;
    GL.R = R0() * k;
    setGlobeZoom(k);
    if (GL.R >= swR())
        exitGlobe([-GL.rot[0], -GL.rot[1]], GL.R / flatS());
    else
        renderGlobe();
}, true);
// 縮小ボタン（全体より縮めると地球儀へ）
document.getElementById("zout").addEventListener("click", e => {
    if (GL.morph) {
        e.stopImmediatePropagation();
        return;
    }
    if (GL.on) {
        e.stopImmediatePropagation();
        const k = Math.max(0.85, GL.last.k / 1.6);
        GL.R = R0() * k;
        setGlobeZoom(k);
        renderGlobe();
        return;
    }
    if (cur.k / 2 < kRef() * 0.9 && !PS.on && !GL.morph) {
        e.stopImmediatePropagation();
        enterGlobe(null, { k: Math.max(1, cur.k / 2 * flatS() / R0()), T: cur });
    }
}, true);
// ジャンプボタン（地球儀のときは先に平面へ戻してから移動）
document.querySelectorAll("[data-jump]").forEach(b => {
    b.addEventListener("click", () => {
        if (PS.on || b.dataset.jump === "all" || !GL.on)
            return;
        exitGlobe(null, null, { T: jumpT(b.dataset.jump), mdur: 850 });
    }, true);
    if (b.dataset.jump === "all")
        b.addEventListener("click", () => {
            if (!PS.on)
                enterGlobe(null, { reset: true, mdur: 850 });
        });
});
// playback: flights over the Arctic are shown on the globe
// globeFlight＝再生の1ステップ（飛行）を地球儀の上で再生する
async function globeFlight(step, i, tok) {
    await enterGlobe([75, 72], { anim: true, dur: 900 / PS.speed, mdur: 700 / PS.speed, keepPanel: true });
    GL.byPlay = true;
    if (tok !== PS.tok)
        return false;
    GL.R = Math.min(W, H) * 0.47;
    setGlobeZoom(1);
    renderGlobe();
    for (const [m, ks] of step.legs) {
        const c = JSON.stringify(ks);
        const el = gPlayG.append("path").attr("data-s", i).attr("data-c", c).attr("class", "gpl " + m).attr("d", gp({ type: "LineString", coordinates: ks.map(k => P[k]) }));
        const L = el.node().getTotalLength();
        setVeh("g", el.node(), m, 0, ks);
        if (RM() || L < 1) {
            VS.frac = 1;
            drawVeh();
            continue;
        }
        el.attr("stroke-dasharray", `${L} ${L}`).attr("stroke-dashoffset", L);
        try {
            await el.transition("play").duration(2200 / PS.speed).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0).tween("veh", () => t => {
                VS.frac = t;
                drawVeh();
            }).end();
        }
        catch (e) {
            return false;
        }
        if (tok !== PS.tok)
            return false;
        el.attr("stroke-dasharray", null).attr("stroke-dashoffset", null);
        VS.frac = 1;
        drawVeh();
    }
    return await wait(1500, tok);
}
