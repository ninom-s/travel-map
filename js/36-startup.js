// ======================================================================
// 36. 起動処理とURLの#ill  (36-startup.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// 起動：最初は地球儀の表示から始める。向きは、選んでいる旅（最初はヨーロッパ一周とエジプト・ケニア）の中心に合わせる
enterGlobe(window.__selCentroid ? window.__selCentroid() : null, { instant: true });
// ---- URLの #ill=イラスト名（noteの記事などから） ----
(() => {
    const GRP_OF = { eu: "sg", af: "fu", hi: "mina", ko: "mina", ld: "mina", th: "th", cn: "cn" };
    const open = () => {
        const m = /^#ill=(.+)$/.exec(location.hash);
        if (!m)
            return;
        let name;
        try {
            name = decodeURIComponent(m[1]);
        }
        catch (e) {
            return;
        }
        const i = ILLS.findIndex(x => x.name === name);
        if (i < 0)
            return;
        const il = ILLS[i];
        const tab = document.querySelector(`.ttab[data-grp="${GRP_OF[il.trip]}"]`);
        const had = tab && window.__tabOn && window.__tabOn(GRP_OF[il.trip]);
        if (tab && !had)
            window.__selTab(GRP_OF[il.trip]);
        setTimeout(() => window.__goIll && window.__goIll(i), tab && !had ? 950 : 0);
    };
    addEventListener("hashchange", open);
    setTimeout(open, 300);
})();
