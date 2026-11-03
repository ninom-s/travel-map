// ======================================================================
// 08. 旅の表示状態  (08-trip-state.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// Mの旅（ninomの旅ではない）は、スイッチを入れたときだけ出す
// 旅の表示スイッチ：Sの旅＝ヨーロッパ一周、ふたりの旅＝エジプト・ケニア、Mの旅＝ハワイ・韓国・ロンドン
// SHOW＝旅ごとの表示ON/OFF（最初はヨーロッパ一周とエジプト・ケニアがON）。GRPS＝タブ名→旅の一覧
// （sg＝ヨーロッパ、fu＝エジプト・ケニア、mina＝ミナの旅、th＝タイ、cn＝中国）
const SHOW = { eu: true, af: true, hi: false, ko: false, ld: false, th: false, cn: false }, GRPS = { sg: ["eu"], fu: ["af"], mina: ["hi", "ko", "ld"], th: ["th"], cn: ["cn"] };
// tripOn＝その旅を表示中か。TRNT＝乗り継ぎ地点がどの旅のものか
const tripOn = t => !(t in SHOW) || SHOW[t], TRNT = { ICN: "ko", HEL: "eu", PEK: "af", DOH: "af", BAH: "af", GZ: "af", HND: "af" };
// SHOW の状態を body の「off-旅」クラスに反映する（CSSが、その旅の線・点・名前を隠す）
const syncShow = () => Object.keys(SHOW).forEach(t => document.body.classList.toggle("off-" + t, !SHOW[t]));
// 最初の状態を反映
syncShow();
// 地点コードから表示名を引く（寄港地 → 経由地 → 乗り継ぎ地 → コードそのまま）
const nameOf = k => {
    for (const t of TRIPS) {
        const s = t.stops.find(s => s.k === k);
        if (s)
            return s.name;
    }
    return WPN[k] || TRN[k] || k;
};
// waypoint -> which leg it belongs to
const wpInfo = {};
// 経由地ごとに、どの旅のどの区間（出発地→到着地）に属するかを wpInfo に記録する（飛行機と乗れなかった予定は除く）
TRIPS.forEach(t => t.seg.forEach(([m, kind, ks]) => {
    if (m === "air" || m === "plan")
        return;
    ks.forEach((k, i) => {
        if (!WPN[k] || wpInfo[k])
            return;
        wpInfo[k] = { trip: t.key, mode: m, kind, from: nameOf(ks[0]), to: nameOf(ks[ks.length - 1]) };
    });
}));
