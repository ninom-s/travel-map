// ======================================================================
// 24. イラスト一覧  (24-illustration-list.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- illustration list under the map ----
(() => {
    // galbody＝一覧の本体（場所ごとのグループが入る）
    const body = document.getElementById("galbody");
    // stopOf＝地点コードから、その地点を含む旅の寄港地を探す
    const stopOf = k => {
        for (const t of TRIPS) {
            const s = t.stops.find(s => s.k === k);
            if (s)
                return s;
        }
        return null;
    };
    // order places by when they come up in the trip playback
    const pos = {};
    let n = 0;
    // add＝旅の再生順に地点を並べて、順位 pos を付ける
    const add = (tr, k) => {
        (pos[tr + k] = pos[tr + k] || []).push(n++);
    };
    ["eu", "af"].forEach(tr => PLAYS[tr].forEach(st => {
        st.legs.forEach(([m, ks]) => ks.forEach(k => add(tr, k)));
        add(tr, st.end);
    }));
    const ord = {};
    for (const key in pos)
        ord[key] = pos[key][0];
    // places visited twice: which illustrations belong to which visit (names not listed go to the "*" visit)
    // VISIT＝2回訪れた場所で、どの訪問にどのイラストが属するか（日付・最初／最後・名前の指定）
    const VISIT = { koNRT: [{ d: "2019/3/17", at: "first", names: "*" }], euNRT: [{ d: "1/2", at: "first", names: ["成田駅で降りてしまった", "クローネは売り切れ"] }, { d: "2/4", at: "last", names: "*" }],
        euFRA: [{ d: "1/2", at: "first", names: ["初めて海外で買ったパン"] }, { d: "2/3", at: "last", names: "*" }],
        afCAI: [{ d: "12/21", at: "first", names: "*" }] };
    // visitOf＝イラストがどの訪問に属するか
    const visitOf = il => {
        const v = VISIT[il.trip + il.k];
        if (!v)
            return null;
        return v.find(x => x.names !== "*" && x.names.includes(il.name)) || v.find(x => x.names === "*");
    };
    // ordOf＝場所の並び順（旅の順番）を求める
    const ordOf = (tr, k, at) => {
        if (tr === "ld")
            return -3;
        if (tr === "ko")
            return -2;
        if (tr === "hi")
            return -1;
        if (at === "last" && pos[tr + k])
            return pos[tr + k][pos[tr + k].length - 1];
        if (tr + k in ord)
            return ord[tr + k];
        let best = 1e9, bd = 9;
        for (const key in ord) {
            if (!key.startsWith(tr))
                continue;
            const q = P[key.slice(2)];
            if (!q)
                continue;
            const d = d3.geoDistance(q, P[k]);
            if (d < bd) {
                bd = d;
                best = ord[key];
            }
        }
        return best + 0.5;
    };
    // groups＝場所（と訪問）ごとにイラストをまとめる
    const groups = new Map();
    ILLS.forEach((il, i) => {
        const v = visitOf(il);
        const id = il.trip + (/^PL\d/.test(il.k) ? "PL" : il.k) + (v ? "@" + v.d : "");
        if (!groups.has(id))
            groups.set(id, { tr: il.trip, k: il.k, o: ordOf(il.trip, il.k, v && v.at), vd: v && v.d, items: [] });
        groups.get(id).items.push(i);
    });
    // list＝グループを旅の順に並べたもの
    const list = [...groups.values()].sort((a, b) => a.o - b.o || (a.tr < b.tr ? -1 : 1));
    // GNAME＝地点コードでは名前が足りない場所の、グループ見出しの名前
    const GNAME = { HIA: "機内（日本 → ホノルル）", MOR: "カフェ・モーリーズ（ダイヤモンド・ヘッド）", NRT: "成田", PL: "機内（成田 → フランクフルト）", KZS: "カレッツァ湖", FIE: "フィエ・アッロ・シリアル", ORT: "オルティゼーイ", GEM: "大エジプト博物館", DEN: "デンデラ神殿", KCP: "キリマ サファリ キャンプ", AMB: "アンボセリ国立公園（サファリ）" }, GDATE = { PL: "1/2" }, gk = k => /^PL\d/.test(k) ? "PL" : k;
    // place＝グループの見出し（場所名）
    const place = g => {
        if (GNAME[gk(g.k)])
            return GNAME[gk(g.k)];
        const s = stopOf(g.k);
        return s ? s.name : ((WPN[g.k] || TRN[g.k] || nameOf(g.k)).replace(/（[^）]*）$/, ""));
    };
    // dates with the year: the Europe trip is all 2025; the Africa trip is December 2025 and January 2026
    // yr＝日付に年を足す（ヨーロッパは2025年、アフリカは2025年12月〜2026年1月）
    const yr = (d, tr) => {
        if (tr === "ko" || tr === "hi" || tr === "ld" || tr === "cn")
            return d;
        let last = null;
        return d.replace(/(\d{1,2})\/(\d{1,2})/g, (m, mo) => {
            const y = tr === "th" ? 2026 : (tr === "af" && +mo < 6 ? 2026 : 2025);
            const out = y !== last ? `${y}/${m}` : m;
            last = y;
            return out;
        });
    };
    const date = g => yr(date0(g), g.tr);
    // date0＝グループの日付（年なし）。date＝年つき
    const date0 = g => {
        if (g.vd)
            return g.vd;
        if (GDATE[gk(g.k)])
            return GDATE[gk(g.k)];
        const s = stopOf(g.k);
        return s ? s.d : (DAYT[g.k] ? DAYT[g.k].d : "");
    };
    // 一覧の HTML を作って流し込む
    body.innerHTML = list.map(g => `<div class="ggrp" data-tr="${g.tr}"><h3>${esc(place(g))}${date(g) ? `<time>${esc(date(g))}</time>` : ""}</h3><div class="ggrid">${g.items.map(i => {
        const il = ILLS[i], pn = phList(il).length;
        return `<button type="button" class="gcard" data-i="${i}" aria-label="${esc(il.name)}（${esc(place(g))}）${pn ? "、写真" + pn + "枚" : ""}"><svg width="38" height="38" viewBox="-22 -22 44 44" aria-hidden="true"><circle r="21" fill="var(--card)" stroke="var(--rule)"/><g transform="scale(1.45)">${ICONS[il.ic] || ""}</g></svg><span class="gn">${esc(il.name)}</span>${pn ? `<span class="gb" aria-hidden="true">${pn}</span>` : ""}</button>`;
    }).join("")}</div></div>`).join("");
    // galsub＝一覧の見出し下の件数表示
    const sub = document.getElementById("galsub");
    // countries, in route order
    // CTYS＝国フィルタの国一覧（旅の順）。KEYCTY＝地点コード→国、ISO＝ISO3→ISO2、ctyOf＝グループの国を決める
    const CTYS = [["KR", "韓国"], ["US", "アメリカ（ハワイ）"], ["JP", "日本・機内"], ["SE", "スウェーデン"], ["FI", "フィンランド"], ["GB", "イギリス"], ["ES", "スペイン"], ["FR", "フランス"], ["MC", "モナコ"], ["IT", "イタリア"], ["CH", "スイス"], ["DE", "ドイツ"], ["EG", "エジプト"], ["KE", "ケニア"], ["TH", "タイ"], ["CN", "中国"]];
    const KEYCTY = { EDR: "EG", EDS: "EG", TOL: "GB", LDM: "GB", SPX: "GB", ZTA: "GB", ECT: "GB", BKP: "GB", HPC: "GB", PRW: "GB", MMW: "GB", PCC: "GB", SEL: "KR", GBG: "KR", FLK: "KR", MDG: "KR", NDM: "KR", ICN: "KR", HNL: "US", MOR: "US", DHD: "US", KKC: "US", MKP: "US", HIA: "JP", NRT: "JP", PL: "JP", ARN: "SE", RVN: "FI", AUR: "FI", RNZ: "FI", LON: "GB", OXF: "GB", BOU: "GB", EDI: "GB", FTW: "GB", GLF: "GB", BCN: "ES", MRS: "FR", CNS: "FR", NCE: "FR", EZE: "FR", MEN: "FR", MCO: "MC",
        BOR: "IT", SRM: "IT", LAM: "IT", MIL: "IT", VAR: "IT", CHI: "IT", TIR: "IT", VCE: "IT", BZO: "IT", KZS: "IT", FIE: "IT", ORT: "IT", STM: "CH", BRU: "CH",
        MUC: "DE", HSW: "DE", FUS: "DE", NOE: "DE", ROT: "DE", NUE: "DE", WUE: "DE", FRA: "DE", CAI: "EG", GIZ: "EG", GEM: "EG", LXR: "EG", DEN: "EG", HRG: "EG", PDI: "EG", NBO: "KE", AMB: "KE", KCP: "KE", BKK: "TH", CNX: "TH", DIN: "TH", BJG: "CN", TSN: "CN", XIY: "CN", SHH: "CN", TAO: "CN", WUS: "CN", HYG: "CN" };
    const ISO = { KOR: "KR", USA: "US", SWE: "SE", FIN: "FI", GBR: "GB", ESP: "ES", FRA: "FR", MCO: "MC", ITA: "IT", CHE: "CH", DEU: "DE", EGY: "EG", KEN: "KE", JPN: "JP", CHN: "CN" };
    const ctyOf = k => {
        if (KEYCTY[gk(k)])
            return KEYCTY[gk(k)];
        const f = (world || []).find(f => d3.geoContains(f, P[k]));
        return f && ISO[f.id] || "";
    };
    // grpEls＝一覧の各グループ要素。各グループに国のデータ属性を付ける
    const grpEls = [...body.querySelectorAll(".ggrp")];
    grpEls.forEach((el, n) => {
        el.dataset.cty = ctyOf(list[n].k);
    });
    // cnt＝条件に合うイラストの数を数える
    const cnt = fn => list.reduce((t, g, n) => t + (fn(grpEls[n]) ? g.items.length : 0), 0);
    // 表示切り替え：tabs＝旅のタブ、ctyRow＝国フィルタ。国は一覧にあるものだけボタンにする
    const tabs = document.getElementById("gtabs"), ctyRow = document.getElementById("gcty"), ctyBtn = tabs.querySelector('[data-gv="cty"]');
    ctyRow.innerHTML = CTYS.filter(([c]) => grpEls.some(el => el.dataset.cty === c)).map(([c, t]) => `<button class="chip" type="button" data-gc="${c}" aria-pressed="false">${t}<small>${cnt(el => el.dataset.cty === c)}</small></button>`).join("");
    // curV＝いまの旅フィルタ、curC＝いまの国フィルタ
    let curV = "all", curC = "";
    // okTr＝その旅が表示中か
    const okTr = el => tripOn(el.dataset.tr);
    // setView＝旅と国で一覧を絞り込み、件数を更新する
    const setView = (v, c) => {
        if (v in SHOW && !SHOW[v])
            v = "all";
        curV = v;
        ctyRow.querySelectorAll("[data-gc]").forEach(b => {
            const n = cnt(el => okTr(el) && el.dataset.cty === b.dataset.gc);
            b.hidden = !n;
            b.querySelector("small").textContent = n;
        });
        if (v === "cty") {
            curC = c || curC;
            const vb = [...ctyRow.querySelectorAll("[data-gc]:not([hidden])")];
            if (!vb.some(b => b.dataset.gc === curC))
                curC = vb.length ? vb[0].dataset.gc : "";
        }
        tabs.querySelectorAll("[data-gv]").forEach(b => b.setAttribute("aria-pressed", b.dataset.gv === v ? "true" : "false"));
        ctyRow.hidden = v !== "cty";
        ctyBtn.setAttribute("aria-expanded", v === "cty" ? "true" : "false");
        ctyRow.querySelectorAll("[data-gc]").forEach(b => b.setAttribute("aria-pressed", v === "cty" && b.dataset.gc === curC ? "true" : "false"));
        const show = el => okTr(el) && (v === "all" || (v === "cty" ? el.dataset.cty === curC : el.dataset.tr === v));
        grpEls.forEach(el => {
            el.hidden = !show(el);
        });
        sub.textContent = `${cnt(show)}個。押すと、思い出の解説と写真が出る`;
        const on = v === "cty" && ctyRow.querySelector(`[data-gc="${curC}"]`);
        if (on) {
            const r = on.offsetLeft - ctyRow.offsetLeft;
            if (r < ctyRow.scrollLeft || r + on.offsetWidth > ctyRow.scrollLeft + ctyRow.clientWidth)
                ctyRow.scrollTo({ left: r - 16, behavior: RM() ? "auto" : "smooth" });
        }
    };
    // 旅のタブを押したときの絞り込み
    tabs.addEventListener("click", e => {
        const b = e.target.closest("[data-gv]");
        if (b)
            setView(b.dataset.gv);
    });
    // 国ボタンを押したときの絞り込み
    ctyRow.addEventListener("click", e => {
        const b = e.target.closest("[data-gc]");
        if (b)
            setView("cty", b.dataset.gc);
    });
    // the trip buttons above the map also switch the list
    // 地図の上の旅ボタンでも一覧を切り替える
    document.querySelectorAll('.seg .chip[data-trip]').forEach(b => b.addEventListener("click", () => setView(b.dataset.trip)));
    setView("all");
    // 外から呼べる操作：一覧の更新／全部表示
    window.__galRefresh = () => setView(curV, curC);
    window.__galAll = () => setView("all");
    // mark＝地図上で目印を付けているイラスト
    let mark = null;
    // __goIll＝一覧のイラストから、地図のその場所へ飛ぶ
    window.__goIll = i => goIll(i);
    // goIll＝地図に切り替え、その場所へ移動して解説を開く
    async function goIll(i) {
        if (window.__page && window.__page() !== "map") {
            window.__setPage("map");
            await new Promise(r => setTimeout(r, 220));
        }
        const il = ILLS[i];
        if (typeof PS !== "undefined" && PS.on)
            stopPlay();
        body.querySelectorAll(".gcard.on").forEach(c => c.classList.remove("on"));
        const card = body.querySelector(`.gcard[data-i="${i}"]`);
        if (card)
            card.classList.add("on");
        if (!document.body.classList.contains("isfull"))
            stage.scrollIntoView({ block: "start", behavior: RM() ? "auto" : "smooth" });
        const k = Math.min(KMAX(), Math.max(cur.k, kRef() * 14));
        if (GL.on)
            await exitGlobe(P[il.k], k);
        else {
            const p = proj(P[il.k]);
            const T = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-p[0], -p[1]);
            if (RM())
                svg.call(zoom.transform, T);
            else
                await svg.transition().duration(750).call(zoom.transform, T).end().catch(() => { });
        }
        await new Promise(r => setTimeout(r, 140));
        const g = gOver.node().querySelector(`.ill[data-ill="${i}"]`);
        if (!g)
            return;
        // an icon with no free spot at this zoom is still shown while it is selected
        if (g.style.display === "none") {
            g.style.display = "";
            const o = [0, -44];
            g.__o = o;
            g.querySelector(".ic").setAttribute("transform", `translate(${o[0]},${o[1]})`);
            const ld = g.querySelector(".ld");
            ld.setAttribute("x1", 0);
            ld.setAttribute("y1", -8);
            ld.setAttribute("x2", 0);
            ld.setAttribute("y2", -26);
        }
        select(g);
    }
    // 解説ダイアログ（<dialog>）を作る
    const dlg = document.createElement("dialog");
    dlg.className = "illdlg";
    dlg.setAttribute("aria-label", "イラストの解説");
    document.body.appendChild(dlg);
    // placeOfI＝イラスト番号→場所名の対応表
    const placeOfI = {};
    list.forEach(g => g.items.forEach(i => {
        placeOfI[i] = [place(g), date(g)];
    }));
    // dIdx＝ダイアログに出しているイラスト番号
    let dIdx = -1;
    // showDlg＝イラストの解説（写真・説明・日付）をダイアログに出す
    function showDlg(i) {
        dIdx = i;
        const il = ILLS[i], [pl, dd] = placeOfI[i] || ["", ""];
        const vis = [...body.querySelectorAll(".gcard")].filter(c => okTr(c.closest(".ggrp"))).map(c => +c.dataset.i), at = vis.indexOf(i);
        {
            const ge = body.querySelector(`.gcard[data-i="${i}"]`);
            const gg = ge && ge.closest(".ggrp");
            if (gg && gg.hidden)
                setView(curV === "cty" ? "cty" : curV === "all" ? "all" : gg.dataset.tr, gg.dataset.cty);
        }
        body.querySelectorAll(".gcard.on").forEach(c => c.classList.remove("on"));
        const card = body.querySelector(`.gcard[data-i="${i}"]`);
        if (card)
            card.classList.add("on");
        dlg.innerHTML = `<button type="button" class="pclose" data-a="x" aria-label="閉じる" title="閉じる">✕</button>
      <div class="illrow"><svg class="illbig" width="80" height="80" viewBox="-22 -22 44 44" aria-hidden="true"><circle r="21" fill="var(--card)" stroke="var(--rule)"/><g transform="scale(1.45)">${ICONS[il.ic] || ""}</g></svg>
      <div class="illtx"><div class="k"><span class="tag ${il.trip}">${TRIPNAME[il.trip] || ""}</span><h2>${esc(il.name)}</h2></div>
      <p>${esc(il.cap)}</p><p class="m">${esc(pl)}${dd ? `（${esc(dd)}）` : ""}</p>${noteHTML(il)}</div></div>${phHTML(il)}
      <div class="dlgnav"><button type="button" class="chip" data-a="prev" ${at > 0 ? "" : "disabled"}>‹ 前</button><button type="button" class="chip" data-a="map">地図で見る</button><button type="button" class="chip" data-a="next" ${at >= 0 && at < vis.length - 1 ? "" : "disabled"}>次 ›</button></div>`;
        dlg.dataset.prev = at > 0 ? vis[at - 1] : "";
        dlg.dataset.next = at >= 0 && at < vis.length - 1 ? vis[at + 1] : "";
        initPhs(dlg);
        if (!dlg.open)
            dlg.showModal();
        dlg.querySelector('[data-a="x"]').focus({ preventScroll: true });
    }
    // ダイアログの背景クリックや前後ボタンの処理
    dlg.addEventListener("click", e => {
        if (e.target === dlg) {
            dlg.close();
            return;
        }
        const b = e.target.closest("[data-a]");
        if (!b)
            return;
        const a = b.dataset.a;
        if (a === "x")
            dlg.close();
        else if (a === "prev" && dlg.dataset.prev !== "")
            showDlg(+dlg.dataset.prev);
        else if (a === "next" && dlg.dataset.next !== "")
            showDlg(+dlg.dataset.next);
        else if (a === "map") {
            dlg.close();
            goIll(dIdx);
        }
    });
    // ダイアログ内のキー操作（←→で前後）
    dlg.addEventListener("keydown", e => {
        if (e.target.closest(".phs"))
            return;
        if (e.key === "ArrowRight" && dlg.dataset.next !== "") {
            showDlg(+dlg.dataset.next);
            e.preventDefault();
        }
        if (e.key === "ArrowLeft" && dlg.dataset.prev !== "") {
            showDlg(+dlg.dataset.prev);
            e.preventDefault();
        }
    });
    // 全体のキー操作
    addEventListener("keydown", e => {
        if (e.key === "Escape" && dlg.open)
            e.stopImmediatePropagation();
    }, true);
    // 閉じたときの後片付け
    dlg.addEventListener("close", () => {
        const c = body.querySelector(`.gcard[data-i="${dIdx}"]`);
        if (c)
            c.focus({ preventScroll: true });
    });
    // 一覧のカードを押したらダイアログを開く
    body.addEventListener("click", e => {
        const c = e.target.closest(".gcard");
        if (c)
            showDlg(+c.dataset.i);
    });
    // 他の表示（事件簿・写真ウォール）から使う
    // ordOfI＝イラスト番号→並び順の対応表
    const ordOfI = {};
    list.forEach((g, n) => g.items.forEach(i => {
        ordOfI[i] = n;
    }));
    // 他のビューから使える関数：解説を開く／場所を引く／並び順を引く
    window.__showIll = showDlg;
    window.__illPlace = i => placeOfI[i] || ["", ""];
    window.__illOrd = i => ordOfI[i] ?? 1e9;
})();
