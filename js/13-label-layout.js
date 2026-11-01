// ======================================================================
// 13. 名前ラベルの重なり回避  (13-label-layout.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// place＝全部の点・名前・イラストを、いまの拡大・移動に合わせて画面上の位置に置き直す。
// 拡大の段階（lod）が変わったら、地図のクラスと左上の説明札も切り替える
function place() {
    items.forEach(it => {
        const p = proj(it.geo);
        const [x, y] = cur.apply(p);
        if (it.el.tagName === "text") {
            it.el.setAttribute("x", x + (it.dx || 0));
            it.el.setAttribute("y", y + (it.dy || 0));
            it.el.setAttribute("text-anchor", it.anchor || "start");
            it.el.dataset.ax = x;
            it.el.dataset.ay = y;
            it.el.style.display = "";
        }
        else {
            it.el.setAttribute("transform", `translate(${x},${y})`);
            it.el.dataset.ax = x;
            it.el.dataset.ay = y;
        }
    });
    const lod = lodOf(cur.k);
    svg.attr("class", `z${lod}${lod < 3 ? " lo" : ""}`);
    if (lod !== lastLod && !window.__globeOn) {
        lodtag.innerHTML = LODTXT[lod];
        lastLod = lod;
    }
    if (typeof applyIcons === "function" && gOver.node().querySelector(".ill"))
        applyIcons();
    updBadge();
    if (window.__rlPin)
        window.__rlPin();
}
// keep labels from overlapping: names stay beside their point or hide; optional labels hide
function declutter() {
    const sr = stage.getBoundingClientRect();
    const R = el => {
        const r = el.getBoundingClientRect();
        return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height };
    };
    const obst = [...gOver.node().querySelectorAll(".stop .pt,.tr .pt,.wp .pt,.ev .bg,.mk")].map(R).filter(b => b.w);
    const zb = document.querySelector(".zbtns").getBoundingClientRect();
    obst.push({ x: zb.left - sr.left, y: zb.top - sr.top, w: zb.width, h: zb.height });
    const lt = lodtag.getBoundingClientRect();
    obst.push({ x: lt.left - sr.left, y: lt.top - sr.top, w: lt.width, h: lt.height });
    const placed = [];
    const hit = b => b.x < 2 || b.y < 2 || b.x + b.w > sr.width - 2 || b.y + b.h > sr.height - 2 || obst.concat(placed).some(o => b.x < o.x + o.w + 2 && b.x + b.w + 2 > o.x && b.y < o.y + o.h + 2 && b.y + b.h + 2 > o.y);
    const PR = t => {
        const v = +t.dataset.pr;
        return isNaN(v) ? 5 : v;
    };
    const labels = [...gOver.node().querySelectorAll("text")].filter(t => !t.closest(".ill") && t.getClientRects().length).sort((a, b) => PR(a) - PR(b));
    const placeIcons = () => {
        applyIcons();
        for (const g of gOver.node().querySelectorAll(".ill")) {
            if (g.style.display === "none" || !g.getClientRects().length)
                continue;
            const b = R(g.querySelector(".ic .bg"));
            if (b.w)
                placed.push({ x: b.x - 3, y: b.y - 3, w: b.w + 6, h: b.h + 6 });
        }
    };
    placeIcons();
    for (const t of labels) {
        const ax = +t.dataset.ax, ay = +t.dataset.ay, d = +t.dataset.d || 10;
        if (ax < -50 || ay < -50 || ax > sr.width + 50 || ay > sr.height + 50) {
            t.style.display = "none";
            continue;
        }
        const o = [+t.getAttribute("x"), +t.getAttribute("y"), t.getAttribute("text-anchor") || "start"];
        const C = [o, [ax + d, ay + 4, "start"], [ax - d, ay + 4, "end"], [ax, ay - d + 1, "middle"], [ax, ay + d + 9, "middle"], [ax + d - 3, ay - d + 3, "start"], [ax - d + 3, ay - d + 3, "end"], [ax + d - 3, ay + d + 7, "start"], [ax - d + 3, ay + d + 7, "end"]];
        let done = false;
        for (const [x, y, an] of C) {
            t.setAttribute("x", x);
            t.setAttribute("y", y);
            t.setAttribute("text-anchor", an);
            const b = R(t);
            if (!hit(b)) {
                placed.push(b);
                done = true;
                break;
            }
        }
        if (!done) {
            t.setAttribute("x", o[0]);
            t.setAttribute("y", o[1]);
            t.setAttribute("text-anchor", o[2]);
            if (t.classList.contains("big"))
                placed.push(R(t));
            else
                t.style.display = "none";
        }
    }
}
