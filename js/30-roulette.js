// ======================================================================
// 30. 次の旅ルーレットと国の詳細  (30-roulette.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 次の旅ルーレット（行ったことのない国の街を、地球儀を回して出す。体験ではなく、おすすめの候補） ----
(() => {
    // el＝id から要素を取る
    const el = id => document.getElementById(id);
    // 国旗は flags/<ISO2>.svg（flag-icons、MIT）。見どころのイラストは、この地図用に描いた汎用の絵（実際の景色ではない）
    // K＝見どころのイラストで使う色の表
    const K = { sky: "#cfe6f5", peach: "#fbe0b8", night: "#26335c", stone: "#cdbd9f", dk: "#6a5a4a", grn: "#79b06a", grn2: "#4f8a52", wat: "#5ba8d8", red: "#d4584a", wht: "#fbfbf8", sand: "#ecd08f", sun: "#f5c244", pink: "#ef9aa8", blue: "#3f77c4", brn: "#9b6b45", yel: "#f2c14e", gry: "#8a97a8" };
    // MOT＝見どころのイラスト（モチーフ）の SVG 一覧
    const MOT = {
        tower: [K.sky, `<circle cx="38" cy="10" r="4" fill="${K.sun}"/><path d="M20 42V18l4-11 4 11v24z" fill="${K.stone}"/><rect x="17" y="40" width="14" height="4" fill="${K.dk}"/><rect x="23" y="22" width="2" height="6" fill="${K.dk}"/><rect x="23" y="31" width="2" height="5" fill="${K.dk}"/>`],
        castle: [K.sky, `<rect x="10" y="22" width="28" height="20" fill="${K.stone}"/><rect x="6" y="14" width="9" height="28" fill="${K.stone}"/><rect x="33" y="14" width="9" height="28" fill="${K.stone}"/><path d="M5 14l5.500-8 5.500 8zM32 14l5.500-8 5.500 8z" fill="${K.red}"/><rect x="16" y="19" width="3" height="3" fill="${K.stone}"/><rect x="22.500" y="19" width="3" height="3" fill="${K.stone}"/><rect x="29" y="19" width="3" height="3" fill="${K.stone}"/><path d="M20 42v-9a4 4 0 018 0v9z" fill="${K.dk}"/>`],
        palace: [K.sky, `<rect x="6" y="14" width="36" height="28" fill="#f0a3a3"/><rect x="6" y="12" width="36" height="3" fill="#e58b8b"/><path d="M10 40v-6a3 3 0 016 0v6zM21 40v-6a3 3 0 016 0v6zM32 40v-6a3 3 0 016 0v6z" fill="${K.wht}"/><g fill="${K.wht}"><rect x="10" y="19" width="5" height="5" rx="1"/><rect x="21.500" y="19" width="5" height="5" rx="1"/><rect x="33" y="19" width="5" height="5" rx="1"/></g><path d="M18 14l6-7 6 7z" fill="#e58b8b"/>`],
        church: [K.sky, `<rect x="8" y="28" width="13" height="14" fill="#bfae90"/><rect x="27" y="28" width="13" height="14" fill="#bfae90"/><rect x="19" y="16" width="10" height="26" fill="${K.stone}"/><path d="M18 16l6-11 6 11z" fill="${K.dk}"/><path d="M24 1v5M22 3h4" stroke="${K.dk}" stroke-width="1.600"/><path d="M21.500 42v-7a2.500 2.500 0 015 0v7z" fill="${K.dk}"/><rect x="22.500" y="21" width="3" height="6" rx="1.500" fill="${K.dk}"/>`],
        dome: [K.sky, `<path d="M12 32a12 12 0 0124 0z" fill="${K.blue}"/><rect x="10" y="32" width="28" height="10" fill="${K.stone}"/><path d="M24 20v-5M22 17h4" stroke="${K.dk}" stroke-width="1.500"/><rect x="4" y="20" width="4" height="22" fill="${K.stone}"/><rect x="40" y="20" width="4" height="22" fill="${K.stone}"/><path d="M4 20l2-5 2 5zM40 20l2-5 2 5z" fill="${K.dk}"/><path d="M21 42v-6a3 3 0 016 0v6z" fill="${K.dk}"/>`],
        temple: [K.sky, `<rect x="14" y="26" width="20" height="15" fill="${K.red}"/><path d="M5 27q19-5 38 0l-5-7H10z" fill="${K.brn}"/><path d="M12 20q12-3 24 0l-3-7H15z" fill="${K.brn}"/><path d="M20 13q4-2 8 0l-2-7h-4z" fill="${K.brn}"/><rect x="21" y="30" width="6" height="11" fill="${K.dk}"/><rect x="9" y="41" width="30" height="3" fill="${K.stone}"/>`],
        pagoda: [K.sky, `<rect x="19" y="36" width="10" height="7" fill="${K.red}"/><path d="M12 37q12-3 24 0l-3-6H15z" fill="${K.brn}"/><rect x="20" y="26" width="8" height="6" fill="${K.red}"/><path d="M14 27q10-3 20 0l-3-6H17z" fill="${K.brn}"/><rect x="21" y="17" width="6" height="5" fill="${K.red}"/><path d="M16 18q8-3 16 0l-3-6H19z" fill="${K.brn}"/><path d="M24 12V4" stroke="${K.dk}" stroke-width="1.500"/>`],
        ruins: [K.peach, `<rect x="6" y="38" width="36" height="5" fill="${K.stone}"/><rect x="10" y="17" width="6" height="21" fill="${K.stone}"/><rect x="21" y="24" width="6" height="14" fill="${K.stone}"/><rect x="32" y="12" width="6" height="26" fill="${K.stone}"/><rect x="8" y="14" width="10" height="4" fill="#b9a98a"/><rect x="30" y="9" width="10" height="4" fill="#b9a98a"/><path d="M21 24l2-3 2 2 2-2z" fill="${K.stone}"/>`],
        mountain: [K.sky, `<circle cx="38" cy="10" r="4" fill="${K.sun}"/><path d="M2 40L18 11l10 17 6-9 12 21z" fill="${K.gry}"/><path d="M18 11l-5 9 4-1 2 3 3-3 3 2z" fill="${K.wht}"/><rect y="38" width="48" height="10" fill="${K.grn}"/>`],
        lake: [K.sky, `<path d="M0 28L12 12l8 12 8-8 10 12z" fill="${K.gry}"/><path d="M12 12l-3 5 3-1 2 2 2-2z" fill="${K.wht}"/><rect y="28" width="48" height="20" fill="${K.wat}"/><path d="M8 34h12M24 38h14M14 42h10" stroke="${K.wht}" stroke-width="1.500" opacity=".8" stroke-linecap="round"/><circle cx="38" cy="9" r="4" fill="${K.sun}"/>`],
        sea: [K.sky, `<circle cx="36" cy="14" r="5" fill="${K.sun}"/><rect y="26" width="48" height="22" fill="${K.wat}"/><path d="M3 32q4-3 8 0t8 0 8 0 8 0 8 0M3 39q4-3 8 0t8 0 8 0 8 0 8 0" fill="none" stroke="${K.wht}" stroke-width="1.600" stroke-linecap="round"/>`],
        boat: [K.sky, `<rect y="30" width="48" height="18" fill="${K.wat}"/><path d="M24 8v22l11-3z" fill="${K.wht}"/><path d="M22 12L12 27h10z" fill="#f2e3b3"/><path d="M8 30h32l-5 7H13z" fill="${K.dk}"/><path d="M4 42h14M26 44h16" stroke="${K.wht}" stroke-width="1.500" opacity=".8" stroke-linecap="round"/>`],
        beach: [K.sky, `<circle cx="10" cy="11" r="5" fill="${K.sun}"/><rect y="30" width="48" height="18" fill="${K.wat}"/><path d="M0 38q16-6 48 0v10H0z" fill="${K.sand}"/><path d="M32 40q-1-12 2-20" fill="none" stroke="${K.brn}" stroke-width="2.500"/><path d="M34 20q-8-6-14-2 8-1 14 2zM34 20q8-6 13-1-7-1-13 1zM34 20q-3-9-9-9 6 3 9 9zM34 20q4-8 9-6-6 0-9 6z" fill="${K.grn2}"/>`],
        dune: [K.peach, `<circle cx="36" cy="12" r="5" fill="${K.sun}"/><path d="M0 34q12-14 24-4t24-6v24H0z" fill="${K.sand}"/><path d="M0 42q14-8 26-2t22-2v10H0z" fill="#d9b66e"/>`],
        canyon: [K.sky, `<path d="M0 20h12l4 6 6-2 4 8 6-4 4 4 12-6v28H0z" fill="#d98a5b"/><path d="M0 30h14l4 4 8-2 4 6 6-3 4 3 8-4v20H0z" fill="#c4673f"/><path d="M0 40h48v8H0z" fill="#a9502f"/>`],
        cliffmon: [K.sky, `<rect y="40" width="48" height="8" fill="${K.grn}"/><path d="M15 44V18l4-2 5 2 5-3 4 3v26z" fill="#a08a6e"/><path d="M19 18v26M29 15v29" stroke="#8a765b" stroke-width="1.200"/><rect x="18" y="9" width="13" height="9" fill="${K.wht}"/><path d="M17 9l7.500-6 7.500 6z" fill="${K.red}"/><rect x="23" y="12" width="3" height="6" fill="${K.dk}"/>`],
        bridge: [K.sky, `<rect y="34" width="48" height="14" fill="${K.wat}"/><rect x="2" y="22" width="44" height="4" fill="${K.stone}"/><path d="M6 34a18 14 0 0136 0" fill="none" stroke="${K.dk}" stroke-width="3"/><path d="M12 26v6M18 26v3M24 26v2M30 26v3M36 26v6" stroke="${K.dk}" stroke-width="1.400"/><path d="M6 40h10M24 43h14" stroke="${K.wht}" stroke-width="1.500" opacity=".8" stroke-linecap="round"/>`],
        market: [K.peach, `<rect x="9" y="24" width="3" height="18" fill="${K.dk}"/><rect x="36" y="24" width="3" height="18" fill="${K.dk}"/><path d="M6 12h36l3 11H3z" fill="${K.red}"/><path d="M16 12l-2 11M24 12v11M32 12l2 11" stroke="${K.wht}" stroke-width="3"/><rect x="7" y="31" width="34" height="4" fill="${K.brn}"/><circle cx="15" cy="29" r="3" fill="${K.yel}"/><circle cx="22" cy="29" r="3" fill="${K.red}"/><circle cx="29" cy="29" r="3" fill="${K.grn}"/><circle cx="35" cy="29" r="3" fill="${K.yel}"/>`],
        street: [K.sky, `<rect y="40" width="48" height="8" fill="#b8b2a6"/><rect x="3" y="20" width="13" height="20" fill="${K.yel}"/><rect x="17" y="14" width="14" height="26" fill="${K.pink}"/><rect x="32" y="22" width="13" height="18" fill="#9ccaa8"/><path d="M2 20l7.500-7 7.500 7zM16 14l8-8 8 8zM31 22l7.500-7 7.500 7z" fill="${K.red}"/><g fill="${K.wht}"><rect x="6" y="25" width="4" height="5"/><rect x="21" y="19" width="5" height="6"/><rect x="21" y="29" width="5" height="6"/><rect x="36" y="27" width="4" height="5"/></g>`],
        streetb: ["#e3f0fb", `<rect y="40" width="48" height="8" fill="#c9d9ea"/><rect x="3" y="20" width="13" height="20" fill="#6fa8dc"/><rect x="17" y="14" width="14" height="26" fill="#9fc5e8"/><rect x="32" y="22" width="13" height="18" fill="#3d85c6"/><g fill="${K.wht}"><rect x="6" y="25" width="4" height="5"/><rect x="21" y="19" width="5" height="6"/><rect x="21" y="29" width="5" height="6"/><rect x="36" y="27" width="4" height="5"/></g><path d="M20 40v-5a2.500 2.500 0 015 0v5z" fill="#1f4e79"/>`],
        streetc: [K.sky, `<rect y="36" width="48" height="12" fill="${K.wat}"/><rect x="2" y="14" width="10" height="22" fill="${K.red}"/><rect x="13" y="10" width="10" height="26" fill="${K.yel}"/><rect x="24" y="16" width="10" height="20" fill="#e98b4e"/><rect x="35" y="12" width="11" height="24" fill="${K.blue}"/><g fill="${K.wht}"><rect x="5" y="19" width="4" height="4"/><rect x="16" y="15" width="4" height="4"/><rect x="27" y="21" width="4" height="4"/><rect x="39" y="17" width="4" height="4"/><rect x="5" y="28" width="4" height="4"/><rect x="16" y="26" width="4" height="4"/><rect x="27" y="29" width="4" height="4"/><rect x="39" y="27" width="4" height="4"/></g><path d="M6 42h10M26 44h14" stroke="${K.wht}" stroke-width="1.500" opacity=".7" stroke-linecap="round"/>`],
        sunrise: ["#fbd9a0", `<rect y="32" width="48" height="16" fill="${K.grn2}"/><path d="M12 32a12 12 0 0124 0z" fill="${K.sun}"/><path d="M24 12V6M10 18l-4-3M38 18l4-3M5 28H1M47 28h-4" stroke="${K.sun}" stroke-width="2" stroke-linecap="round"/>`],
        sunset: ["#f4a77f", `<circle cx="24" cy="30" r="9" fill="#ffd66b"/><path d="M0 34l10-8 8 6 8-9 10 8 12-5v22H0z" fill="#6b4b55"/><rect y="40" width="48" height="8" fill="#4a3541"/>`],
        aurora: [K.night, `<path d="M0 26q10-16 22-6t26-14v22H0z" fill="#6fe3a8" opacity=".85"/><path d="M0 32q12-10 24-2t24-8v14H0z" fill="#c78cf0" opacity=".55"/><g fill="${K.wht}"><circle cx="8" cy="8" r="1"/><circle cx="30" cy="6" r="1"/><circle cx="41" cy="12" r="1.200"/><circle cx="18" cy="14" r=".8"/></g><rect y="38" width="48" height="10" fill="#eef4f8"/><path d="M8 40l3-8 3 8zM36 40l3-10 3 10z" fill="#27483a"/>`],
        hotspring: [K.sky, `<g fill="none" stroke="${K.wht}" stroke-width="2" stroke-linecap="round"><path d="M17 20q-3-4 0-8t0-6"/><path d="M24 22q-3-4 0-8t0-6"/><path d="M31 20q-3-4 0-8t0-6"/></g><ellipse cx="24" cy="36" rx="19" ry="8" fill="${K.stone}"/><ellipse cx="24" cy="35" rx="15" ry="6" fill="#7fc9d8"/>`],
        cablecar: [K.sky, `<path d="M0 44l14-18 8 10 8-14 18 22z" fill="${K.gry}"/><path d="M2 12L46 22" stroke="${K.dk}" stroke-width="1.600"/><path d="M26 17v5" stroke="${K.dk}" stroke-width="1.600"/><rect x="19" y="22" width="15" height="11" rx="2" fill="${K.red}"/><rect x="21.500" y="24.500" width="4" height="4" fill="${K.wht}"/><rect x="27.500" y="24.500" width="4" height="4" fill="${K.wht}"/>`],
        balloon: [K.sky, `<path d="M24 5c-9 0-14 6-14 13 0 6 5 11 10 14h8c5-3 10-8 10-14 0-7-5-13-14-13z" fill="${K.red}"/><path d="M24 5c-4 4-5 20-4 27h8c1-7 0-23-4-27z" fill="${K.yel}"/><path d="M20 32l2 5M28 32l-2 5" stroke="${K.dk}" stroke-width="1.200"/><rect x="21" y="37" width="6" height="5" fill="${K.brn}"/>`],
        statue: [K.peach, `<rect y="40" width="48" height="8" fill="${K.grn}"/><path d="M15 42V16q0-9 9-9t9 9v26z" fill="#7d7468"/><rect x="16" y="19" width="16" height="3.500" fill="#4d463d"/><path d="M22 22h4l1 11h-6z" fill="#675f54"/><rect x="19" y="35" width="10" height="2.500" fill="#4d463d"/>`],
        baobab: ["#f6c79c", `<circle cx="36" cy="12" r="6" fill="#ffd66b"/><rect y="40" width="48" height="8" fill="#b4764f"/><path d="M19 42c1-8 2-14 1-22h8c-1 8 0 14 1 22z" fill="${K.brn}"/><path d="M20 21l-9-6M28 21l9-6M24 20V10" stroke="${K.brn}" stroke-width="3" stroke-linecap="round"/><g fill="${K.grn2}"><circle cx="10" cy="13" r="4"/><circle cx="38" cy="13" r="4"/><circle cx="24" cy="8" r="4.500"/></g>`],
        waterfall: [K.sky, `<rect y="36" width="48" height="12" fill="${K.wat}"/><path d="M0 10h16v28H0zM32 10h16v28H32z" fill="${K.gry}"/><rect x="16" y="10" width="16" height="28" fill="${K.wht}"/><path d="M20 12v24M25 12v24M29 14v22" stroke="#cfe6f5" stroke-width="1.500"/><ellipse cx="24" cy="38" rx="9" ry="3" fill="${K.wht}" opacity=".85"/><rect y="6" width="48" height="5" fill="${K.grn}"/>`],
        train: [K.sky, `<rect y="38" width="48" height="10" fill="#b8b2a6"/><path d="M2 40h44" stroke="${K.dk}" stroke-width="2"/><rect x="4" y="16" width="40" height="20" rx="5" fill="${K.red}"/><g fill="${K.wht}"><rect x="9" y="21" width="7" height="7" rx="1"/><rect x="19" y="21" width="7" height="7" rx="1"/><rect x="29" y="21" width="7" height="7" rx="1"/></g><rect x="4" y="30" width="40" height="3" fill="${K.yel}"/><circle cx="14" cy="38" r="3" fill="${K.dk}"/><circle cx="34" cy="38" r="3" fill="${K.dk}"/>`],
        classiccar: [K.peach, `<rect y="38" width="48" height="10" fill="#b8b2a6"/><path d="M4 34V28q0-3 4-4l6-1 5-7h14l5 7 5 1q3 1 3 4v6z" fill="#4fb3b0"/><path d="M19 17l-4 6h20l-4-6z" fill="${K.wht}" opacity=".9"/><circle cx="13" cy="36" r="5" fill="${K.dk}"/><circle cx="35" cy="36" r="5" fill="${K.dk}"/><circle cx="13" cy="36" r="2" fill="${K.stone}"/><circle cx="35" cy="36" r="2" fill="${K.stone}"/><rect x="42" y="28" width="3" height="3" fill="${K.yel}"/>`],
        museum: [K.sky, `<path d="M5 17L24 6l19 11z" fill="${K.stone}"/><rect x="6" y="18" width="36" height="3" fill="#b9a98a"/><g fill="${K.wht}" stroke="${K.stone}" stroke-width="1"><rect x="9" y="22" width="5" height="16"/><rect x="17" y="22" width="5" height="16"/><rect x="26" y="22" width="5" height="16"/><rect x="34" y="22" width="5" height="16"/></g><rect x="4" y="38" width="40" height="3" fill="${K.stone}"/><rect x="2" y="41" width="44" height="4" fill="#b9a98a"/>`],
        garden: [K.sky, `<rect y="34" width="48" height="14" fill="${K.grn}"/><g stroke="${K.grn2}" stroke-width="2"><path d="M12 34V22M24 34V16M36 34V24"/></g><circle cx="12" cy="20" r="4.500" fill="${K.pink}"/><circle cx="24" cy="14" r="5" fill="${K.yel}"/><circle cx="36" cy="22" r="4.500" fill="#e07a9a"/><circle cx="12" cy="20" r="1.600" fill="${K.yel}"/><circle cx="24" cy="14" r="1.800" fill="${K.red}"/><circle cx="36" cy="22" r="1.600" fill="${K.yel}"/>`],
        food: [K.peach, `<g fill="none" stroke="${K.wht}" stroke-width="2" stroke-linecap="round"><path d="M18 17q-2-3 0-6t0-4"/><path d="M25 17q-2-3 0-6t0-4"/></g><path d="M11 22h24v8a10 10 0 01-10 10h-4a10 10 0 01-10-10z" fill="${K.wht}"/><path d="M35 25h3a4 4 0 010 8h-4" fill="none" stroke="${K.wht}" stroke-width="3"/><ellipse cx="23" cy="42" rx="16" ry="3" fill="${K.stone}"/><rect x="11" y="22" width="24" height="3" fill="${K.brn}"/>`],
        glass: ["#fbe3e6", `<path d="M14 7h20c1 12-3 20-10 20S13 19 14 7z" fill="${K.wht}" opacity=".9"/><path d="M14.600 15h18.800c-.6 8-3.500 12-9.400 12s-8.800-4-9.400-12z" fill="#a8284a"/><path d="M24 27v13" stroke="${K.stone}" stroke-width="2.500"/><ellipse cx="24" cy="42" rx="8" ry="2.500" fill="${K.stone}"/>`],
        mirror: [K.sky, `<rect y="24" width="48" height="24" fill="#a9cde6"/><path d="M4 24l8-8 6 8zM28 24l8-9 8 9z" fill="${K.gry}"/><path d="M4 24l8 8 6-8zM28 24l8 9 8-9z" fill="${K.gry}" opacity=".6"/><circle cx="24" cy="10" r="4" fill="${K.sun}"/><circle cx="24" cy="38" r="4" fill="${K.sun}" opacity=".6"/><rect y="23.500" width="48" height="1.500" fill="${K.wht}"/>`],
        book: [K.peach, `<path d="M24 12q-9-4-18-1v26q9-3 18 1z" fill="${K.wht}"/><path d="M24 12q9-4 18-1v26q-9-3-18 1z" fill="#f4f0e6"/><path d="M24 12v26" stroke="${K.brn}" stroke-width="2"/><path d="M10 18q6-1 10 1M10 24q6-1 10 1M10 30q6-1 10 1M28 19q4-2 10-1M28 25q4-2 10-1M28 31q4-2 10-1" fill="none" stroke="${K.stone}" stroke-width="1.400"/>`],
        lantern: ["#2a2f52", `<path d="M0 8q24 10 48 0" fill="none" stroke="${K.stone}" stroke-width="1.200"/><path d="M24 12v4" stroke="${K.stone}" stroke-width="1.400"/><ellipse cx="24" cy="26" rx="11" ry="10" fill="#e5483a"/><ellipse cx="24" cy="26" rx="11" ry="10" fill="none" stroke="#ffcf6b" stroke-width="1.200"/><path d="M24 16c-4 4-4 16 0 20M24 16c4 4 4 16 0 20" fill="none" stroke="#ffcf6b" stroke-width="1.100"/><rect x="19" y="15" width="10" height="3" fill="#ffcf6b"/><rect x="19" y="35" width="10" height="3" fill="#ffcf6b"/><path d="M22 38v6M24 38v7M26 38v6" stroke="#ffcf6b" stroke-width="1.200"/><circle cx="8" cy="26" r="3" fill="#ffcf6b" opacity=".7"/><circle cx="40" cy="28" r="3" fill="#ffcf6b" opacity=".7"/>`],
        skyscraper: [K.sky, `<rect y="40" width="48" height="8" fill="#b8b2a6"/><rect x="4" y="26" width="9" height="14" fill="${K.gry}"/><rect x="35" y="22" width="9" height="18" fill="${K.gry}"/><path d="M19 40V20l5-16 5 16v20z" fill="#9fb4c8"/><path d="M24 4v-3" stroke="${K.dk}" stroke-width="1.500"/><g fill="${K.wht}" opacity=".85"><rect x="22" y="22" width="4" height="3"/><rect x="22" y="28" width="4" height="3"/><rect x="22" y="34" width="4" height="3"/></g>`],
        cave: ["#8a7d6c", `<path d="M4 44V28q0-18 20-18t20 18v16z" fill="#3b332b"/><path d="M12 44l3-8 3 8zM20 44l2-5 2 5zM30 44l3-9 3 9z" fill="#e9e2d2"/><path d="M16 12l2 6 2-6zM28 10l2 7 2-7z" fill="#e9e2d2"/>`],
        walls: [K.sky, `<rect y="36" width="48" height="12" fill="${K.wat}"/><rect y="20" width="48" height="16" fill="${K.stone}"/><path d="M0 20v-4h5v4h4v-4h5v4h4v-4h5v4h4v-4h5v4h4v-4h5v4h4v-4h5v4h3" fill="${K.stone}"/><rect x="2" y="10" width="11" height="26" fill="#bfae90"/><path d="M1 10l6.500-6 6.500 6z" fill="${K.red}"/><path d="M20 36v-8a4 4 0 018 0v8z" fill="${K.dk}"/>`],
        hut: [K.sky, `<rect y="38" width="48" height="10" fill="${K.grn}"/><rect x="12" y="24" width="24" height="16" fill="#e8d3a8"/><path d="M7 25l17-14 17 14z" fill="${K.brn}"/><path d="M20 40v-8a4 4 0 018 0v8z" fill="${K.dk}"/><rect x="29" y="28" width="4" height="4" fill="${K.dk}"/>`],
        tent: [K.sky, `<rect y="36" width="48" height="12" fill="${K.grn}"/><path d="M7 38a17 15 0 0134 0z" fill="${K.wht}"/><path d="M7 38a17 15 0 0134 0" fill="none" stroke="${K.stone}" stroke-width="1.500"/><rect x="21" y="29" width="6" height="9" rx="1" fill="${K.red}"/><path d="M24 23v-4" stroke="${K.dk}" stroke-width="1.500"/><circle cx="24" cy="18" r="2" fill="${K.dk}"/>`],
        rock: [K.sky, `<circle cx="38" cy="9" r="4" fill="${K.sun}"/><rect y="38" width="48" height="10" fill="#d9b66e"/><path d="M2 40q4-18 18-19t26 19z" fill="#c6533a"/><path d="M10 38q4-10 12-12M30 28q6 2 10 10" fill="none" stroke="#a9432c" stroke-width="1.500"/>`],
        christ: [K.sky, `<path d="M2 46L24 22l22 24z" fill="#7a8f7a"/><circle cx="24" cy="8" r="2.800" fill="${K.wht}"/><rect x="22.400" y="11" width="3.200" height="13" fill="${K.wht}"/><rect x="12" y="12" width="24" height="3" fill="${K.wht}"/>`],
        penguin: [K.sky, `<rect y="36" width="48" height="12" fill="${K.sand}"/><path d="M0 36q8-4 14 0z" fill="${K.wat}"/><ellipse cx="24" cy="26" rx="9" ry="13" fill="#2b2e38"/><ellipse cx="24" cy="29" rx="5.500" ry="9" fill="${K.wht}"/><circle cx="24" cy="13" r="6" fill="#2b2e38"/><path d="M22 14l2 3 2-3z" fill="#f2a43a"/><circle cx="21.500" cy="12" r="1" fill="${K.wht}"/><circle cx="26.500" cy="12" r="1" fill="${K.wht}"/><path d="M20 39l-2 3h5zM28 39l-2 3h5z" fill="#f2a43a"/>`],
        skyline: []
    };
    delete MOT.skyline;
    // mot＝モチーフ名から SVG を返す
    const mot = n => {
        const m = MOT[n] || MOT.tower;
        return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" fill="${m[0]}"/>${m[1]}</svg>`;
    };
    // EX＝ルーレットから除く国（行った国・予定の国）
    const EX = new Set(["USA", "KOR", "GBR", "THA", "CHN", "JPN"]);
    TRIPS.forEach(t => t.visited && t.visited.forEach(c => EX.add(c))); // 行った国・予定の国・日本（札を付けるだけ。ルーレットには全部入る）
    // WARN＝危険度が高く、ルーレットから除く国
    const WARN = new Set(["AFG", "IRQ", "SYR", "YEM", "PRK", "UKR", "RUS", "BLR", "LBY", "SOM", "SSD", "SDN", "MLI", "BFA", "NER", "CAF", "TCD", "HTI", "ISR", "PSE", "LBN", "IRN", "MMR", "COD"]);
    // 都市のデータ（197か国・865か所）は rldata.js に分けてある。最初に回すとき（または暇なとき）に読み込む
    // RLD＝読み込んだ都市データ。ldp＝読み込み中の Promise
    let RLD = null, ldp = null;
    // load＝rldata.js を初めて必要になったときに読み込む（2回目以降は使い回し）
    const load = () => RLD ? Promise.resolve(RLD) : (ldp = ldp || new Promise((ok, ng) => {
        const sc = document.createElement("script");
        sc.src = "js/rldata.js";
        sc.onload = () => {
            RLD = window.__RLD;
            RLD ? ok(RLD) : ng(new Error("empty"));
        };
        sc.onerror = () => {
            ldp = null;
            ng(new Error("load"));
        };
        document.head.appendChild(sc);
    }));
    if (window.requestIdleCallback)
        window.addEventListener("load", () => requestIdleCallback(() => load().catch(() => { }), { timeout: 8000 }));
    // cbag＝まだ出していない国の袋（一巡するまで重複させない）。busy＝回転中。tok＝中断用の合言葉
    let cbag = [], busy = false, tok = 0;
    // city＝国ごとに直近で出した都市
    const city = {};
    // pick＝袋から国を1つ選び、その国の都市を1つ選ぶ
    const pick = D => {
        if (!cbag.length)
            cbag = d3.shuffle(D.slice());
        const c = cbag.pop();
        let bg = city[c[0]];
        if (!bg || !bg.length)
            bg = city[c[0]] = d3.shuffle(c[3].slice());
        const t = bg.pop();
        return { c, t };
    };
    // ---- 評価（💀危険度・★マニアック度・🕐片道の移動時間）と、全都市の中のランキング ----
    // lvH＝片道の移動時間(h)を5段階にする
    const lvH = h => h <= 4 ? 1 : h <= 8 ? 2 : h <= 13 ? 3 : h <= 19 ? 4 : 5;
    // rateOf＝危険度・マニアック度・移動時間の評価を求める
    const rateOf = (iso, x) => {
        const RS = (window.__RLS || {})[iso] || [3, 3, 8], o = RS[1], tier = x[3], dg = tier === "奥" && RS[0] >= 3 ? Math.min(5, RS[0] + 1) : RS[0], mn = tier === "定" ? Math.max(1, Math.min(o, 3)) : Math.max(2, Math.min(o + 1, 5)), km = d3.geoDistance([139.69, 35.69], [x[1], x[2]]) * 6371, rem = /島|砂漠|国立公園|山|湖|高原|滝|渓谷|環礁|保護区|ジャングル|氷河|岬/.test(x[0]), hf = km / 850 + 2.5 + (o >= 4 ? 3 : o >= 3 ? 1.5 : 0) + (rem ? 2 : 0), h = Math.round(hf), hl = lvH(h);
        const dn = Math.pow((dg - 1) / 4, 1.5), tn = Math.min(1, Math.max(0, (hf - 3) / 27)), mm = (mn - 1) / 4, diff = 100 * (1 - (1 - .6 * dn) * (1 - .3 * tn) * (1 - .25 * mm));
        return { dg, mn, hl, h, hf, tot: dg + mn + hl, diff };
    };
    // LVL＝点数を「やさしい〜」の言葉と段階にする
    const LVL = d => d < 15 ? ["やさしい", "1"] : d < 30 ? ["ふつう", "2"] : d < 45 ? ["ちょっと難しい", "3"] : d < 60 ? ["難しい", "4"] : d < 75 ? ["上級", "5"] : ["超上級", "6"];
    // RK＝全都市の順位のキャッシュ
    let RK = null;
    // ranks＝全都市の中での順位を計算する
    const ranks = D => {
        if (RK)
            return RK;
        const all = [];
        D.forEach(c => c[3].forEach(x => all.push({ x, r: rateOf(c[0], x) })));
        all.sort((a, b) => b.r.diff - a.r.diff);
        all.forEach((e, i) => {
            e.rank = i + 1;
        });
        const share = (k, v) => Math.max(1, Math.round(100 * all.filter(e => e.r[k] >= v).length / all.length));
        RK = { all, n: all.length, find: x => all.find(e => e.x === x), share };
        return RK;
    };
    // ic＝評価のアイコン（塗りつぶし＋空き）を n 個分作る
    const ic = (n, ch, cls) => `<span class="ic ${cls}">${ch.repeat(n)}<i>${ch.repeat(5 - n)}</i></span>`;
    // rankHTML＝都市カードの評価欄の HTML
    const rankHTML = (D, c, t) => {
        const K = ranks(D), e = K.find(t), r = e.r, pos = Math.round(100 * (1 - (e.rank - 1) / (K.n - 1))), top = Math.max(1, Math.round(100 * e.rank / K.n));
        const row = (lb, ch, cls, n, tx) => `<div class="m"><b>${lb}</b>${ic(n, ch, cls)}<span>${tx}</span></div>`;
        return row("危険度", "💀", "dg", r.dg, `上位${K.share("dg", r.dg)}%`) + row("マニアック度", "★", "st", r.mn, `上位${K.share("mn", r.mn)}%`) + row("移動時間", "🕐", "ck", r.hl, `片道およそ${r.h}時間`)
            + `<div class="rk"><div class="rn"><span>旅行難易度ランキング</span><strong>${e.rank}<small>位</small></strong><span>/ ${K.n}都市（上位${top}%）</span><b class="pt">${Math.round(r.diff)}<small>/100・${LVL(r.diff)[0]}</small></b></div>`
            + `<div class="gg" role="img" aria-label="旅行難易度 ${Math.round(r.diff)}点、${e.rank}位／${K.n}都市"><i style="left:${pos}%"></i></div><div class="gl"><span>やさしい</span><span>超上級</span></div></div>`;
    };
    // ---- 国ぜんたいの評価（国の説明パネル用）。危険度・マニアック度は国の値、移動時間は代表の都市（先頭）で見る
    // CK＝国ぜんたいの評価のキャッシュ
    let CK = null;
    // cRate＝国の評価（都市の平均など）
    const cRate = c => {
        const iso = c[0], RS = (window.__RLS || {})[iso] || [3, 3, 8], r = rateOf(iso, [c[3][0][0], c[3][0][1], c[3][0][2], "定"]), dg = RS[0], mn = Math.max(1, Math.min(5, RS[1])), dn = Math.pow((dg - 1) / 4, 1.5), tn = Math.min(1, Math.max(0, (r.hf - 3) / 27)), mm = (mn - 1) / 4;
        return Object.assign({}, r, { dg, mn, diff: 100 * (1 - (1 - .6 * dn) * (1 - .3 * tn) * (1 - .25 * mm)) });
    };
    // cRanks＝国の評価の順位
    const cRanks = D => {
        if (CK)
            return CK;
        const all = D.map(c => ({ iso: c[0], r: cRate(c) }));
        all.sort((a, b) => b.r.diff - a.r.diff);
        all.forEach((e, i) => {
            e.rank = i + 1;
        });
        CK = { all, n: all.length, share: (k, v) => Math.max(1, Math.round(100 * all.filter(e => e.r[k] >= v).length / all.length)) };
        return CK;
    };
    // __rlCountry＝国の説明パネルから使う、国ぜんたいの評価
    window.__rlCountry = iso => load().then(D => {
        const K = cRanks(D), e = K.all.find(z => z.iso === iso);
        if (!e)
            return "";
        const r = e.r, pos = Math.round(100 * (1 - (e.rank - 1) / (K.n - 1))), top = Math.max(1, Math.round(100 * e.rank / K.n));
        const row = (lb, ch, cls, n, tx) => `<div class="m"><b>${lb}</b>${ic(n, ch, cls)}<span>${tx}</span></div>`;
        return row("危険度", "💀", "dg", r.dg, `上位${K.share("dg", r.dg)}%`) + row("マニアック度", "★", "st", r.mn, `上位${K.share("mn", r.mn)}%`) + row("移動時間", "🕐", "ck", r.hl, `片道およそ${r.h}時間`)
            + `<div class="rk"><div class="rn"><span>旅行難易度ランキング</span><strong>${e.rank}<small>位</small></strong><span>/ ${K.n}か国（上位${top}%）</span><b class="pt">${Math.round(r.diff)}<small>/100・${LVL(r.diff)[0]}</small></b></div>`
            + `<div class="gg" role="img" aria-label="旅行難易度 ${Math.round(r.diff)}点、${e.rank}位／${K.n}か国"><i style="left:${pos}%"></i></div><div class="gl"><span>やさしい</span><span>超上級</span></div></div>`;
    });
    // 見どころの名前から、イラストを選ぶ（"名前~絵" と書いてあればそれを使う）
    // RULES＝見どころの名前に含まれる言葉→イラスト名の規則
    const RULES = [[/ロープウェイ|ケーブルカー|ゴンドラ|リフト/, "cablecar"], [/気球/, "balloon"], [/オーロラ/, "aurora"], [/温泉/, "hotspring"], [/滝/, "waterfall"], [/列車|鉄道|トロッコ|電車/, "train"], [/ピラミッド|遺跡|古墳|石碑|王墓|墓|廃墟|ジッグラト|跡/, "ruins"], [/城壁|要塞|城塞|砦|カスバ|ゾン|砲台/, "walls"], [/城/, "castle"], [/宮殿|王宮|宮/, "palace"], [/モスク|ミナレット|ドーム|廟/, "dome"], [/パゴダ|仏塔|ストゥーパ|寺院|神殿|仏歯寺|寺/, "temple"], [/大聖堂|教会|聖堂|修道院|礼拝堂|バシリカ|聖母/, "church"], [/博物館|美術館|ギャラリー|アート/, "museum"], [/図書館|書店/, "book"], [/橋/, "bridge"], [/市場|バザール|スーク|マーケット|屋台|夜市|ホーカー|ショッピング/, "market"], [/像|キリスト/, "statue"], [/摩天楼|高層|ビル/, "skyscraper"], [/タワー|塔/, "tower"], [/砂丘|砂漠|ラクダ|ワディ/, "dune"], [/洞窟|洞穴|鍾乳|地底/, "cave"], [/渓谷|峡谷|断崖|崖|キャニオン/, "canyon"], [/火山|山|峰|岳|氷河|高原|ハイキング|トレッキング|岩/, "mountain"], [/湖|池|ラグーン|泉|湿/, "lake"], [/ビーチ|海岸|砂浜|島|サンゴ|シュノーケ|ダイビング|環礁|海|浜|クジラ|ウミガメ/, "beach"], [/運河|川|クルーズ|ボート|カヌー|フェリー|ダウ|漁|港|船|ヨット|ラフティング/, "boat"], [/公園|庭園|植物園|森|ジャングル|熱帯雨林|サファリ|ゴリラ|ゾウ|ライオン/, "garden"], [/ワイン|ビール|コーヒー|料理|チョコ|ラム|ピンチョス|火鍋|ビビンバ|ロブスター|紅茶|茶/, "food"], [/ゲル|キャンプ|ロッジ|テント/, "tent"], [/日の出|夕日|日没|星空/, "sunset"], [/街並み|旧市街|広場|通り|路地|地区|ストリート|街/, "street"]];
    // FALL＝規則に当たらないときのイラスト
    const FALL = ["street", "garden", "sea"];
    // spotOf＝見どころの名前からイラストを選ぶ
    const spotOf = (t, i) => {
        const [n, m] = t.split("~");
        if (m)
            return [n, m];
        for (const [r, k] of RULES)
            if (r.test(n))
                return [n, k];
        return [n, FALL[i % 3]];
    };
    // ルーレットの部品：ボタン・カード・ピン・箱
    const btn = el("rlbtn"), card = el("rlcard"), pin = el("rlpin"), box = el("rlbox"), stage = el("stage"), DUR = 4200;
    // 箱を地図の枠に入れる
    stage.appendChild(box);
    box.classList.add("rlin");
    // ---- 効果音（ドラムロールと「ジャン！」。ブラウザで合成。ボタンで消せる）
    let ac = null, master = null, mute = false, nb = null;
    // AC＝効果音用の AudioContext を最初の操作のときに作る
    const AC = () => {
        try {
            ac = ac || new (window.AudioContext || window.webkitAudioContext)();
            if (ac.state === "suspended")
                ac.resume();
        }
        catch (e) {
            ac = null;
        }
        return ac;
    };
    // noise＝ノイズ（スネアなどの素）
    const noise = () => {
        if (!nb) {
            nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
            const d = nb.getChannelData(0);
            for (let i = 0; i < d.length; i++)
                d[i] = Math.random() * 2 - 1;
        }
        return nb;
    };
    // hit＝ドラムの1打を鳴らす
    const hit = (t, vel, out) => {
        const n = ac.createBufferSource();
        n.buffer = noise();
        const bp = ac.createBiquadFilter();
        bp.type = "lowpass";
        bp.frequency.value = 900;
        bp.Q.value = .4;
        const g = ac.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vel * .5, t + .012);
        g.gain.exponentialRampToValueAtTime(.001, t + .11);
        n.connect(bp);
        bp.connect(g);
        g.connect(out);
        n.start(t, Math.random() * .6, .14);
        const o = ac.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(85, t + .09);
        const og = ac.createGain();
        og.gain.setValueAtTime(0, t);
        og.gain.linearRampToValueAtTime(vel * .5, t + .008);
        og.gain.exponentialRampToValueAtTime(.001, t + .12);
        o.connect(og);
        og.connect(out);
        o.start(t);
        o.stop(t + .14);
    };
    // roll＝ドラムロール（sec 秒。weird なら変なロール）
    const roll = (sec, weird) => {
        if (mute || !AC())
            return;
        master = ac.createGain();
        master.gain.value = .35;
        master.connect(ac.destination);
        const t0 = ac.currentTime + .02;
        if (weird) {
            const o = ac.createOscillator();
            o.type = "sine";
            o.frequency.setValueAtTime(260, t0);
            o.frequency.exponentialRampToValueAtTime(1100, t0 + sec);
            const l = ac.createOscillator(), lg = ac.createGain();
            l.frequency.setValueAtTime(5, t0);
            l.frequency.linearRampToValueAtTime(16, t0 + sec);
            lg.gain.value = 60;
            l.connect(lg);
            lg.connect(o.frequency);
            const g = ac.createGain();
            g.gain.setValueAtTime(0, t0);
            g.gain.linearRampToValueAtTime(.3, t0 + .3);
            g.gain.setValueAtTime(.3, t0 + sec - .1);
            g.gain.linearRampToValueAtTime(0, t0 + sec);
            o.connect(g);
            g.connect(master);
            o.start(t0);
            l.start(t0);
            o.stop(t0 + sec + .05);
            l.stop(t0 + sec + .05);
            return;
        }
        let t = 0;
        while (t < sec - .05) {
            const f = t / sec;
            hit(t0 + t, (.08 + .4 * f * f) * (.85 + Math.random() * .3), master);
            t += (.09 - .05 * f) * (.9 + Math.random() * .2);
        }
        hit(t0 + sec - .02, .6, master);
    };
    // 止まった時：やさしめのクラッカー（ぱん・ぱぱん）。ときどき：アヒルのような変な音
    // pop＝クラッカーの音
    const pop = (m, t, vel) => {
        const n = ac.createBufferSource();
        n.buffer = noise();
        const f = ac.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 2600;
        f.Q.value = .5;
        const g = ac.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vel, t + .004);
        g.gain.exponentialRampToValueAtTime(.001, t + .07);
        n.connect(f);
        f.connect(g);
        g.connect(m);
        n.start(t, Math.random() * .6, .1);
        const o = ac.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(240, t);
        o.frequency.exponentialRampToValueAtTime(70, t + .08);
        const og = ac.createGain();
        og.gain.setValueAtTime(vel * .7, t);
        og.gain.exponentialRampToValueAtTime(.001, t + .1);
        o.connect(og);
        og.connect(m);
        o.start(t);
        o.stop(t + .12);
        const r = ac.createBufferSource();
        r.buffer = noise();
        const hp = ac.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 5000;
        const rg = ac.createGain(); // 紙テープのさらさら
        rg.gain.setValueAtTime(0, t + .03);
        rg.gain.linearRampToValueAtTime(vel * .12, t + .08);
        rg.gain.exponentialRampToValueAtTime(.001, t + .6);
        r.connect(hp);
        hp.connect(rg);
        rg.connect(m);
        r.start(t + .03, 0, .65);
    };
    // fanfare＝「ジャン！」の和音
    const fanfare = weird => {
        if (mute || !AC())
            return;
        const m = ac.createGain();
        m.gain.value = .4;
        m.connect(ac.destination);
        const t = ac.currentTime + .01;
        if (weird) {
            [0, .27].forEach((d, i) => {
                const o = ac.createOscillator();
                o.type = "sawtooth";
                o.frequency.setValueAtTime(i ? 330 : 420, t + d);
                o.frequency.exponentialRampToValueAtTime(i ? 190 : 260, t + d + .2);
                const bp = ac.createBiquadFilter();
                bp.type = "bandpass";
                bp.frequency.value = 900;
                bp.Q.value = 2.5;
                const g = ac.createGain();
                g.gain.setValueAtTime(0, t + d);
                g.gain.linearRampToValueAtTime(.3, t + d + .02);
                g.gain.exponentialRampToValueAtTime(.001, t + d + .22);
                o.connect(bp);
                bp.connect(g);
                g.connect(m);
                o.start(t + d);
                o.stop(t + d + .25);
            });
            return;
        }
        pop(m, t, .4);
        pop(m, t + .13, .28);
    };
    // silence＝鳴っている音を止める
    const silence = () => {
        try {
            if (master) {
                master.gain.cancelScheduledValues(ac.currentTime);
                master.gain.setTargetAtTime(0, ac.currentTime, .03);
            }
        }
        catch (e) { }
    };
    // ---- 紙ふぶき：地球の裏から打ち上がる。地球の後ろ（奥）のキャンバスで描き、地球の外に出たら手前のキャンバスに移して降らせる
    // mk＝紙ふぶき用のキャンバスを作る。z＝重なり順
    const mk = z => {
        const c = document.createElement("canvas");
        c.className = "rlcv";
        c.style.zIndex = z;
        c.setAttribute("aria-hidden", "true");
        return c;
    };
    // back＝地球の後ろ側、front＝前側のキャンバス
    const back = mk(0), front = mk(4);
    // 後ろのキャンバスを地球儀の下に差し込む
    stage.insertBefore(back, stage.querySelector("svg.globe"));
    stage.appendChild(front);
    // parts＝紙ふぶきの粒。raf＝アニメーション番号。tPrev＝前のフレームの時刻
    let parts = [], raf = 0, tPrev = 0;
    // COL＝紙ふぶきの色
    const COL = ["#e8452c", "#f5c244", "#3f77c4", "#4fb36a", "#ef6fa0", "#ff9a3c", "#ffffff", "#8e5bd6"];
    // sizeCv＝キャンバスの大きさを画面に合わせる
    const sizeCv = () => {
        const W = stage.clientWidth, H = stage.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
        [back, front].forEach(c => {
            c.width = Math.round(W * dpr);
            c.height = Math.round(H * dpr);
            c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
        });
        return [W, H];
    };
    // clearCv＝キャンバスを消す
    const clearCv = () => {
        cancelAnimationFrame(raf);
        raf = 0;
        parts = [];
        [back, front].forEach(c => c.getContext("2d").clearRect(0, 0, c.width, c.height));
    };
    // burst＝紙ふぶきを n 個打ち上げる
    const burst = n => {
        const [W, H] = [stage.clientWidth, stage.clientHeight], R = window.__globeR(), cx = W / 2, cy = H / 2;
        for (let i = 0; i < n; i++) {
            const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.25, v = R * (3.2 + Math.random() * 3);
            parts.push({ x: cx + (Math.random() - .5) * R * .5, y: cy + (Math.random() - .5) * R * .3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, r: Math.random() * 6.28, vr: (Math.random() - .5) * 12, ph: Math.random() * 6.28, vp: 6 + Math.random() * 8, k: 2 + Math.random() * 1.2, c: COL[i % COL.length], age: 0, front: false, life: 4.6 + Math.random() * 1.2 });
        }
    };
    // tick＝1フレーム分、粒を動かして描く
    const tick = ts => {
        const dt = Math.min(.033, (ts - tPrev) / 1000 || .016);
        tPrev = ts;
        const [W, H] = [stage.clientWidth, stage.clientHeight], R = window.__globeR(), cx = W / 2, cy = H / 2, G = R * 1.7;
        const cb = back.getContext("2d"), cf = front.getContext("2d");
        cb.clearRect(0, 0, W, H);
        cf.clearRect(0, 0, W, H);
        parts = parts.filter(p => {
            p.age += dt;
            p.vy += (G - p.k * p.vy) * dt;
            p.vx += -p.k * p.vx * dt + Math.sin(p.age * 5 + p.ph) * R * .25 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.r += p.vr * dt;
            p.ph += p.vp * dt;
            if (!p.front && p.age > .3 && Math.hypot(p.x - cx, p.y - cy) > R * 1.03)
                p.front = true;
            if (p.age > p.life || p.y > H + 20 || p.x < -30 || p.x > W + 30)
                return false;
            const c = p.front ? cf : cb;
            c.save();
            c.globalAlpha = Math.min(1, (p.life - p.age) / .8);
            c.translate(p.x, p.y);
            c.rotate(p.r);
            c.scale(1, Math.cos(p.ph));
            c.fillStyle = p.c;
            c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            c.restore();
            return true;
        });
        raf = parts.length ? requestAnimationFrame(tick) : 0;
        if (!parts.length) {
            cb.clearRect(0, 0, W, H);
            cf.clearRect(0, 0, W, H);
        }
    };
    // celebrate＝紙ふぶきと音で祝う
    const celebrate = () => {
        if (RM())
            return;
        sizeCv();
        clearCv();
        burst(150);
        setTimeout(() => {
            burst(110);
            if (!raf) {
                tPrev = performance.now();
                raf = requestAnimationFrame(tick);
            }
        }, 260);
        tPrev = performance.now();
        raf = requestAnimationFrame(tick);
    };
    // ---- ルーレット本体
    // 当たった場所のピンは、カードを閉じても残る。地図を動かしても、その場所について動く（次に回すまで）
    let pinLL = null;
    // __rlPin＝当たった場所のピンを、いまの表示位置に置き直す
    window.__rlPin = () => {
        if (!pinLL) {
            pin.hidden = true;
            return;
        }
        const q = window.__llPt(pinLL);
        if (!q || q[0] < -20 || q[1] < -20 || q[0] > stage.clientWidth + 20 || q[1] > stage.clientHeight + 20) {
            pin.hidden = true;
            return;
        }
        pin.style.left = q[0] + "px";
        pin.style.top = q[1] + "px";
        pin.hidden = false;
    };
    // ピンの見た目とキーボード操作の設定
    pin.style.pointerEvents = "auto";
    pin.style.cursor = "pointer";
    pin.setAttribute("role", "button");
    pin.setAttribute("aria-label", "当たった場所の情報を見る");
    pin.tabIndex = 0;
    // hide＝カードとピンを隠す
    const hide = () => {
        card.hidden = true;
    };
    // spin＝ルーレット本体。国を選ぶ→地球儀を回す→音を鳴らす→止まる→寄る→カードを出す
    const spin = async () => {
        if (busy)
            return;
        busy = true;
        const my = ++tok;
        hide();
        pinLL = null;
        pin.hidden = true;
        clearCv();
        AC();
        btn.disabled = true;
        btn.classList.add("spin");
        const wd = Math.random() < .1 ? (Math.random() < .5 ? "roll" : "land") : "";
        try {
            let D;
            try {
                D = await load();
            }
            catch (e) {
                btn.title = "データを読み込めませんでした";
                await new Promise(r => setTimeout(r, 1800));
                return;
            }
            if (my !== tok)
                return;
            const { c, t } = pick(D), d = [c[0], c[2], t[0], t[1], t[2], t[3], t[4], t[5]];
            await window.__spinGlobe([d[3], d[4]], { dur: DUR, shift: box.classList.contains("rlin") ? (stage.clientHeight < 620 ? 60 : 14) : 0, onStart: () => roll(DUR / 1000, wd === "roll") });
            if (my !== tok)
                return;
            pinLL = [d[3], d[4]];
            window.__rlPin();
            el("rlkind").textContent = d[5] === "定" ? "定番" : "マニアック";
            el("rlcty").textContent = d[1];
            el("rlcity").textContent = d[2];
            const tg = el("rltag"), tx = d[0] === "JPN" ? "日本" : d[0] === "THA" ? "予定の国" : EX.has(d[0]) ? "行ったことのある国" : "";
            tg.textContent = tx;
            tg.hidden = !tx;
            el("rlwarn").hidden = !WARN.has(d[0]);
            const fl = el("rlflag");
            fl.src = "flags/" + c[1] + ".svg";
            fl.alt = d[1] + "の国旗";
            el("rlr").innerHTML = rankHTML(D, c, t);
            el("rlts").innerHTML = d[6].map((x, k) => {
                const [n, m] = spotOf(x, k);
                return `<li>${mot(m)}<span>${esc(n)}</span></li>`;
            }).join("");
            el("rlun").textContent = d[7];
            card.style.maxHeight = "";
            card.hidden = false;
            fanfare(wd === "land");
            celebrate();
            await window.__zoomGlobe([d[3], d[4]], { shift: box.classList.contains("rlin") ? (stage.clientHeight < 620 ? 60 : 14) : 0, onFrame: () => window.__rlPin() });
            if (my !== tok)
                return;
            if (!box.classList.contains("rlin")) {
                const r = box.getBoundingClientRect();
                if (r.top < 0)
                    window.scrollBy({ top: r.top - 8, behavior: "smooth" });
            }
        }
        finally {
            busy = false;
            btn.disabled = false;
            btn.classList.remove("spin");
        }
    };
    // 検索から呼ぶ：国・都市の場所へ地球儀を回して寄せる。都市なら、ルーレットと同じカード（評価つき）も出す
    // 外から使う：データの読み込みと、国・都市への移動
    window.__rlLoad = load;
    // __rlGo＝検索結果の国・都市へ、地球儀で移動してカードを出す
    window.__rlGo = async (iso, tname) => {
        if (busy)
            window.__spinStop();
        busy = true;
        const my = ++tok;
        hide();
        clearCv();
        pinLL = null;
        pin.hidden = true;
        try {
            const D = await load(), c = D.find(z => z[0] === iso);
            if (!c)
                return;
            const t = tname ? c[3].find(x => x[0] === tname) : null;
            const ll = t ? [t[1], t[2]] : d3.geoCentroid({ type: "MultiPoint", coordinates: c[3].map(x => [x[1], x[2]]) }), sh = box.classList.contains("rlin") ? (stage.clientHeight < 620 ? 60 : 14) : 0;
            await window.__spinGlobe(ll, { dur: 1500, turns: .01, shift: sh });
            if (my !== tok)
                return;
            if (t) {
                const d = [c[0], c[2], t[0], t[1], t[2], t[3], t[4], t[5]];
                pinLL = ll;
                window.__rlPin();
                el("rlkind").textContent = d[5] === "定" ? "定番" : "マニアック";
                el("rlcty").textContent = d[1];
                el("rlcity").textContent = d[2];
                const tg = el("rltag"), tx = d[0] === "JPN" ? "日本" : d[0] === "THA" ? "予定の国" : EX.has(d[0]) ? "行ったことのある国" : "";
                tg.textContent = tx;
                tg.hidden = !tx;
                el("rlwarn").hidden = !WARN.has(d[0]);
                const fl = el("rlflag");
                fl.src = "flags/" + c[1] + ".svg";
                fl.alt = d[1] + "の国旗";
                el("rlr").innerHTML = rankHTML(D, c, t);
                el("rlts").innerHTML = d[6].map((x, k) => {
                    const [n, m] = spotOf(x, k);
                    return `<li>${mot(m)}<span>${esc(n)}</span></li>`;
                }).join("");
                el("rlun").textContent = d[7];
                card.style.maxHeight = "";
                card.hidden = false;
            }
            await window.__zoomGlobe(ll, { k: t ? 3.2 : 1.8, shift: sh, onFrame: () => window.__rlPin() });
        }
        finally {
            busy = false;
        }
    };
    // ルーレットのボタン
    btn.addEventListener("click", spin);
    // × ボタンでカードを閉じる
    el("rlx").addEventListener("click", () => {
        hide();
        clearCv();
    });
    // 地図を触ったらカードを閉じる
    stage.addEventListener("pointerdown", e => {
        if (e.target.closest(".rlbox,.rlpin,.srbox"))
            return;
        if (busy) {
            tok++;
            window.__spinStop();
            silence();
            pinLL = null;
            pin.hidden = true;
        }
    });
    // ピンを押したらカードを開く
    pin.addEventListener("click", () => {
        if (pinLL && el("rlcity").textContent)
            card.hidden = false;
    });
    // ピンのキー操作（Enter）
    pin.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pin.click();
        }
    });
    // ウィンドウの大きさが変わったら紙ふぶきとピンを合わせ直す
    window.addEventListener("resize", () => {
        window.__rlPin();
        if (parts.length)
            sizeCv();
    });
})();
