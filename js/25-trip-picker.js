// ======================================================================
// 25. 旅を選ぶメニュー  (25-trip-picker.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- trip picker (旅を選ぶ ▾) ----
(() => {
    // 旅を選ぶボタンとリスト、ラベルの要素
    const btn = document.getElementById("tripbtn"), list = document.getElementById("triplist"), lbl = document.getElementById("triplbl");
    // set＝リストの開閉
    const set = on => {
        list.hidden = !on;
        btn.setAttribute("aria-expanded", on ? "true" : "false");
    };
    // __tripLbl＝ボタンの文字を、選んでいる旅の名前に変える
    window.__tripLbl = b => {
        lbl.innerHTML = b ? b.innerHTML : "旅を選ぶ";
    };
    // ボタンを押すと開閉
    btn.addEventListener("click", e => {
        e.stopPropagation();
        set(list.hidden);
        if (!list.hidden) {
            const f = list.querySelector('[aria-pressed="true"]') || list.querySelector(".chip");
            if (f)
                f.focus({ preventScroll: true });
        }
    });
    // リストの旅を選んだとき
    list.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
        set(false);
        window.__tripLbl(b);
        btn.focus({ preventScroll: true });
    }));
    // リストの外をクリックしたら閉じる
    document.addEventListener("click", e => {
        if (!list.hidden && !e.target.closest(".tripsel"))
            set(false);
    });
    // Esc で閉じる
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !list.hidden) {
            set(false);
            btn.focus({ preventScroll: true });
        }
    });
})();
