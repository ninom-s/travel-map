// ======================================================================
// 12. 国バッジ  (12-country-badge.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// 国に寄ると、左上にその国の国旗が出る（押すと国の詳細とあいさつ）
const cbadge = document.getElementById("cbadge");
let badgeIso = "";
// updBadge＝画面の中央にある国を調べ、旅した国なら国旗の札を出す（違えば隠す）
function updBadge() {
    let iso = "";
    if (!window.__globeOn && proj.scale() * cur.k * Math.PI / 180 >= 14) {
        const r = svg.node().getBoundingClientRect(), vb = svg.node().viewBox.baseVal, w = vb && vb.width ? vb.width : r.width, h = vb && vb.height ? vb.height : r.height;
        const q = proj.invert(cur.invert([w / 2, h / 2]));
        if (q && isFinite(q[0])) {
            const f = FLG.find(f => (FLAGX[f.id] || []).some(tripOn) && d3.geoContains(f, q));
            if (f)
                iso = f.id;
        }
    }
    if (iso === badgeIso)
        return;
    badgeIso = iso;
    if (!iso) {
        cbadge.hidden = true;
        return;
    }
    const nm = window.__countryName ? window.__countryName(iso) : iso;
    cbadge.innerHTML = flagSVG(iso) + `<span>${esc(nm)}<br><small>押すと国の詳細・あいさつ</small></span>`;
    cbadge.style.top = (lodtag.offsetTop + lodtag.offsetHeight + 8) + "px";
    cbadge.hidden = false;
}
// 札を押すと、その国の詳細パネル（国旗・言語・あいさつ）を開く
cbadge.addEventListener("click", () => {
    if (!badgeIso)
        return;
    const f = document.createElement("i");
    f.className = "flg";
    f.dataset.c = badgeIso;
    select(f);
});
