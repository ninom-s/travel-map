// ======================================================================
// 16. ジャンプ・ズーム・全画面  (16-navigation.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// jump targets
const JUMP = { all: allKeys, eu: EU.stops.map(s => s.k).concat(["GLF"]), nordic: ["ARN", "HEL", "RVN", "AUR", "RNZ"], uk: ["LON", "EDI", "FTW", "GLF", "OXF", "CHC", "CAR"],
    med: ["BCN", "MRS", "NCE", "MCO", "GEN", "MIL"], alps: ["MIL", "STM", "TIR", "VCE", "BZO", "CHI", "INN"], de: ["MUC", "FUS", "NOE", "ROT", "NUE", "WUE", "FRA"],
    riv: ["NCE", "MCO", "MEN", "VTM", "SRM", "CNS"], detour: ["NCE", "SRM", "SAV", "TUR", "LAM", "MIL"], strike: ["VCE", "MES", "VRN", "TRE", "BZO"], af: AF.stops.map(s => s.k), hi: ["HNL", "HIW", "HIE"], ko: ["ICN", "GBG", "MDG", "NDM", "FLK"], ld: ["ECT", "BKP", "HPC", "PRW", "MMW", "PCC", "TOL", "LDM", "SPX", "ZTA"], eg: ["CAI", "GIZ", "LXR", "HRG", "QEN", "EDS", "SAF", "DEN", "PDI"], ke: ["NBO", "KCP", "AMB", "KIL", "EML", "KIM"], th: ["BKK", "AYT", "PSL", "LPG", "CNX", "DIN"], cn: ["BJG", "TSN", "XIY", "SHH", "TAO", "WUS"] };
// kFor＝ジャンプ先 key（JUMP のキー）の地点がすべて収まる拡大率を計算する
function kFor(key) {
    const pts = JUMP[key].map(k => proj(P[k]));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return Math.max(1, Math.min(160, 0.8 / Math.max((Math.max(...xs) - Math.min(...xs)) / W, (Math.max(...ys) - Math.min(...ys)) / H, 1e-3)));
}
// kRef＝全体表示の基準の拡大率（ヨーロッパ一周が収まる倍率）。画面サイズが変わったら計算し直す
let _kr = null, _krW = 0;
function kRef() {
    if (_krW !== W * 10000 + H) {
        _kr = kFor("eu");
        _krW = W * 10000 + H;
    }
    return _kr;
}
// jump＝ジャンプ先 key の地点が収まる位置・拡大率へ、アニメーション付きで移動する（動きを減らす設定なら即移動）
function jump(key, anim = true) {
    const pts = JUMP[key].map(k => proj(P[k]));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = Math.max(1, Math.min(160, 0.8 / Math.max((x1 - x0) / W, (y1 - y0) / H, 1e-3)));
    const t = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    (anim && !reduce ? svg.transition().duration(750) : svg).call(zoom.transform, t);
}
// data-jump の付いたボタン（ヨーロッパ・北欧など）を押したときの動き
document.querySelectorAll("[data-jump]").forEach(b => b.addEventListener("click", () => {
    jump(b.dataset.jump);
    if (b.dataset.trip) {
        document.querySelectorAll(".seg .chip").forEach(c => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
        document.querySelectorAll(".areas").forEach(g => {
            g.hidden = g.dataset.for !== b.dataset.trip;
        });
        document.querySelectorAll(".areas .chip").forEach(c => c.setAttribute("aria-pressed", "false"));
    }
    else {
        const g = b.closest(".areas");
        if (g)
            g.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
    }
}));
// 拡大・縮小ボタン
document.getElementById("zin").addEventListener("click", () => svg.transition().duration(300).call(zoom.scaleBy, 2));
document.getElementById("zout").addEventListener("click", () => svg.transition().duration(300).call(zoom.scaleBy, .5));
// build＝地図全体を組み立て直す（土台→国旗→重なり避け→イラスト配置の順）
function build() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    fitBase();
    zoom.extent([[0, 0], [W, H]]).translateExtent([[-W * 1.1, -H * 1.1], [W * 2.1, H * 2.1]]);
    drawBase();
    drawOverlay();
    gMap.attr("transform", cur);
    place();
    declutter();
    if (window.__playRedraw)
        window.__playRedraw();
    if (window.__globeRedraw)
        window.__globeRedraw();
    if (window.__vehRedraw)
        window.__vehRedraw("f");
}
// 最初の描画
build();
// rt＝リサイズの間引きタイマー。lw/lh＝前回の幅・高さ
let rt, lw = W, lh = H;
new ResizeObserver(() => {
    if (!stage.clientWidth)
        return;
    if (Math.abs(stage.clientWidth - lw) < 8 && Math.abs(stage.clientHeight - lh) < 8)
        return;
    lw = stage.clientWidth;
    lh = stage.clientHeight;
    clearTimeout(rt);
    rt = setTimeout(rebuildKeep, 120);
}).observe(stage);
// テスト用：指定の地点・拡大率へ即座に移動する
window.__zoomTo = (key, k) => {
    const p = proj(P[key]);
    svg.call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-p[0], -p[1]));
};
// rebuildKeep＝いまの表示位置を保ったまま、地図を組み立て直す
function rebuildKeep() {
    zoom.scaleExtent([0.82, KMAX()]);
    const geo = proj.invert(cur.invert([W / 2, H / 2]));
    const k = cur.k;
    build();
    const p = proj(geo);
    if (!p || !isFinite(p[0]))
        return;
    svg.call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-p[0], -p[1]));
}
// full screen (CSS-based, works on iPhone and Android)
const zfull = document.getElementById("zfull");
// setFull＝全画面の ON/OFF。変わったら地図の大きさを取り直す
function setFull(on) {
    stage.classList.toggle("full", on);
    document.body.classList.toggle("isfull", on);
    zfull.textContent = on ? "✕" : "⤢";
    requestAnimationFrame(fitPanel);
    zfull.setAttribute("aria-label", on ? "全画面を閉じる" : "全画面で見る");
    lw = -1;
    rebuildKeep();
    lw = stage.clientWidth;
    lh = stage.clientHeight;
}
// 全画面ボタン
zfull.addEventListener("click", () => setFull(!stage.classList.contains("full")));
// Esc で全画面を解除
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && stage.classList.contains("full"))
        setFull(false);
});
