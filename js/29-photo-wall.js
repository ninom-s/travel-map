// ======================================================================
// 29. 写真ウォール  (29-photo-wall.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 写真ウォール（選んでいる旅の写真を、置き場所ごとに並べる。押すと解説、そこから地図へ） ----
(() => {
    // el＝id から要素を取る
    const el = id => document.getElementById(id);
    // collect＝選んでいる旅のイラストの写真を集め、置き場所ごとにまとめる
    const collect = () => {
        const seen = new Set(), out = [], tripMax = {};
        ILLS.forEach((il, i) => {
            if (!tripOn(il.trip))
                return;
            const o = window.__illOrd(i);
            tripMax[il.trip] = Math.max(tripMax[il.trip] || 0, o < 1e8 ? o : 0);
            (il.photos || (il.photo ? [il.photo] : [])).forEach(src => {
                if (seen.has(src))
                    return;
                seen.add(src);
                out.push({ src, i, name: il.name, o, key: "i" + o });
            });
        });
        // ✕印の写真（イラストに使っていないもの）は、その旅の最後に、出来事の見出しでまとめる
        EVENTS.forEach((ev, e) => {
            const t = ev.trip || "eu";
            if (!tripOn(t))
                return;
            (ev.photos || []).forEach(src => {
                if (seen.has(src))
                    return;
                seen.add(src);
                out.push({ src, e, name: ev.title, o: (tripMax[t] || 0) + .5, key: "e" + e, ev });
            });
        });
        return out.sort((a, b) => a.o - b.o);
    };
    // render＝写真ウォールの HTML を作る。写真を押すと解説が開く
    const render = () => {
        const items = collect(), groups = [];
        items.forEach(it => {
            const g = groups[groups.length - 1];
            if (g && g.key === it.key)
                g.items.push(it);
            else
                groups.push({ key: it.key, items: [it] });
        });
        const ts = TRIPS.filter(t => tripOn(t.key));
        el("photosub").textContent = `${items.length}枚　${ts.length > 1 ? "いま地図に出している旅" : TRIPNAME[ts[0].key]}`;
        el("photobody").innerHTML = groups.length ? groups.map(g => {
            const f = g.items[0];
            let head;
            if (f.ev)
                head = `${esc(f.ev.title)}<time>${esc(f.ev.d)}</time>`;
            else {
                const [pl, dd] = window.__illPlace(f.i);
                head = `${esc(pl)}${dd ? `<time>${esc(dd)}</time>` : ""}`;
            }
            return `<div class="ggrp"><h3>${head}</h3><div class="pgrid">${g.items.map(it => `<button class="pph" type="button" ${it.ev ? `data-e="${it.e}"` : `data-i="${it.i}"`} aria-label="${esc(it.name)}の写真"><img loading="lazy" decoding="async" width="800" height="600" src="${esc(it.src)}" alt=""><span>${esc(it.name)}</span></button>`).join("")}</div></div>`;
        }).join("") : `<p class="empty">この旅には、まだ写真がない。</p>`;
    };
    // ピンバッチ図鑑：写真はまだ。photo に "photos/pin_xxx.webp" を入れると、その枠に写真が出る
    // 写真つきは what に「何のデザインか」を書く。写真待ちの枠は、★で買ったと確認できている場所だけ
    // PINS＝ピンバッジ図鑑のデータ（都市名・何のデザインか・写真）
    const PINS = [
        { trip: "eu", place: "ロヴァニエミ", what: "トナカイ注意の標識", photo: "photos/pin_fi_sign.webp" },
        { trip: "eu", place: "ロヴァニエミ", what: "フィンランド国旗", photo: "photos/pin_fi_flag.webp" },
        { trip: "eu", place: "ロヴァニエミ", what: "金色のトナカイの横顔", photo: "photos/pin_fi_deerhead.webp" },
        { trip: "eu", place: "ロヴァニエミ", what: "トナカイと国旗", photo: "photos/pin_fi_reindeer.webp" },
        { trip: "eu", place: "ロンドン", what: "タワーブリッジ", photo: "photos/pin_london_tower.webp" },
        { trip: "eu", place: "ロンドン", what: "ビッグ・ベンとユニオンジャック", photo: "photos/pin_london_bigben.webp" },
        { trip: "eu", place: "ロンドン", what: "ひげ付きの2階建てバス", photo: "photos/pin_london_bus.webp" },
        { trip: "eu", place: "オックスフォード", what: "大学の紋章（開いた本と3つの王冠）", photo: "photos/pin_oxford.webp" },
        { trip: "eu", place: "オックスフォード", what: "紋章の盾（カラスとバラ、ライオンの十字）", photo: "photos/pin_oxford_crest.webp" },
        { trip: "eu", place: "イギリス", what: "バートン・オン・ザ・ウォーター", photo: "photos/pin_bourton.webp" },
        { trip: "eu", place: "イギリス", what: "ビブリー（コッツウォルズ）", photo: "photos/pin_bibury.webp" },
        { trip: "eu", place: "イギリス", what: "スコットランド（地図とバグパイプ奏者）", photo: "photos/pin_scotland.webp" },
        { trip: "eu", place: "イギリス", what: "ネッシー（スコットランド）", photo: "photos/pin_nessie.webp" },
        { trip: "eu", place: "イギリス", what: "タータン柄のスコティッシュ・テリア", photo: "photos/pin_scotty.webp" },
        { trip: "eu", place: "バルセロナ", what: "サグラダ・ファミリア", photo: "photos/pin_sagrada.webp" },
        { trip: "eu", place: "バルセロナ", what: "ステンドグラス風の丸いピン", photo: "photos/pin_barcelona_glass.webp" },
        { trip: "eu", place: "バルセロナ", what: "踊る男女", photo: "photos/pin_barcelona_dancers.webp" },
        { trip: "eu", place: "バルセロナ", what: "モザイク柄のトカゲ", photo: "photos/pin_barcelona_lizard.webp" },
        { trip: "eu", place: "マルセイユ", what: "ヴュー・ポール（旧港）", photo: "photos/pin_marseille_vieuxport.webp" },
        { trip: "eu", place: "モナコ", what: "カジノ", photo: "photos/pin_monaco_casino.webp" },
        { trip: "eu", place: "モナコ", what: "サーカス・フェスティバルのピエロ", photo: "photos/pin_monaco_circus.webp" },
        { trip: "eu", place: "モナコ", what: "サーカス・フェスティバル2025（キリンと馬）", photo: "photos/pin_monaco_circus2025.webp" },
        { trip: "eu", place: "マントン", what: "レモンと塔", photo: "photos/pin_menton_lemon.webp" },
        { trip: "eu", place: "エズ", what: "交差した旗（海辺の村とフランス国旗）", photo: "photos/pin_eze.webp" },
        { trip: "eu", place: "ニース", what: "フランス地図とコート・ダジュール", photo: "photos/pin_nice_france.webp" },
        { trip: "eu", place: "ニース", what: "ヤシの木と海辺のホテル", photo: "photos/pin_nice_seaside.webp" },
        { trip: "eu", place: "ニース", what: "赤い鷲の紋章", photo: "photos/pin_nice_eagle.webp" },
        { trip: "eu", place: "カンヌ", what: "ハートとヤシの木", photo: "photos/pin_cannes_heart.webp" },
        { trip: "eu", place: "カンヌ", what: "カチンコと星", photo: "photos/pin_cannes_clapper.webp" },
        { trip: "eu", place: "ミラノ", what: "ドゥオーモ", photo: "photos/pin_milano_duomo.webp" },
        { trip: "eu", place: "ミラノ", what: "筆記体とイタリア国旗", photo: "photos/pin_milano_script.webp" },
        { trip: "eu", place: "ベネチア", what: "銀色の仮面", photo: "photos/pin_venezia_mask.webp" },
        { trip: "eu", place: "ベネチア", what: "ゴンドラ", photo: "photos/pin_venezia_gondola.webp" },
        { trip: "eu", place: "ベネチア", what: "2つの仮面", photo: "photos/pin_venezia_masks.webp" },
        { trip: "eu", place: "ボルツァーノ", what: "山とエーデルワイス", photo: "photos/pin_bolzano_mountain.webp" },
        { trip: "eu", place: "オルティゼーイ", what: "教会と赤い岩山", photo: "photos/pin_ortisei.webp" },
        { trip: "eu", place: "南チロル", what: "赤い鷲の紋章", photo: "photos/pin_suedtirol.webp" },
        { trip: "eu", place: "サンモリッツ", what: "太陽と筆記体のロゴ", photo: "photos/pin_stmoritz.webp" },
        { trip: "eu", place: "スイス", what: "国の形と十字の盾", photo: "photos/pin_swiss.webp" },
        { trip: "eu", place: "フュッセン", what: "3本の脚の紋章", photo: "photos/pin_fussen.webp" },
        { trip: "eu", place: "フュッセン", what: "ルートヴィヒ2世", photo: "photos/pin_ludwig.webp" },
        { trip: "eu", place: "フュッセン", what: "ノイシュヴァンシュタイン城", photo: "photos/pin_neuschwanstein.webp" },
        { trip: "eu", place: "ローテンブルク", what: "市門と木組みの家", photo: "photos/pin_rothenburg.webp" },
        { trip: "eu", place: "ドイツ", what: "バイエルンの紋章", photo: "photos/pin_bayern.webp" },
        { trip: "eu", place: "ドイツ", what: "鷲の紋章と国旗の盾", photo: "photos/pin_germany.webp" },
        { trip: "eu", place: "フランクフルト", what: "レーマー広場の街並み", photo: "photos/pin_frankfurt.webp" },
        { trip: "af", place: "エジプト", what: "有翼の女神の壁画", photo: "photos/pin_eg_mural.webp" },
        { trip: "af", place: "エジプト", what: "スカラベ", photo: "photos/pin_eg_scarab.webp" },
        { trip: "af", place: "エジプト", what: "ウジャトの目", photo: "photos/pin_eg_horus.webp" },
        { trip: "af", place: "エジプト", what: "ファラオのマスク", photo: "photos/pin_eg_tut.webp" },
        { trip: "af", place: "ケニア", what: "国旗", photo: "photos/pin_ke_flag.webp" },
        { trip: "af", place: "ケニア", what: "ライオン", photo: "photos/pin_ke_lion.webp" },
        { trip: "af", place: "ケニア", what: "座るチーター", photo: "photos/pin_ke_cheetah.webp" }
    ];
    // PCTRY＝都市名→国。PORDER＝国の並び順
    const PCTRY = { "ロヴァニエミ": "フィンランド", "ロンドン": "イギリス", "オックスフォード": "イギリス", "イギリス": "イギリス", "バルセロナ": "スペイン", "マルセイユ": "フランス", "マントン": "フランス", "エズ": "フランス", "ニース": "フランス", "カンヌ": "フランス", "モナコ": "モナコ", "ミラノ": "イタリア", "ベネチア": "イタリア", "ボルツァーノ": "イタリア", "オルティゼーイ": "イタリア", "南チロル": "イタリア", "サンモリッツ": "スイス", "スイス": "スイス", "フュッセン": "ドイツ", "ローテンブルク": "ドイツ", "ドイツ": "ドイツ", "フランクフルト": "ドイツ", "エジプト": "エジプト", "ケニア": "ケニア" };
    const PORDER = ["フィンランド", "イギリス", "スペイン", "フランス", "モナコ", "イタリア", "スイス", "ドイツ", "エジプト", "ケニア"];
    // pinCard＝ピンバッジ1つのカード。写真があれば表示、なければ空き枠
    const pinCard = p => p.photo ? `<div class="pin has"><img loading="lazy" decoding="async" width="640" height="640" src="${esc(p.photo)}" alt="${esc(p.place)}のピンバッチ（${esc(p.what || "")}）"><span class="pn">${esc(p.place)}${p.what ? `<small>${esc(p.what)}</small>` : ""}</span></div>`
        : `<div class="pin empty" aria-label="${esc(p.place)}のピンバッチ（写真待ち）"><span class="pc" aria-hidden="true">＋</span><span class="pn">${esc(p.place)}</span><span class="pw">写真待ち</span></div>`;
    // renderPins＝ピンバッジ図鑑を国ごとに並べて描く
    const renderPins = () => {
        const box = el("pinbook");
        if (!box)
            return;
        const ps = PINS.filter(p => tripOn(p.trip)), by = {};
        ps.forEach(p => {
            const c = PCTRY[p.place] || "その他";
            (by[c] = by[c] || []).push(p);
        });
        const cs = PORDER.filter(c => by[c]).concat(Object.keys(by).filter(c => !PORDER.includes(c)));
        el("pinsub").textContent = ps.length ? `${ps.length}個・${cs.length}か国。旅先で買ったピンバッチ` : "旅先で買ったピンバッチ";
        box.innerHTML = ps.length ? cs.map(c => `<section class="pinc"><h3>${esc(c)}<small>${by[c].length}個</small></h3><div class="pingrid">${by[c].map(pinCard).join("")}</div></section>`).join("") : `<p class="empty">この旅のピンバッチは、まだ登録していない。</p>`;
    };
    (window.__onTrips = window.__onTrips || []).push(renderPins);
    renderPins();
    // 写真・ピンを押したときの動き
    el("photobody").addEventListener("click", e => {
        const b = e.target.closest(".pph");
        if (!b)
            return;
        if (b.dataset.e !== undefined)
            window.__goEv(+b.dataset.e);
        else
            window.__showIll(+b.dataset.i);
    });
    (window.__onTrips = window.__onTrips || []).push(render);
    render();
})();
