// ======================================================================
// 21. 地図の回転（コンパス）  (21-map-rotation.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- map bearing (rotate the flat map; labels and icons stay upright) ----
// BEAR＝地図の向き（度、画面上で時計回り）
let BEAR = 0; // degrees, clockwise on screen
// rotg＝回転させる層。名前やイラストは回転させず、常に正立で描く
const rotg = svg.insert("g", ":first-child").attr("class", "rotg");
[gMap, gPlayH, gPlay, gOver, gPulse].forEach(g => rotg.node().appendChild(g.node()));
// nrm＝角度を -180〜180 に収める
const nrm = a => ((a % 360) + 540) % 360 - 180;
// R2＝点を中心まわりに deg 度回す
const R2 = (v, deg) => {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};
// zcomp＝コンパス（押すと北が上に戻る）
const zcomp = document.getElementById("zcomp");
// updCompass＝コンパスの針を、いまの向きに合わせる
function updCompass() {
    zcomp.hidden = Math.abs(BEAR) < 0.5;
    zcomp.querySelector("svg").style.transform = `rotate(${BEAR}deg)`;
}
// tempBear＝回転の途中経過を見せる（確定はしない）
function tempBear(th, c) {
    rotg.attr("transform", th ? `rotate(${th},${c[0]},${c[1]})` : null);
    zcomp.hidden = Math.abs(BEAR + th) < 0.5;
    zcomp.querySelector("svg").style.transform = `rotate(${BEAR + th}deg)`;
}
// commitBear＝回転を確定する。名前・イラスト・再生の線を、新しい向きで描き直す
function commitBear(th, c) {
    rotg.attr("transform", null);
    if (Math.abs(th) < 0.01) {
        updCompass();
        return;
    }
    const k = cur.k, b = [cur.x, cur.y], tr = proj.translate(), bc = R2([b[0] - c[0], b[1] - c[1]], th), rt = R2(tr, th);
    const nb = [c[0] + bc[0] - k * tr[0] + k * rt[0], c[1] + bc[1] - k * tr[1] + k * rt[1]];
    BEAR = nrm(BEAR + th);
    proj.angle(-BEAR);
    drawBase();
    GL.flatQuiet = true;
    svg.call(zoom.transform, d3.zoomIdentity.translate(nb[0], nb[1]).scale(k));
    GL.flatQuiet = false;
    place();
    clearTimeout(dt);
    dt = setTimeout(declutter, 30);
    if (window.__playRedraw)
        window.__playRedraw();
    updCompass();
}
// snap＝北に近い角度なら北にぴたっと合わせる
const snap = th => {
    const f = nrm(BEAR + th);
    return Math.abs(f) < 5 ? th - f : th;
};
// two-finger twist
// 二本指のひねりで回転（スマホ）。tw＝ひねりの状態
let tw = null;
// tp＝タッチ点の座標。tAng＝2本の指の角度。tMid＝2本の中点
const tp = t => d3.pointer(t, svg.node());
const tAng = e => {
    const a = tp(e.touches[0]), b = tp(e.touches[1]);
    return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
};
const tMid = e => {
    const a = tp(e.touches[0]), b = tp(e.touches[1]);
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
};
// touchstart/move/end で、指2本のひねりを回転に変える
stage.addEventListener("touchstart", e => {
    if (e.touches.length === 2 && !GL.on && !GL.morph && svg.node().contains(e.target))
        tw = { a0: tAng(e), th: 0, on: false, c: tMid(e) };
}, { passive: true, capture: true });
stage.addEventListener("touchmove", e => {
    if (!tw || e.touches.length !== 2)
        return;
    let d = nrm(tAng(e) - tw.a0);
    if (!tw.on) {
        if (Math.abs(d) < 12)
            return;
        tw.on = true;
        tw.a0 += Math.sign(d) * 12;
        d = nrm(tAng(e) - tw.a0);
        if (PS.on && !PS.paused)
            pausePlay();
    }
    tw.th = d;
    tempBear(d, tw.c);
}, { passive: true, capture: true });
const twEnd = e => {
    if (!tw || e.touches.length >= 2)
        return;
    const t = tw;
    tw = null;
    if (t.on)
        commitBear(snap(t.th), t.c);
};
stage.addEventListener("touchend", twEnd, { passive: true, capture: true });
stage.addEventListener("touchcancel", twEnd, { passive: true, capture: true });
// PC: Shift + drag
// onVeh＝乗り物の上で始めた操作か（乗り物は回転でなく選択に使う）
const onVeh = e => e.type !== "wheel" && e.target && e.target.closest && !!e.target.closest(".veh");
// ズームの受け付け条件を差し替える（Shift ドラッグを拡大縮小に使わない）
zoom.filter(e => (!e.ctrlKey || e.type === "wheel") && !e.button && !(e.shiftKey && e.type === "mousedown") && !onVeh(e));
// md＝ドラッグ回転の状態。mAng＝マウス位置の角度
let md = null;
const mAng = e => {
    const p = d3.pointer(e, svg.node());
    return Math.atan2(p[1] - H / 2, p[0] - W / 2) * 180 / Math.PI;
};
// mousedown/move/up で Shift ドラッグを回転に変える
svg.node().addEventListener("mousedown", e => {
    if (!e.shiftKey || e.button || GL.on)
        return;
    md = { a0: mAng(e), th: 0 };
    e.preventDefault();
});
addEventListener("mousemove", e => {
    if (!md)
        return;
    md.th = nrm(mAng(e) - md.a0);
    tempBear(md.th, [W / 2, H / 2]);
});
addEventListener("mouseup", () => {
    if (!md)
        return;
    const m = md;
    md = null;
    commitBear(snap(m.th), [W / 2, H / 2]);
});
// compass: back to north
zcomp.addEventListener("click", () => {
    const th = -BEAR, c = [W / 2, H / 2];
    if (RM()) {
        commitBear(th, c);
        return;
    }
    const tm = d3.timer(el => {
        const u = Math.min(1, el / 350), e = d3.easeCubicInOut(u);
        tempBear(th * e, c);
        if (u >= 1) {
            tm.stop();
            commitBear(th, c);
        }
    });
});
// 最初のコンパス表示
updCompass();
