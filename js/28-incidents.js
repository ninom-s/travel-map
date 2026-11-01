// ======================================================================
// 28. 事件簿  (28-incidents.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 事件簿（地図の✕印の出来事と、イラストの説明に書いたハプニング） ----
(() => {
    // el＝id から要素を取る。sleep＝指定ミリ秒待つ
    const el = id => document.getElementById(id), sleep = ms => new Promise(r => setTimeout(r, ms));
    // 「ちいさなハプニング」：イラストの説明に、本人が書いた出来事から選んだもの（説明の文はそのまま出す）
    const SMALL = [["eu", "成田駅で降りてしまった"], ["eu", "クローネは売り切れ"], ["eu", "凍った携帯"], ["eu", "洗濯物"], ["eu", "グリニッジ天文台"], ["eu", "間違えた切符"], ["eu", "夜明け前の墓地"], ["eu", "空港行きのトラム"],
        ["eu", "カランク国立公園"], ["eu", "梯子と鎖の道"], ["eu", "魚のスープ"], ["eu", "国境でネットが切れた"], ["eu", "最後の晩餐の教会"], ["eu", "日曜日で店が閉まってる"],
        ["af", "ピラミッドの見えるホテル"], ["af", "キリマ サファリ キャンプ"]];
    // evKey＝トラブルの日付（月/日）を、並び替え用の数字にする。アフリカ旅の1月は12を足して、12月の後ろに並べる
    const evKey = ev => {
        const m = /^(\d+)\/(\d+)/.exec(ev.d) || [0, 0, 0];
        let mo = +m[1];
        if ((ev.trip || "eu") === "af" && mo < 6)
            mo += 12;
        return (ev.trip === "af" ? 1000 : 0) + mo * 40 + (+m[2]);
    };
    // goEv＝事件簿のカードから、地図の✕印の場所へ飛んで説明を開く
    async function goEv(i) {
        if (window.__page() !== "map") {
            window.__setPage("map");
            await sleep(220);
        }
        const ev = EVENTS[i];
        if (typeof PS !== "undefined" && PS.on)
            stopPlay();
        if (!document.body.classList.contains("isfull"))
            stage.scrollIntoView({ block: "start", behavior: RM() ? "auto" : "smooth" });
        const k = Math.min(KMAX(), Math.max(cur.k, kRef() * 14));
        if (GL.on)
            await exitGlobe(P[ev.k], k);
        else {
            const p = proj(P[ev.k]);
            const T = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-p[0], -p[1]);
            if (RM())
                svg.call(zoom.transform, T);
            else
                await svg.transition().duration(750).call(zoom.transform, T).end().catch(() => { });
        }
        await sleep(140);
        const g = gOver.node().querySelector(`.ev[data-ev="${i}"]`);
        if (!g)
            return;
        if (g.style.display === "none")
            g.style.display = "";
        select(g);
    }
    // 外から使えるように公開
    window.__goEv = goEv;
    // render＝事件簿の一覧を作る（選んでいる旅のものだけ）。トラブルとちいさなハプニングを日付順に並べる
    const render = () => {
        const evs = EVENTS.map((ev, i) => ({ ev, i })).filter(({ ev }) => tripOn(ev.trip || "eu")).sort((a, b) => evKey(a.ev) - evKey(b.ev));
        const smalls = SMALL.map(([t, n]) => ILLS.findIndex(x => x.trip === t && x.name === n)).filter(i => i >= 0 && tripOn(ILLS[i].trip)).sort((a, b) => window.__illOrd(a) - window.__illOrd(b));
        const ts = TRIPS.filter(t => tripOn(t.key));
        el("failsub").textContent = ts.length > 1 ? "いま地図に出している旅の分" : TRIPNAME[ts[0].key];
        el("failtiles").innerHTML = `<div class="stile"><small>大きなやらかし</small><b>${evs.length}<i>件</i></b><em>地図の✕印</em></div><div class="stile"><small>ちいさなハプニング</small><b>${smalls.length}<i>件</i></b><em>イラストに書いた出来事</em></div>`;
        let h = "";
        if (evs.length) {
            h += `<h3 class="sec">大きなやらかし</h3><p class="secsub">運休・乗り遅れ・スト・閉館。地図の✕印と同じ出来事</p><div class="fcards">` + evs.map(({ ev, i }) => `<article class="fcard"><div class="k"><span class="tag ${ev.trip || "eu"}">${esc(TRIPNAME[ev.trip || "eu"])}</span><time>${esc(ev.d)}</time></div><h4>${esc(ev.title)}</h4><p class="fw"><span class="mode ev">✕</span>${esc(ev.where)}</p>
      <ul class="tl">${ev.tl.map(([t, x]) => `<li><time>${esc(t)}</time><span>${esc(x)}</span></li>`).join("")}</ul>
      ${ev.photos && ev.photos.length ? `<div class="fph">${ev.photos.slice(0, 2).map(u => `<img loading="lazy" src="${esc(u)}" alt="${esc(ev.title)}の写真">`).join("")}</div>` : ""}
      <button class="chip" type="button" data-ev="${i}">地図で見る</button></article>`).join("") + `</div>`;
        }
        if (smalls.length) {
            h += `<h3 class="sec">ちいさなハプニング</h3><p class="secsub">押すと、思い出の解説と写真が出る</p><div class="fsmall">` + smalls.map(i => {
                const il = ILLS[i], [pl, dd] = window.__illPlace(i);
                return `<button class="fsm" type="button" data-i="${i}" aria-label="${esc(il.name)}"><svg viewBox="-22 -22 44 44" aria-hidden="true"><circle r="21" fill="var(--card)" stroke="var(--rule)"/><g transform="scale(1.45)">${ICONS[il.ic] || ""}</g></svg><b>${esc(il.name)}</b><span>${esc(il.cap)}</span><em>${esc(pl)}${dd ? `（${esc(dd)}）` : ""}</em></button>`;
            }).join("") + `</div>`;
        }
        if (!h)
            h = `<p class="empty">この旅には、まだやらかしの記録がない。</p>`;
        el("failbody").innerHTML = h;
        el("failnote").textContent = "";
    };
    // カードを押したら地図へ飛ぶ／イラストの解説を開く
    el("failbody").addEventListener("click", e => {
        const b = e.target.closest("[data-ev]");
        if (b) {
            goEv(+b.dataset.ev);
            return;
        }
        const c = e.target.closest(".fsm");
        if (c)
            window.__showIll(+c.dataset.i);
    });
    (window.__onTrips = window.__onTrips || []).push(render);
    render();
})();
