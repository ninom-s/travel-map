// ======================================================================
// 22. 乗り物と目線モード  (22-vehicles.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- vehicles on the route (playback) + "ride" view ----
// VEH_NAME＝乗り物の名前（パネル用）
const VEH_NAME = { air: "飛行機", train: "列車", bus: "バス", taxi: "タクシー", boat: "船", car: "サファリジープ", van: "ツアーのバン", walk: "徒歩" };
// VEH_ICON＝乗り物の絵（SVG）
const VEH_ICON = {
    air: `<path d="M-11,0 L-7,-1.8 L9,-1.8 Q12.5,0 9,1.8 L-7,1.8Z" fill="#fff" stroke="#1b2329" stroke-width="1.1"/><path d="M-0.5,-1.7 L-4.5,-10.5 L-1.8,-10.5 L4.5,-1.7Z M-0.5,1.7 L-4.5,10.5 L-1.8,10.5 L4.5,1.7Z M-8.5,-1.4 L-10.8,-5.6 L-9,-5.6 L-5.8,-1.4Z M-8.5,1.4 L-10.8,5.6 L-9,5.6 L-5.8,1.4Z" fill="var(--air)"/><circle cx="7.2" cy="0" r=".9" fill="#7fb2dc"/>`,
    train: `<path d="M-11,-5 H6 Q11,-5 11.5,1 V4 H-11Z" fill="var(--train)" stroke="#1b2329" stroke-width="1"/><rect x="-9" y="-3.2" width="4" height="3" rx=".6" fill="#fff"/><rect x="-3.5" y="-3.2" width="4" height="3" rx=".6" fill="#fff"/><path d="M2,-3.2 H6.5 Q9,-3.2 9.6,-.2 H2Z" fill="#fff"/><path d="M-11,4 H11.5" stroke="#1b2329" stroke-width="1"/><circle cx="-6" cy="5.6" r="1.5" fill="#1b2329"/><circle cx="6" cy="5.6" r="1.5" fill="#1b2329"/>`,
    bus: `<rect x="-11" y="-6" width="22" height="10.5" rx="2.2" fill="var(--bus)" stroke="#1b2329" stroke-width="1"/><rect x="-9" y="-4" width="3.6" height="3.4" rx=".5" fill="#fff"/><rect x="-4.4" y="-4" width="3.6" height="3.4" rx=".5" fill="#fff"/><rect x=".2" y="-4" width="3.6" height="3.4" rx=".5" fill="#fff"/><rect x="5" y="-4" width="4.4" height="6" rx=".6" fill="#fff"/><circle cx="-6" cy="5" r="2" fill="#1b2329"/><circle cx="6" cy="5" r="2" fill="#1b2329"/>`,
    taxi: `<path d="M-11,1.5 L-9,-2.5 L-5,-3 L-2.5,-6 H4 L7,-3 L10.5,-2 L11,1.5 V4 H-11Z" fill="var(--taxi)" stroke="#1b2329" stroke-width="1"/><rect x="-1.6" y="-8.4" width="4.4" height="2.2" rx=".5" fill="#fff" stroke="#1b2329" stroke-width=".7"/><path d="M-1.6,-5 H3.4 L5.6,-3 H-3.4Z" fill="#fff"/><circle cx="-6" cy="4.4" r="2.1" fill="#1b2329"/><circle cx="6.5" cy="4.4" r="2.1" fill="#1b2329"/>`,
    boat: `<path d="M-11,1 H11 L8,6 H-8Z" fill="var(--boat)" stroke="#1b2329" stroke-width="1"/><rect x="-6" y="-4" width="10" height="5" rx="1" fill="#fff" stroke="#1b2329" stroke-width=".9"/><rect x="-3" y="-8" width="2" height="4" fill="#1b2329"/><path d="M-12,8 Q-9,6.5 -6,8 T0,8 T6,8 T12,8" fill="none" stroke="var(--boat)" stroke-width="1"/>`,
    car: `<path d="M-11,2 V-3 H-6 L-4,-7 H5 L7,-3 H11 V2Z" fill="var(--car)" stroke="#1b2329" stroke-width="1"/><rect x="-3" y="-5.5" width="3.4" height="2.6" fill="#fff"/><rect x="1.6" y="-5.5" width="3.4" height="2.6" fill="#fff"/><rect x="-12.5" y="-2" width="2" height="4" rx=".6" fill="#1b2329"/><circle cx="-6" cy="3.6" r="2.4" fill="#1b2329"/><circle cx="6" cy="3.6" r="2.4" fill="#1b2329"/>`,
    van: `<path d="M-11,3 V-5 Q-11,-7 -9,-7 H5 L10,-2 Q11,-1 11,1 V3Z" fill="var(--car)" stroke="#1b2329" stroke-width="1"/><rect x="-8.6" y="-5" width="3.6" height="3" rx=".5" fill="#fff"/><rect x="-3.8" y="-5" width="3.6" height="3" rx=".5" fill="#fff"/><path d="M1,-5 H4.6 L8,-2 H1Z" fill="#fff"/><circle cx="-6" cy="3.5" r="2.4" fill="#1b2329"/><circle cx="6" cy="3.5" r="2.4" fill="#1b2329"/>`,
    walk: `<circle cx="0" cy="-7" r="2.4" fill="#1b2329"/><path d="M0,-4 L0,2 M0,2 L-3.5,8 M0,2 L3.5,8 M0,-2.5 L-4,1 M0,-2.5 L4,0" stroke="#1b2329" stroke-width="2" stroke-linecap="round"/>`
};
// SIDE＝横から見た絵を使う乗り物（飛行機は上から見た絵）
const SIDE = new Set(["train", "bus", "taxi", "boat", "car", "van", "walk"]);
// gVeh＝平面の地図側の乗り物の層。gVehG＝地球儀側の層
const gVeh = rotg.append("g").attr("class", "vehl");
const gVehG = gsv.append("g").attr("class", "vehl");
// VS＝乗り物の状態：el 要素／m 手段／frac 進み具合(0〜1)／layer 層／ks 通る地点／rot 向き／ride 乗車中か
const VS = { el: null, m: null, frac: 0, layer: null, ks: null, rot: 0, ride: null, drawn: null };
// vehNode＝乗り物の SVG 要素を作る（なければ新規、あれば使い回し）
function vehNode() {
    const g = VS.layer === "g" ? gVehG : gVeh;
    if (VS.drawn !== VS.layer) {
        gVeh.selectAll("*").remove();
        gVehG.selectAll("*").remove();
        VS.drawn = VS.layer;
    }
    let v = g.select("g.veh");
    if (v.empty()) {
        v = g.append("g").attr("class", "veh").attr("role", "button").attr("tabindex", 0);
        v.append("circle").attr("class", "vring").attr("r", 21);
        v.append("circle").attr("class", "vbg").attr("r", 16);
        v.append("g").attr("class", "vic");
        v.on("click", e => {
            e.stopPropagation();
            startRide();
        }).on("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                startRide();
            }
        });
    }
    return v;
}
// hideVeh＝乗り物を隠す
function hideVeh() {
    gVeh.selectAll("*").remove();
    gVehG.selectAll("*").remove();
    VS.el = null;
    VS.drawn = null;
    VS.ride = null;
}
// setVeh＝乗り物を指定の層・手段・進み具合に置く
function setVeh(layer, el, m, frac, ks) {
    VS.layer = layer;
    VS.el = el;
    VS.m = m;
    VS.frac = frac;
    VS.ks = ks;
    drawVeh();
}
// vehPt＝進み具合 f の位置の座標と進行方向を返す
function vehPt(f) {
    const el = VS.el, L = el.getTotalLength(), e = Math.max(.5, L * .012);
    const tf = x => VS.layer === "f" ? cur.apply([x.x, x.y]) : [x.x, x.y];
    const p = tf(el.getPointAtLength(Math.max(0, Math.min(L, L * f))));
    let q;
    if (L * f + e <= L)
        q = tf(el.getPointAtLength(L * f + e));
    else {
        const r = tf(el.getPointAtLength(Math.max(0, L * f - e)));
        q = [2 * p[0] - r[0], 2 * p[1] - r[1]];
    }
    return { p, h: Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI };
}
// drawVeh＝乗り物をいまの位置・向きで描く（地図の拡大・回転に合わせて大きさを補正）
function drawVeh() {
    if (!VS.el)
        return;
    let p, h;
    if (VS.ride) {
        p = VS.ride.p;
        h = VS.ride.h;
    }
    else {
        if (!VS.el.isConnected)
            return;
        ({ p, h } = vehPt(VS.frac));
    }
    if (!p || !isFinite(p[0]))
        return;
    const v = vehNode();
    v.attr("transform", `translate(${p[0]},${p[1]})`).attr("class", "veh " + VS.m + (VS.ride ? " riding" : "")).attr("aria-label", `${VEH_NAME[VS.m] || "乗り物"}の目線で見る`);
    const ic = v.select(".vic");
    if (ic.attr("data-m") !== VS.m)
        ic.attr("data-m", VS.m).html(VEH_ICON[VS.m] || VEH_ICON.bus);
    const vis = h + VS.rot;
    if (SIDE.has(VS.m)) {
        const left = Math.cos(vis * Math.PI / 180) < 0;
        ic.attr("transform", `rotate(${-VS.rot}) scale(${left ? -1 : 1},1)`);
    }
    else
        ic.attr("transform", `rotate(${h})`);
}
// 地図が動いたら乗り物の位置を合わせ直す
zoom.on("zoom.veh", () => {
    if (VS.el && VS.layer === "f" && !VS.ride)
        drawVeh();
});
// テスト・再生用：乗り物を描き直す
window.__vehRedraw = l => {
    if (VS.el && VS.layer === l && !VS.ride)
        drawVeh();
};
// ride: follow the vehicle with its heading pointing up
let RIDE = null;
// uprightOverlay＝乗車中は地図が回るので、名前とイラストを逆向きに回して正立に保つ
function uprightOverlay(th) {
    for (const it of items) {
        const el = it.el;
        if (th && el.style.display === "none")
            continue;
        if (el.tagName === "text") {
            el.setAttribute("transform", th ? `rotate(${-th},${el.getAttribute("x")},${el.getAttribute("y")})` : "");
        }
        else {
            el.setAttribute("transform", `translate(${el.dataset.ax},${el.dataset.ay})` + (th ? ` rotate(${-th})` : ""));
        }
    }
}
// angD＝2つの角度の差
const angD = (a, b) => nrm(b - a);
// rideCap＝乗車モードの字幕を出す／消す
function rideCap(on) {
    if (on) {
        RIDE.cap = [pDate.textContent, pName.textContent, pNote.textContent, pNote.hidden];
        const to = nameOf(VS.ks[VS.ks.length - 1]);
        pDate.textContent = `${VEH_NAME[VS.m] || "乗り物"}の目線`;
        pName.textContent = `${to}へ`;
        pNote.textContent = "地図に触れると止まる";
        pNote.hidden = false;
        playEl.classList.add("riding");
    }
    else if (RIDE && RIDE.cap) {
        [pDate.textContent, pName.textContent, pNote.textContent] = RIDE.cap;
        pNote.hidden = RIDE.cap[3];
        playEl.classList.remove("riding");
    }
}
// startRide＝乗り物の進行方向が上になるよう視点を合わせて追いかける（乗車モード）
function startRide() {
    if (!VS.el || RIDE || GL.morph)
        return;
    const was = PS.on && !PS.paused;
    if (was)
        pausePlay();
    RIDE = { was, cancel: false };
    rideCap(true);
    stage.classList.add("riding");
    (VS.layer === "g" ? rideGlobe : rideFlat)().then(() => {
        rideCap(false);
        stage.classList.remove("riding");
        const w = RIDE.was && !RIDE.cancel;
        RIDE = null;
        if (w)
            resumePlay();
    });
}
// ユーザーが地図を触ったら乗車モードを終える
zoom.on("start.ride", e => {
    if (e.sourceEvent && RIDE)
        RIDE.cancel = true;
});
// rideFlat＝平面の地図での乗車（毎フレーム、乗り物の位置・向きに視点を合わせる）
function rideFlat() {
    return new Promise(res => {
        const el = VS.el, L = el.getTotalLength(), S = [W / 2, H * 0.64];
        const kR = Math.max(kRef() * 1.6, Math.min(140, Math.min(W, H) * 2.4 / Math.max(L, 1e-3)));
        const D = Math.max(3800, Math.min(8000, 3000 + L * kR / Math.min(W, H) * 900)), A = 850, C = 900;
        const c0 = cur.invert([W / 2, H / 2]), k0 = cur.k, pt = f => {
            const q = el.getPointAtLength(Math.max(0, Math.min(L, L * f)));
            return [q.x, q.y];
        };
        const hd = f => {
            const a = pt(f), b = pt(Math.min(1, f + 0.01)), c = f > 0.99 ? pt(f - 0.01) : null;
            return c ? Math.atan2(a[1] - c[1], a[0] - c[0]) * 180 / Math.PI : Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
        };
        let th = 0, T1 = null;
        const step = PLAYS[PS.trip] && PLAYS[PS.trip][PS.i];
        const apply = (c, k, t, f) => {
            VS.rot = t;
            GL.flatQuiet = true;
            svg.call(zoom.transform, d3.zoomIdentity.translate(S[0], S[1]).scale(k).translate(-c[0], -c[1]));
            GL.flatQuiet = false;
            rotg.attr("transform", t ? `rotate(${t},${S[0]},${S[1]})` : null);
            uprightOverlay(t);
            const q = cur.apply(pt(f));
            VS.ride = { p: q, h: hd(f) };
            drawVeh();
        };
        const fin = () => {
            VS.rot = 0;
            VS.ride = null;
            rotg.attr("transform", null);
            uprightOverlay(0);
            place();
            clearTimeout(dt);
            dt = setTimeout(declutter, 40);
            VS.frac = 1;
            drawVeh();
            res();
        };
        const tm = d3.timer(e => {
            if (RIDE.cancel) {
                tm.stop();
                const t = th;
                VS.rot = 0;
                VS.ride = null;
                rotg.attr("transform", null);
                uprightOverlay(0);
                commitBear(t, S);
                VS.frac = 1;
                drawVeh();
                res();
                return;
            }
            if (e < A) {
                const u = d3.easeCubicInOut(e / A), p0 = pt(0), h0 = -90 - hd(0);
                th = angD(0, h0) * u;
                const k = k0 * Math.pow(kR / k0, u), c = [c0[0] + (p0[0] - c0[0]) * u, c0[1] + (p0[1] - c0[1]) * u];
                VS.rot = th;
                GL.flatQuiet = true;
                svg.call(zoom.transform, d3.zoomIdentity.translate(W / 2 + (S[0] - W / 2) * u, H / 2 + (S[1] - H / 2) * u).scale(k).translate(-c[0], -c[1]));
                GL.flatQuiet = false;
                rotg.attr("transform", th ? `rotate(${th},${S[0]},${S[1]})` : null);
                uprightOverlay(th);
                VS.ride = { p: cur.apply(pt(0)), h: hd(0) };
                drawVeh();
                return;
            }
            if (e < A + D) {
                const f = d3.easeSinInOut((e - A) / D), tgt = -90 - hd(f);
                th += angD(th, tgt) * 0.08;
                apply(pt(f), kR, th, f);
                return;
            }
            if (!T1) {
                T1 = { t0: e, c: pt(1), th, T: step ? fitLegs(step.legs) : d3.zoomIdentity };
            }
            const u = Math.min(1, (e - T1.t0) / C), uu = d3.easeCubicInOut(u), tt = T1.th * (1 - uu);
            const ip = d3.interpolateZoom([T1.c[0], T1.c[1], Math.min(W, H) / kR], [...T1.T.invert([W / 2, H / 2]), Math.min(W, H) / T1.T.k]), z = ip(uu);
            VS.rot = tt;
            GL.flatQuiet = true;
            svg.call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(Math.min(W, H) / z[2]).translate(-z[0], -z[1]));
            GL.flatQuiet = false;
            rotg.attr("transform", tt ? `rotate(${tt},${W / 2},${H / 2})` : null);
            uprightOverlay(tt);
            VS.ride = null;
            VS.frac = 1;
            drawVeh();
            if (u >= 1) {
                tm.stop();
                fin();
            }
        });
    });
}
// rideGlobe＝地球儀での乗車（飛行機が弧を描いて飛ぶのを追う）
function rideGlobe() {
    return new Promise(res => {
        const ks = VS.ks, pts = ks.map(k => P[k]), seg = [];
        let tot = 0;
        for (let i = 1; i < pts.length; i++) {
            const l = d3.geoDistance(pts[i - 1], pts[i]);
            seg.push(l);
            tot += l;
        }
        const at = f => {
            let t = Math.max(0, Math.min(1, f)) * tot;
            for (let i = 0; i < seg.length; i++) {
                if (t <= seg[i] || i === seg.length - 1)
                    return d3.geoInterpolate(pts[i], pts[i + 1])(seg[i] ? Math.min(1, t / seg[i]) : 0);
                t -= seg[i];
            }
            return pts[pts.length - 1];
        };
        const Rr = R0() * 3.4, D = 7000, A = 900, C = 1000, r0 = GL.rot.slice(), R0v = GL.R;
        let sg = null;
        const scr = (rot, R, g) => {
            gpj.translate([W / 2, H / 2]).scale(R).rotate(rot);
            return gpj(g);
        };
        const heading = (g, g2, rot, R) => {
            const a = scr(rot, R, g), b = scr(rot, R, g2);
            return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
        };
        const gam = (f, R) => {
            const g = at(f), g2 = at(Math.min(1, f + 0.004)), base = [-g[0], -g[1], 0];
            const h0 = heading(g, g2, base, R);
            if (sg === null) {
                const h1 = heading(g, g2, [base[0], base[1], 10], R);
                sg = Math.sign(angD(h0, h1)) || 1;
            }
            return nrm((-90 - h0) / sg);
        };
        let gm = 0, T1 = null;
        const draw = (rot, R, f) => {
            GL.rot = rot;
            GL.R = R;
            gCoarse = true;
            renderGlobe();
            const g = at(f);
            VS.ride = { p: scr(rot, R, g), h: -90 };
            drawVeh();
        };
        const tm = d3.timer(e => {
            if (RIDE.cancel) {
                tm.stop();
                VS.ride = null;
                gCoarse = false;
                renderGlobe();
                res();
                return;
            }
            if (e < A) {
                const u = d3.easeCubicInOut(e / A), g = at(0), tg = gam(0, Rr);
                gm = tg * u;
                const lon = r0[0] + angD(r0[0], -g[0]) * u, lat = r0[1] + (-g[1] - r0[1]) * u;
                draw([lon, lat, gm], R0v * Math.pow(Rr / R0v, u), 0);
                return;
            }
            if (e < A + D) {
                const f = d3.easeSinInOut((e - A) / D), g = at(f);
                gm += angD(gm, gam(f, Rr)) * 0.08;
                draw([-g[0], -g[1], gm], Rr, f);
                return;
            }
            if (!T1)
                T1 = { t0: e, rot: GL.rot.slice() };
            const u = Math.min(1, (e - T1.t0) / C), uu = d3.easeCubicInOut(u), to = [-75, -72, 0];
            draw([T1.rot[0] + angD(T1.rot[0], to[0]) * uu, T1.rot[1] + (to[1] - T1.rot[1]) * uu, T1.rot[2] + angD(T1.rot[2], 0) * uu], Rr * Math.pow(Math.min(W, H) * 0.47 / Rr, uu), 1);
            if (u >= 1) {
                tm.stop();
                VS.ride = null;
                GL.rot = [-75, -72, 0];
                GL.R = Math.min(W, H) * 0.47;
                setGlobeZoom(GL.R / R0());
                gCoarse = false;
                renderGlobe();
                VS.frac = 1;
                drawVeh();
                res();
            }
        });
    });
}
