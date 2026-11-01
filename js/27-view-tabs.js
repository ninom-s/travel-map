// ======================================================================
// 27. 表示の切り替えタブ  (27-view-tabs.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 表示の切り替え（マップ／旅の数字／イラスト一覧） ----
(() => {
    // vsw＝表示切り替えのボタン列。btns＝各ボタン
    const sw = document.getElementById("vsw"), btns = [...sw.querySelectorAll("[data-v]")];
    // cur＝いまの表示（map／stats／gal／photos／fail／tz／rec／pins）
    let cur = "map";
    // set＝表示を切り替える。選んだページだけ見せ、他は隠す。地図に戻ったときは大きさを取り直す
    const set = (v, focus) => {
        if (v === cur)
            return;
        if (cur === "map") {
            if (typeof PS !== "undefined" && PS.on)
                stopPlay();
            if (document.body.classList.contains("isfull"))
                setFull(false);
        }
        cur = v;
        document.body.dataset.view = v;
        btns.forEach(b => {
            const on = b.dataset.v === v;
            b.setAttribute("aria-selected", on ? "true" : "false");
            b.tabIndex = on ? 0 : -1;
            if (on && focus)
                b.focus({ preventScroll: true });
            if (on && b.scrollIntoView)
                b.scrollIntoView({ block: "nearest", inline: "center" });
        });
        if (v === "map") {
            dispatchEvent(new Event("resize"));
        }
        const r = sw.getBoundingClientRect();
        if (r.top < 0)
            sw.scrollIntoView({ block: "start", behavior: "auto" });
    };
    // ボタンを押したら切り替え
    btns.forEach(b => b.addEventListener("click", () => set(b.dataset.v)));
    // 矢印キーで隣の表示へ（キーボード操作）
    sw.addEventListener("keydown", e => {
        const i = btns.findIndex(b => b.dataset.v === cur);
        let n = -1;
        if (e.key === "ArrowRight")
            n = (i + 1) % btns.length;
        else if (e.key === "ArrowLeft")
            n = (i + btns.length - 1) % btns.length;
        else if (e.key === "Home")
            n = 0;
        else if (e.key === "End")
            n = btns.length - 1;
        if (n >= 0) {
            e.preventDefault();
            set(btns[n].dataset.v, true);
        }
    });
    // __page＝いまの表示を返す
    window.__page = () => cur;
    // __setPage＝外から表示を切り替える
    window.__setPage = v => set(v);
})();
