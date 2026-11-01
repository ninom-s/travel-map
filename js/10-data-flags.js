// ======================================================================
// 10. 国旗データ  (10-data-flags.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 国旗（旅した国を、国の形の国旗で塗る。押すと国の詳細とあいさつが出る） ----
// FLAGX＝国旗で塗る国（ISO3）→ どの旅で行った国か。旅のタブの選択に合わせて出し入れする
const FLAGX = { SWE: ["eu"], FIN: ["eu"], GBR: ["eu", "ld"], ESP: ["eu"], FRA: ["eu"], MCO: ["eu"], ITA: ["eu"], CHE: ["eu"], DEU: ["eu"], EGY: ["af"], KEN: ["af"], KOR: ["ko"], THA: ["th"], CHN: ["cn"] };
// 海外領土など、本土から離れた島は旗で塗らない（旗が国全体の外枠に合わせて広がるため、本土だけの範囲で決める）
const FLEXT = { GBR: [-8.7, 49.8, 2, 60.9], ESP: [-9.5, 35.9, 4.5, 43.9], FRA: [-5.5, 41, 9.7, 51.2], ITA: [6.5, 36.5, 18.7, 47.2], CHN: [73, 18, 135, 54], KEN: [33, -5, 42, 6] };
// FLAGS＝国旗の SVG（flags/ のファイルを使う）をまとめた表
const FLAGS = (() => {
    const R = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
    const star = (cx, cy, r, dir, f) => {
        const a = [];
        for (let i = 0; i < 10; i++) {
            const q = i % 2 ? r * .382 : r, t = dir + i * Math.PI / 5;
            a.push((cx + q * Math.cos(t)).toFixed(2) + "," + (cy + q * Math.sin(t)).toFixed(2));
        }
        return `<polygon points="${a.join(" ")}" fill="${f}"/>`;
    };
    const tri = (sx, sy, pat) => {
        const rx = sx * .75, ry = sy * .5, l = Math.hypot(rx, ry), phi = Math.atan2(-rx / l, ry / l) * 180 / Math.PI;
        return `<g transform="translate(${1.5 + rx},${1 + ry}) rotate(${phi.toFixed(1)})">${[-.125, 0, .125].map((y, i) => pat[i] === "1" ? R(-.25, y - .0415, .5, .083, "#000") : R(-.25, y - .0415, .21, .083, "#000") + R(.04, y - .0415, .21, .083, "#000")).join("")}</g>`;
    };
    return {
        SWE: [16, 10, R(0, 0, 16, 10, "#006AA7") + R(5, 0, 2, 10, "#FECC00") + R(0, 4, 16, 2, "#FECC00")],
        FIN: [18, 11, R(0, 0, 18, 11, "#fff") + R(5, 0, 3, 11, "#003580") + R(0, 4, 18, 3, "#003580")],
        GBR: [60, 30, `<clipPath id="ukclip"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>` + R(0, 0, 60, 30, "#012169") + `<path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#ukclip)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/>`],
        ESP: [6, 4, R(0, 0, 6, 4, "#AA151B") + R(0, 1, 6, 2, "#F1BF00")],
        FRA: [3, 2, R(0, 0, 1, 2, "#0055A4") + R(1, 0, 1, 2, "#fff") + R(2, 0, 1, 2, "#EF4135")],
        MCO: [5, 4, R(0, 0, 5, 2, "#CE1126") + R(0, 2, 5, 2, "#fff")],
        ITA: [3, 2, R(0, 0, 1, 2, "#009246") + R(1, 0, 1, 2, "#fff") + R(2, 0, 1, 2, "#CE2B37")],
        CHE: [32, 32, R(0, 0, 32, 32, "#DA291C") + R(13, 6, 6, 20, "#fff") + R(6, 13, 20, 6, "#fff")],
        DEU: [5, 3, R(0, 0, 5, 1, "#000") + R(0, 1, 5, 1, "#DD0000") + R(0, 2, 5, 1, "#FFCE00")],
        EGY: [3, 2, R(0, 0, 3, .667, "#CE1126") + R(0, .667, 3, .667, "#fff") + R(0, 1.333, 3, .667, "#000")],
        KEN: [90, 60, R(0, 0, 90, 18, "#000") + R(0, 18, 90, 3, "#fff") + R(0, 21, 90, 18, "#BB0000") + R(0, 39, 90, 3, "#fff") + R(0, 42, 90, 18, "#006600") + `<ellipse cx="45" cy="30" rx="9.5" ry="17" fill="#BB0000" stroke="#fff" stroke-width="1.6"/><ellipse cx="45" cy="30" rx="4.2" ry="12" fill="#000"/><path d="M45,12 V48" stroke="#fff" stroke-width="1.4"/>`],
        THA: [9, 6, R(0, 0, 9, 6, "#A51931") + R(0, 1, 9, 4, "#F4F5F8") + R(0, 2, 9, 2, "#2D2A4A")],
        KOR: [3, 2, R(0, 0, 3, 2, "#fff") + `<g transform="translate(1.5,1) rotate(-33.69)"><circle r=".5" fill="#CD2E3A"/><path d="M-.5,0 A.5,.5 0 0 0 .5,0 Z" fill="#0047A0"/><circle cx="-.25" r=".25" fill="#CD2E3A"/><circle cx=".25" r=".25" fill="#0047A0"/></g>` + tri(-1, -1, "111") + tri(1, -1, "010") + tri(-1, 1, "101") + tri(1, 1, "000")],
        CHN: [30, 20, R(0, 0, 30, 20, "#DE2910") + star(5, 5, 3, -Math.PI / 2, "#FFDE00") + [[10, 2], [12, 4], [12, 7], [10, 9]].map(([x, y]) => star(x, y, 1, Math.atan2(5 - y, 5 - x), "#FFDE00")).join("")]
    };
})();
// flagSVG＝国旗を1枚の SVG 要素に組み立てる（国の形でくり抜くための clipPath つき）
const flagSVG = iso => {
    const f = FLAGS[iso];
    return f ? `<svg class="cflag" style="aspect-ratio:${f[0]}/${f[1]}" viewBox="0 0 ${f[0]} ${f[1]}" preserveAspectRatio="none" aria-hidden="true">${f[2]}</svg>` : "";
};
// FLG＝旅した国の地物と国旗の対応表。地図に国旗を貼る処理が使う
const FLG = (world || []).filter(f => FLAGX[f.id]).map(f => {
    let g = f.geometry;
    const ex = FLEXT[f.id];
    if (ex && g && g.type === "MultiPolygon") {
        const ps = g.coordinates.filter(pl => {
            const c = d3.geoCentroid({ type: "Polygon", coordinates: pl });
            return c[0] >= ex[0] && c[0] <= ex[2] && c[1] >= ex[1] && c[1] <= ex[3];
        });
        if (ps.length)
            g = { type: "MultiPolygon", coordinates: ps };
    }
    return { type: "Feature", id: f.id, geometry: g };
});
