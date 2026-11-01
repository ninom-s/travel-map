// ======================================================================
// 23. 操作説明カード  (23-help-card.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- help card ----
(() => {
    const hb = document.getElementById("zhelp"), hc = document.getElementById("help");
    // set＝ヘルプカードの開閉（開いたら aria-expanded も更新）
    const set = on => {
        hc.hidden = !on;
        hb.setAttribute("aria-expanded", on ? "true" : "false");
        if (on)
            document.getElementById("helpx").focus({ preventScroll: true });
    };
    // ? ボタンで開閉
    hb.addEventListener("click", e => {
        e.stopPropagation();
        set(hc.hidden);
    });
    // × ボタンで閉じる
    document.getElementById("helpx").addEventListener("click", () => {
        set(false);
        hb.focus({ preventScroll: true });
    });
    ["pointerdown", "wheel", "touchstart", "dblclick", "mousedown"].forEach(t => hc.addEventListener(t, e => e.stopPropagation(), { passive: true }));
    // Esc で閉じる
    addEventListener("keydown", e => {
        if (e.key === "Escape" && !hc.hidden) {
            set(false);
            e.stopImmediatePropagation();
        }
    }, true);
})();
