// ======================================================================
// 26. 旅のタブ  (26-trip-tabs.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 旅のタブ（複数選べる。押すたびに足す／外す。最低1つは残る） ----
(() => {
    // tp＝再生ボタン。PLAYK＝タブ→再生できる旅、NAME＝タブの表示名
    const tp = document.getElementById("tplay"), PLAYK = { sg: "eu", fu: "af" }, NAME = { sg: "ヨーロッパ一周", fu: "エジプト・ケニア", mina: "ハワイ・韓国・ロンドン" };
    // tabs＝旅のタブのボタン
    const tabs = [...document.querySelectorAll(".ttab")];
    // sel＝いま選んでいるタブの集合（最初はヨーロッパ一周とエジプト・ケニア。index.html のタブの aria-pressed と js/08 の SHOW も同じにしておく）
    let sel = new Set(["sg", "fu"]);
    // only＝選んでいるのが1つならそのタブ、複数なら null
    const only = () => sel.size === 1 ? [...sel][0] : null;
    // syncTP＝選択に応じて再生ボタンの表示を切り替える
    const syncTP = () => {
        const g = only(), k = g && PLAYK[g];
        tp.hidden = !k;
        if (k)
            tp.setAttribute("aria-label", `${NAME[g]}の旅を再生`);
    };
    syncTP();
    // 選んだ旅の寄港地の重心（複数のときの地球儀の向き）
    // centroid＝選んだ旅の寄港地の重心
    const centroid = () => {
        const pts = [];
        TRIPS.filter(t => tripOn(t.key)).forEach(t => t.stops.forEach(s => {
            if (P[s.k])
                pts.push(P[s.k]);
        }));
        const c = pts.length ? d3.geoCentroid({ type: "MultiPoint", coordinates: pts }) : [20, 30];
        return c && isFinite(c[0]) ? c : [20, 30];
    };
    // 起動時の地球儀の向き（js/36-startup.js が使う）
    window.__selCentroid = centroid;
    // apply＝タブの選択を変更して画面に反映する。
    // 旅の線・点・名前の表示を切り替え、再生中なら止め、パネルを閉じ、イラスト一覧を更新し、
    // 旅が1つならその旅の地図へ、複数なら全部が入る地球儀にする
    const apply = (next, force) => {
        const prev = [...sel].sort().join(), now = [...next].sort().join();
        if (prev === now && !force)
            return;
        sel = next;
        const keys = new Set();
        sel.forEach(g => GRPS[g].forEach(k => keys.add(k)));
        Object.keys(SHOW).forEach(k => {
            SHOW[k] = keys.has(k);
        });
        syncShow();
        tabs.forEach(x => x.setAttribute("aria-pressed", sel.has(x.dataset.grp) ? "true" : "false"));
        syncTP();
        ICO.key = "";
        ICO.segKey = "";
        (window.__onTrips || []).forEach(f => f());
        if (PS.on && (sel.size > 1 || !tripOn(PS.trip)))
            stopPlay();
        if (selEl && !selEl.getClientRects().length && typeof closePanel === "function")
            closePanel();
        if (sel.size > 1 && window.__galAll)
            window.__galAll();
        if (window.__galRefresh)
            window.__galRefresh();
        const g = only();
        if (!g) {
            enterGlobe(centroid(), { anim: true, mdur: 850 });
            return;
        } // 2つ以上：全部が入る地球儀
        const go = PLAYK[g] || (g === "th" ? "th" : g === "cn" ? "cn" : null);
        if (go) {
            const c = document.querySelector(`#triplist [data-trip="${go}"]`);
            if (c)
                c.click();
            return;
        }
        // ハワイ・韓国・ロンドンは平らな地図の1画面に収まらないので、地球儀で見せる
        // 経度110°・北緯42°を正面にすると、ロンドン・ソウル・ハワイが全部表側に入る
        enterGlobe([110, 42], { anim: true, mdur: 850 });
    };
    // タブを押すごとに、旅を足す／外す（最低1つは残る）
    tabs.forEach(b => b.addEventListener("click", () => {
        const g = b.dataset.grp, next = new Set(sel);
        if (next.has(g)) {
            if (next.size === 1)
                return;
            next.delete(g);
        }
        else
            next.add(g);
        apply(next);
    }));
    window.__selTab = g => apply(new Set([g])); // #ill= のリンク用：その旅だけにする
    // __tabOn＝そのタブが選ばれているか
    window.__tabOn = g => sel.has(g);
    // 再生ボタン
    tp.addEventListener("click", () => {
        const g = only(), k = g && PLAYK[g];
        if (k)
            startPlay(k);
    });
})();
