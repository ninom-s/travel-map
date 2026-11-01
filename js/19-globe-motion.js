// ======================================================================
// 19. 地球儀と平らな地図の切り替え  (19-globe-motion.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// morph between the globe (t=0) and the flat map (t=1)
// globe side of the morph: orthographic on the front, then keeps going outward past the edge (no fold-over)
const oRaw = (x, y) => {
    const cy = Math.cos(y), cc = Math.max(-1, Math.min(1, cy * Math.cos(x))), c = Math.acos(cc), sc = Math.sin(c);
    if (c < 1e-9)
        return [cy * Math.sin(x), Math.sin(y)];
    const f = c <= Math.PI / 2 ? sc : 1 + (c - Math.PI / 2) * 0.9;
    const k = f / sc;
    return [k * cy * Math.sin(x), k * Math.sin(y)];
};
// nRaw＝平面側の変換（ナチュラルアース図法）
const nRaw = d3.geoNaturalEarth1Raw;
// morphProj＝地球儀(t=0)と平面(t=1)のあいだを t でなめらかにつなぐ図法を作る
function morphProj(t, c, rot0, R, T) {
    const rot1 = proj.rotate(), r0 = rot0.slice();
    while (r0[0] - rot1[0] > 180)
        r0[0] -= 360;
    while (r0[0] - rot1[0] < -180)
        r0[0] += 360;
    const s0 = R, s1 = T.k * proj.scale(), sc = s0 * Math.pow(s1 / s0, t);
    const raw = (x, y) => {
        const a = oRaw(x, y), b = nRaw(x, y);
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    };
    const pj = d3.geoProjection(raw).rotate([r0[0] + (rot1[0] - r0[0]) * t, r0[1] + (rot1[1] - r0[1]) * t, 0]).scale(sc).angle(proj.angle() * t).translate([0, 0]);
    if (t < 0.7)
        pj.clipAngle(90 + 90 * t / 0.7 * 0.7);
    const tgt = T.apply(proj(c)), q = pj(c) || [0, 0];
    const sx = W / 2 + (tgt[0] - W / 2) * t, sy = H / 2 + (tgt[1] - H / 2) * t;
    return pj.translate([sx - q[0], sy - q[1]]);
}
// runMorph＝t0 から t1 まで、dur ミリ秒かけて図法を変えながら描き続ける（地球儀⇔平面の切り替えアニメ）
function runMorph(t0, t1, c, rot0, R, T, dur) {
    GL.morph = true;
    gCoarse = true;
    return new Promise(res => {
        const e = d3.easeCubicInOut;
        const tm = d3.timer(el => {
            const u = Math.min(1, el / dur), t = t0 + (t1 - t0) * e(u);
            drawWith(morphProj(t, c, rot0, R, T), t);
            if (u >= 1) {
                tm.stop();
                GL.morph = false;
                gCoarse = false;
                res();
            }
        });
    });
}
// gRaf＝描画の予約（requestAnimationFrame）の番号
let gRaf = 0;
// gReq＝描画を次のフレームにまとめて1回だけ予約する
const gReq = () => {
    gCoarse = true;
    clearTimeout(gFineT);
    gFineT = setTimeout(() => {
        gCoarse = false;
        renderGlobe();
    }, 160);
    if (!gRaf)
        gRaf = requestAnimationFrame(() => {
            gRaf = 0;
            renderGlobe();
        });
};
// R0＝地球儀の基準の半径（画面の短辺の46%）
const R0 = () => Math.min(W, H) * 0.46;
// flatS＝平面の地図の拡大率
const flatS = () => proj.scale();
// KSW＝（旧）地球儀と平面を切り替える比率
const KSW = 1.45; // (old) switch ratio
// swR＝地球儀から平面へ切り替わる半径。国2〜3個が画面を埋めるくらいまで地球儀のまま
const swR = () => flatS() * Math.max(KSW, kRef() * 1.8); // globe stays until about 2-3 countries fill the screen
// gzoom＝地球儀用のズーム／回転操作。ドラッグで回転、ホイール・ピンチで拡大縮小
const gzoom = d3.zoom().filter(e => !GL.morph && (!e.ctrlKey || e.type === "wheel") && !e.button && !(e.type !== "wheel" && e.target && e.target.closest && e.target.closest(".veh"))).scaleExtent([0.85, 40]).on("start", e => {
    if (e.sourceEvent && typeof RIDE !== "undefined" && RIDE)
        RIDE.cancel = true;
    if (e.sourceEvent && PS.on && !PS.paused)
        pausePlay();
}).on("zoom", e => {
    if (GL.quiet || GL.morph) {
        GL.last = e.transform;
        return;
    }
    const t = e.transform, dx = t.x - GL.last.x, dy = t.y - GL.last.y, kOld = GL.last.k;
    GL.last = t;
    if (e.sourceEvent && Math.abs(t.k - kOld) > 1e-6) {
        // zoom toward the finger / mouse pointer: keep the place under it fixed
        const se = e.sourceEvent;
        let pt;
        try {
            pt = se.touches && se.touches.length > 1 ? [(d3.pointer(se.touches[0], gsv.node())[0] + d3.pointer(se.touches[1], gsv.node())[0]) / 2, (d3.pointer(se.touches[0], gsv.node())[1] + d3.pointer(se.touches[1], gsv.node())[1]) / 2] : d3.pointer(se, gsv.node());
        }
        catch (err) {
            pt = [W / 2, H / 2];
        }
        gpj.translate([W / 2, H / 2]).scale(GL.R).rotate(GL.rot);
        const g = gpj.invert(pt);
        GL.R = R0() * t.k;
        if (g && isFinite(g[0]) && d3.geoDistance(g, [-GL.rot[0], -GL.rot[1]]) < Math.PI / 2) {
            gpj.scale(GL.R);
            for (let it = 0; it < 4; it++) {
                gpj.rotate(GL.rot);
                const q = gpj(g);
                if (!q)
                    break;
                const sens = 57.3 / GL.R;
                GL.rot = [GL.rot[0] + (pt[0] - q[0]) * sens, Math.max(-85, Math.min(85, GL.rot[1] - (pt[1] - q[1]) * sens)), 0];
            }
        }
    }
    else {
        GL.R = R0() * t.k;
        if (e.sourceEvent) {
            const sens = 57.3 / GL.R;
            GL.rot = [GL.rot[0] + dx * sens, Math.max(-85, Math.min(85, GL.rot[1] - dy * sens)), 0];
        }
    }
    gReq();
    if (!PS.on && !GL.morph && GL.R >= swR()) {
        cancelAnimationFrame(gRaf);
        gRaf = 0;
        clearTimeout(gFineT);
        exitGlobe([-GL.rot[0], -GL.rot[1]], GL.R / flatS());
    }
});
// 地球儀のダブルクリックで寄る
gsv.call(gzoom).on("dblclick.zoom", null).on("dblclick", e => {
    if (PS.on)
        return;
    const c = gpj.invert(d3.pointer(e));
    if (c)
        exitGlobe(c, Math.max(kRef(), 2));
});
// setGlobeZoom＝地球儀の拡大率を設定する
function setGlobeZoom(k) {
    GL.quiet = true;
    gsv.call(gzoom.transform, d3.zoomIdentity.translate(W / 2 * (1 - k), H / 2 * (1 - k)).scale(k));
    GL.quiet = false;
}
// showGlobe＝地球儀を表示（平面の地図を隠す）
function showGlobe() {
    const zc = document.getElementById("zcomp");
    if (zc)
        zc.hidden = true;
    if (!PS.on && window.__tripLbl)
        window.__tripLbl(null);
    // back on the globe (the whole view): no trip is selected
    if (!PS.on) {
        document.querySelectorAll(".seg .chip").forEach(c => c.setAttribute("aria-pressed", "false"));
        document.querySelectorAll(".areas[data-for]").forEach(g => {
            g.hidden = true;
        });
        if (typeof playLabel === "function")
            playLabel();
    }
    GL.on = true;
    window.__globeOn = true;
    gsv.style("display", null);
    svg.style("visibility", "hidden");
    stage.classList.add("isglobe");
    lodtag.innerHTML = "";
}
// enterGlobe＝平面の地図から地球儀へ、変形アニメーションで切り替える
async function enterGlobe(center, opt = {}) {
    if (typeof closePanel === "function" && !opt.keepPanel)
        closePanel();
    const k = opt.k || 1;
    if (!GL.on) {
        const T = opt.T || cur, c0 = proj.invert(T.invert([W / 2, H / 2]));
        const c = c0 && isFinite(c0[0]) ? c0 : [-GL.rot[0], -GL.rot[1]];
        showGlobe();
        GL.R = R0() * k;
        setGlobeZoom(k);
        if (!opt.instant && !RM()) {
            gsv.interrupt("grot");
            await runMorph(1, 0, c, [-c[0], -c[1], 0], GL.R, T, opt.mdur || 700);
        }
        GL.rot = [-c[0], -c[1], 0];
        GL.flatQuiet = true;
        svg.interrupt();
        svg.call(zoom.transform, d3.zoomIdentity);
        GL.flatQuiet = false;
    }
    else {
        GL.R = R0() * k;
        setGlobeZoom(k);
    }
    const to = opt.reset ? [-62, -32, 0] : center ? [-center[0], -center[1], 0] : null;
    if (to && (opt.anim || opt.reset) && !RM()) {
        const r0 = GL.rot.slice();
        while (r0[0] - to[0] > 180)
            r0[0] -= 360;
        while (r0[0] - to[0] < -180)
            r0[0] += 360;
        const ip = d3.interpolate(r0, to);
        return gsv.transition("grot").duration(opt.dur || 800).ease(d3.easeCubicInOut).tween("rot", () => t => {
            GL.rot = ip(t);
            gCoarse = t < 1;
            renderGlobe();
        }).end().catch(() => { });
    }
    if (to)
        GL.rot = to;
    renderGlobe();
}
