// ======================================================================
// 32. 時差ビュー  (32-timezone.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 時差（日本時間を動かすと、旅先の時刻が出る。あいさつは、地図で国に寄ったときの国旗から開く詳細に入っている） ----
(() => {
    // el＝id から要素を取る
    const el = id => document.getElementById(id);
    // [表示, カタカナ]。slot：hello=いつでも／am=朝／day=昼／pm=夕方〜夜。pmFrom＝夜のあいさつに変わる時刻
    // C＝時差の表の国データ：[表示名, カタカナ, 時間帯(tz), あいさつ…]
    const C = [
        { id: "fi", tr: ["eu"], name: "フィンランド", lang: "フィンランド語", tz: "Europe/Helsinki", v: "fi-FI", g: { hello: ["Moi", "モイ"], am: ["Hyvää huomenta", "ヒュヴァー フオメンタ"], day: ["Hyvää päivää", "ヒュヴァー パイヴァー"], pm: ["Hyvää iltaa", "ヒュヴァー イルタ"], thanks: ["Kiitos", "キートス"] } },
        { id: "se", tr: ["eu"], name: "スウェーデン", lang: "スウェーデン語", tz: "Europe/Stockholm", v: "sv-SE", g: { hello: ["Hej", "ヘイ"], am: ["God morgon", "グー モロン"], pm: ["God kväll", "グー クヴェル"], thanks: ["Tack", "タック"] } },
        { id: "uk", tr: ["eu", "ld"], name: "イギリス", lang: "英語", tz: "Europe/London", v: "en-GB", g: { hello: ["Hello", "ハロー"], am: ["Good morning", "グッド モーニング"], day: ["Good afternoon", "グッド アフタヌーン"], pm: ["Good evening", "グッド イブニング"], thanks: ["Thank you", "サンキュー"], extra: [["軽い「ありがとう」", "Cheers", "チアーズ"]] } },
        { id: "es", tr: ["eu"], name: "スペイン", lang: "スペイン語", tz: "Europe/Madrid", v: "es-ES", pmFrom: 21, g: { hello: ["Hola", "オラ"], am: ["Buenos días", "ブエノス ディアス"], day: ["Buenas tardes", "ブエナス タルデス"], pm: ["Buenas noches", "ブエナス ノーチェス"], thanks: ["Gracias", "グラシアス"] } },
        { id: "fr", tr: ["eu"], name: "フランス", lang: "フランス語", tz: "Europe/Paris", v: "fr-FR", g: { hello: ["Bonjour", "ボンジュール"], pm: ["Bonsoir", "ボンソワール"], thanks: ["Merci", "メルシー"], extra: [["くだけた「やあ」", "Salut", "サリュ"]] } },
        { id: "mc", tr: ["eu"], name: "モナコ", lang: "フランス語（公用語）", tz: "Europe/Monaco", v: "fr-FR", g: { hello: ["Bonjour", "ボンジュール"], pm: ["Bonsoir", "ボンソワール"], thanks: ["Merci", "メルシー"] } },
        { id: "it", tr: ["eu"], name: "イタリア", lang: "イタリア語", tz: "Europe/Rome", v: "it-IT", pmFrom: 17, g: { hello: ["Ciao", "チャオ"], am: ["Buongiorno", "ボンジョルノ"], day: ["Buongiorno", "ボンジョルノ"], pm: ["Buonasera", "ボナセーラ"], thanks: ["Grazie", "グラッツィエ"], extra: [["南チロル（ボルツァーノ）ではドイツ語も", "Guten Tag", "グーテン ターク"]] } },
        { id: "ch", tr: ["eu"], name: "スイス", lang: "スイスドイツ語（ほか3言語）", tz: "Europe/Zurich", v: "de-DE", g: { hello: ["Grüezi", "グリュエッツィ"], thanks: ["Danke", "ダンケ"], extra: [["フランス語圏では", "Bonjour", "ボンジュール"], ["イタリア語圏では", "Buongiorno", "ボンジョルノ"]] } },
        { id: "de", tr: ["eu"], name: "ドイツ", lang: "ドイツ語", tz: "Europe/Berlin", v: "de-DE", g: { hello: ["Hallo", "ハロー"], am: ["Guten Morgen", "グーテン モルゲン"], day: ["Guten Tag", "グーテン ターク"], pm: ["Guten Abend", "グーテン アーベント"], thanks: ["Danke", "ダンケ"], extra: [["バイエルン（ミュンヘン・フュッセン）では", "Grüß Gott", "グリュース ゴット"]] } },
        { id: "eg", tr: ["af"], name: "エジプト", lang: "アラビア語", tz: "Africa/Cairo", v: "ar", g: { hello: ["السلام عليكم", "アッサラーム アライクム"], am: ["صباح الخير", "サバーハ ル ヘイル"], pm: ["مساء الخير", "マサー ル ヘイル"], thanks: ["شكرا", "ショクラン"] } },
        { id: "ke", tr: ["af"], name: "ケニア", lang: "スワヒリ語", tz: "Africa/Nairobi", v: "", g: { hello: ["Jambo", "ジャンボ"], thanks: ["Asante", "アサンテ"], extra: [["元気？", "Habari?", "ハバリ"], ["ようこそ", "Karibu", "カリブ"]] } },
        { id: "us", tr: ["hi"], name: "ハワイ", lang: "ハワイ語・英語", tz: "Pacific/Honolulu", v: "", g: { hello: ["Aloha", "アロハ"], am: ["Aloha kakahiaka", "アロハ カカヒアカ"], day: ["Aloha ʻauinalā", "アロハ アウイナラー"], pm: ["Aloha ahiahi", "アロハ アヒアヒ"], thanks: ["Mahalo", "マハロ"] } },
        { id: "kr", tr: ["ko"], name: "韓国", lang: "韓国語", tz: "Asia/Seoul", v: "ko-KR", g: { hello: ["안녕하세요", "アンニョンハセヨ"], thanks: ["감사합니다", "カムサハムニダ"] } },
        { id: "th", tr: ["th"], name: "タイ（予定）", lang: "タイ語", tz: "Asia/Bangkok", v: "th-TH", g: { hello: ["สวัสดี", "サワッディー"], thanks: ["ขอบคุณ", "コップクン"] } },
        { id: "cn", tr: ["cn"], name: "中国", lang: "中国語", tz: "Asia/Shanghai", v: "zh-CN", g: { hello: ["你好", "ニーハオ"], am: ["早上好", "ザオシャンハオ"], day: ["下午好", "シアウーハオ"], pm: ["晚上好", "ワンシャンハオ"], thanks: ["谢谢", "シエシエ"] } }
    ];
    // 旅した時期の日付（夏時間の有無を、その時期の時刻で計算するため）。Mのロンドンは時期が分からないので冬の日
    // REF＝旅ごとの基準日（夏時間の有無をその時期で計算する）
    const REF = { eu: "2025-01-15", af: "2025-12-25", hi: "2025-01-15", ko: "2025-01-15", ld: "2026-01-15", th: "2026-11-24", cn: "2010-01-15" };
    // fmtC＝時刻整形器のキャッシュ
    const fmtC = {};
    // parts＝タイムゾーン tz の時刻 t を、日付・時・分に分ける
    const parts = (tz, t) => {
        const f = fmtC[tz] || (fmtC[tz] = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));
        const o = {};
        f.formatToParts(new Date(t)).forEach(p => {
            if (p.type !== "literal")
                o[p.type] = +p.value;
        });
        return o;
    };
    // pad/hm＝0 埋めと「HH:MM」の整形
    const pad = n => String(n).padStart(2, "0"), hm = m => pad(Math.floor(m / 60)) + ":" + pad(m % 60);
    // nowJst＝いまの日本時間（分）
    const nowJst = () => {
        const p = parts("Asia/Tokyo", Date.now());
        return Math.round((p.hour * 60 + p.minute) / 5) * 5 % 1440;
    };
    // jm＝スライダーで動かしている日本時間（分）
    let jm = nowJst();
    // slot＝その時刻が、朝・昼・夜のどのあいさつの時間帯か
    const slot = (c, h) => {
        const pf = c.pmFrom || 18;
        return h >= 5 && h < 12 ? "am" : h >= 12 && h < pf ? "day" : "pm";
    };
    // SL＝あいさつの種類の名前
    const SL = { hello: "あいさつ", am: "朝のあいさつ", day: "昼のあいさつ", pm: "夜のあいさつ" };
    // spk＝音声合成（あいさつを読み上げる）
    const spk = window.speechSynthesis;
    // line＝カードの1行（ラベル＋文字）
    const line = (lb, t, k, v, cls = "") => `<div class="tzl ${cls}"><span class="lb">${esc(lb)}</span><span class="tx" ${/[؀-ۿ]/.test(t) ? 'dir="rtl"' : ""}>${esc(t)}</span><span class="ka">${esc(k)}</span>${v && spk ? `<button type="button" class="tzsay" data-t="${esc(t)}" data-v="${v}" aria-label="聞く：${esc(t)}">聞く</button>` : ""}</div>`;
    // card＝1か国分の時刻カード（現地の時刻・日本との差・あいさつ・読み上げボタン）
    function card(c, ref, note, nohd) {
        const [hh, mm] = [Math.floor(jm / 60), jm % 60], t = Date.parse(`${ref}T${pad(hh)}:${pad(mm)}:00+09:00`), p = parts(c.tz, t);
        const off = (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(t / 60000) * 60000) / 60000, diff = off - 540, [ry, rm, rd] = ref.split("-").map(Number), dd = Math.round((Date.UTC(p.year, p.month - 1, p.day) - Date.UTC(ry, rm - 1, rd)) / 864e5);
        const lm = p.hour * 60 + p.minute, s = slot(c, p.hour), g = c.g, main = g[s] || g.hello;
        const dtxt = diff === 0 ? "日本と同じ時刻" : `日本より${Math.abs(diff / 60)}時間${diff < 0 ? "遅い" : "早い"}`;
        const dl = dd === 0 ? "" : `${p.month}/${p.day}（${dd < 0 ? "前日" : "翌日"}）`;
        const sl = g[s] ? s : "hello";
        return `<div class="tzc">${nohd ? "" : `<div class="hd"><b>${esc(c.name)}</b><small>${esc(c.lang)}</small></div>`}
      ${nohd ? "" : `<div class="tm"><b>${hm(lm)}</b><span>${dtxt}${dl ? `・${dl}` : ""}</span></div>
      <div class="tzbar" aria-hidden="true"><i style="left:${(lm / 1440 * 100).toFixed(1)}%"></i></div>`}
      ${nohd ? `<div class="tzg">${line(SL[sl], main[0], main[1], c.v)}${line("ありがとう", g.thanks[0], g.thanks[1], c.v, "sm")}${(g.extra || []).map(e => line(e[0], e[1], e[2], c.v, "sm")).join("")}</div>` : ""}${note ? `<small class="tzn">${esc(note)}</small>` : ""}</div>`;
    }
    // render＝スライダー時刻に合わせて全カードを描き直す
    const render = () => {
        const keys = TRIPS.map(t => t.key).filter(tripOn), seen = new Set();
        let h = "";
        keys.forEach(k => {
            const cs = C.filter(c => c.tr.includes(k) && !seen.has(c.id));
            if (!cs.length)
                return;
            cs.forEach(c => seen.add(c.id));
            h += `<h3 class="tzgh">${esc(TRIPNAME[k])}</h3><div class="tzgrid">${cs.map(c => card(c, REF[k] || REF.eu, k === "ld" && c.id === "uk" ? "夏時間（3月末〜10月末）は、日本より8時間遅くなる" : "")).join("")}</div>`;
        });
        el("tzbody").innerHTML = h || `<p class="empty">この旅の時差は、まだ入っていない。</p>`;
        el("tzt").textContent = hm(jm);
        el("tzr").value = jm;
    };
    // スライダー：日本時間を動かす
    el("tzr").addEventListener("input", e => {
        jm = +e.target.value;
        render();
    });
    // 「いま」ボタン：現在時刻に戻す
    el("tzb").addEventListener("click", e => {
        const b = e.target.closest("[data-m]");
        if (!b)
            return;
        jm = b.dataset.m === "now" ? nowJst() : +b.dataset.m;
        render();
    });
    // 読み上げボタン
    el("tzbody").addEventListener("click", e => {
        const b = e.target.closest(".tzsay");
        if (!b || !spk)
            return;
        const lang = b.dataset.v, vs = spk.getVoices();
        if (vs.length && !vs.some(x => x.lang.replace("_", "-").toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))) {
            const o = b.textContent;
            b.textContent = "音声なし";
            setTimeout(() => {
                b.textContent = o;
            }, 1400);
            return;
        }
        spk.cancel();
        const u = new SpeechSynthesisUtterance(b.dataset.t);
        u.lang = lang;
        u.rate = .85;
        spk.speak(u);
    });
    // 地図の国旗を押したときの、国の詳細（国旗・使う言語・訪れた場所・いまの現地時刻・あいさつ）
    // ISO2C＝ISO3→旗ファイル名。PLC＝場所名→国
    const ISO2C = { SWE: "se", FIN: "fi", GBR: "uk", ESP: "es", FRA: "fr", MCO: "mc", ITA: "it", CHE: "ch", DEU: "de", EGY: "eg", KEN: "ke", KOR: "kr", THA: "th", CHN: "cn" };
    const PLC = { "マントン": "FRA", "フルガダ": "EGY", "ストックホルム": "SWE", "ベネチア": "ITA" }; // 国境ぎわで、粗い国境線だと隣の国に入ってしまう場所
    // __countryName＝国コードから日本語の国名を返す
    window.__countryName = iso => {
        const c = C.find(x => x.id === ISO2C[iso]);
        return c ? c.name : "";
    };
    // __countryHTML＝国の詳細パネル（旗・言語・訪れた場所・あいさつ）の HTML
    window.__countryHTML = iso => {
        const c = C.find(x => x.id === ISO2C[iso]);
        if (!c)
            return "";
        const on = c.tr.filter(tripOn), ref = REF[on[0] || c.tr[0]] || REF.eu, ft = FLG.find(f => f.id === iso);
        const places = [];
        TRIPS.filter(t => tripOn(t.key) && c.tr.includes(t.key)).forEach(t => t.stops.forEach(st => {
            const q = P[st.k];
            if (q && ft && (PLC[st.name] ? PLC[st.name] === iso : d3.geoContains(ft, q)) && !places.includes(st.name))
                places.push(st.name);
        }));
        return `<div class="k" style="display:flex;gap:12px;align-items:flex-start"><span class="cfl">${flagSVG(iso)}</span><div><span>${on.map(k => `<span class="tag ${k}">${esc(TRIPNAME[k])}</span>`).join(" ")}</span><h2>${esc(c.name)}</h2><time>${esc(c.lang)}</time></div></div>
      <div class="clive" data-c="${iso}"><div class="cl"><span class="lb">人口</span><span class="v pop">読み込み中…</span></div><div class="cl"><span class="lb">お金（${esc(CUR[iso][1])}）</span><span class="v fx">読み込み中…</span></div><div class="cl"><span class="lb">10,000円でビッグマックは</span><span class="v bm">読み込み中…</span></div></div><p class="m">旅行の評価（国ぜんたいの目安）</p><div class="rlr cr" data-c="${iso}"><span class="v">読み込み中…</span></div>
      ${places.length ? `<p class="m">訪れた場所</p><div class="cpl">${places.map(n => `<span>${esc(n)}</span>`).join("")}</div>` : ""}
      ${card(c, ref, "", 2)}`;
    };
    // 人口（世界銀行）と、いまのニュース1本（GDELT。だめなら Google ニュース）を、開いたときにネットから取る
    // ISO2＝ISO3→ISO2（外部 API 用）
    const ISO2 = { SWE: "SE", FIN: "FI", GBR: "GB", ESP: "ES", FRA: "FR", MCO: "MC", ITA: "IT", CHE: "CH", DEU: "DE", EGY: "EG", KEN: "KE", KOR: "KR", THA: "TH", CHN: "CN" };
    // 通貨：[コード, 名前, 単位の呼び方]
    // CUR＝通貨：[コード, 名前, 紙幣・硬貨の例]
    const CUR = { SWE: ["SEK", "スウェーデン・クローナ", [["20"], ["50"], ["100"], ["200"], ["500"], ["1000"]], ["1kr", "2kr", "5kr", "10kr"]], FIN: ["EUR", "ユーロ", [["5", "#8f979c"], ["10", "#d9534f"], ["20", "#4a84c4"], ["50", "#e8913a"], ["100", "#4fa86a"], ["200", "#c9a43c"], ["500", "#8a5aa8"]], ["1c", "2c", "5c", "10c", "20c", "50c", "1€", "2€"]], GBR: ["GBP", "英ポンド", [["5", "#3fb5b0"], ["10", "#e8913a"], ["20", "#8a5aa8"], ["50", "#d9534f"]], ["1p", "2p", "5p", "10p", "20p", "50p", "£1", "£2"]], ESP: ["EUR", "ユーロ", [["5", "#8f979c"], ["10", "#d9534f"], ["20", "#4a84c4"], ["50", "#e8913a"], ["100", "#4fa86a"], ["200", "#c9a43c"], ["500", "#8a5aa8"]], ["1c", "2c", "5c", "10c", "20c", "50c", "1€", "2€"]], FRA: ["EUR", "ユーロ", [["5", "#8f979c"], ["10", "#d9534f"], ["20", "#4a84c4"], ["50", "#e8913a"], ["100", "#4fa86a"], ["200", "#c9a43c"], ["500", "#8a5aa8"]], ["1c", "2c", "5c", "10c", "20c", "50c", "1€", "2€"]], MCO: ["EUR", "ユーロ", [["5", "#8f979c"], ["10", "#d9534f"], ["20", "#4a84c4"], ["50", "#e8913a"], ["100", "#4fa86a"], ["200", "#c9a43c"], ["500", "#8a5aa8"]], ["1c", "2c", "5c", "10c", "20c", "50c", "1€", "2€"]], ITA: ["EUR", "ユーロ", [["5", "#8f979c"], ["10", "#d9534f"], ["20", "#4a84c4"], ["50", "#e8913a"], ["100", "#4fa86a"], ["200", "#c9a43c"], ["500", "#8a5aa8"]], ["1c", "2c", "5c", "10c", "20c", "50c", "1€", "2€"]], CHE: ["CHF", "スイス・フラン", [["10", "#e8c53a"], ["20", "#d9534f"], ["50", "#4fa86a"], ["100", "#4a84c4"], ["200", "#a0714f"], ["1000", "#8a5aa8"]], ["5Rp", "10Rp", "20Rp", "½Fr", "1Fr", "2Fr", "5Fr"]], DEU: ["EUR", "ユーロ", [["5", "#8f979c"], ["10", "#d9534f"], ["20", "#4a84c4"], ["50", "#e8913a"], ["100", "#4fa86a"], ["200", "#c9a43c"], ["500", "#8a5aa8"]], ["1c", "2c", "5c", "10c", "20c", "50c", "1€", "2€"]], EGY: ["EGP", "エジプト・ポンド", [["5"], ["10"], ["20"], ["50"], ["100"], ["200"]], ["25pt", "50pt", "£1"]], KEN: ["KES", "ケニア・シリング", [["50"], ["100"], ["200"], ["500"], ["1000"]], ["1", "5", "10", "20"]], KOR: ["KRW", "ウォン", [["1000", "#4a84c4"], ["5000", "#c9833c"], ["10000", "#4fa86a"], ["50000", "#e8c53a"]], ["10", "50", "100", "500"]], THA: ["THB", "バーツ", [["20", "#4fa86a"], ["50", "#4a84c4"], ["100", "#d9534f"], ["500", "#8a5aa8"], ["1000", "#a0714f"]], ["1", "2", "5", "10"]], CHN: ["CNY", "人民元", [["1", "#4fa86a"], ["5", "#8a5aa8"], ["10", "#4a84c4"], ["20", "#a0714f"], ["50", "#4fa86a"], ["100", "#d9534f"]], ["1角", "5角", "1元"]] };
    // live＝取得済みのライブ情報のキャッシュ
    const live = new Map();
    // fxP＝為替取得の Promise
    let fxP = null;
    // jf＝JSON を取得する（時間切れつき）
    const jf = (u, ms = 9000) => {
        const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
        return fetch(u, { signal: ac.signal }).then(r => {
            if (!r.ok)
                throw new Error(r.status);
            return r.json();
        }).finally(() => clearTimeout(t));
    };
    // popTxt＝人口を「約○億人」「約○万人」の文字にする
    const popTxt = n => n >= 1e8 ? `約${(n / 1e8).toFixed(2).replace(/\.?0+$/, "")}億人` : n >= 1e4 ? `約${Math.round(n / 1e4).toLocaleString("ja-JP")}万人` : `約${Math.round(n).toLocaleString("ja-JP")}人`;
    // getPop＝人口を世界銀行 API から取得
    const getPop = iso => jf(`https://api.worldbank.org/v2/country/${ISO2[iso]}/indicator/SP.POP.TOTL?format=json&mrnev=1`).then(j => {
        const r = j && j[1] && j[1][0];
        if (!r || r.value == null)
            throw 0;
        return { t: popTxt(r.value), y: r.date };
    });
    // 為替：1円あたりの各通貨の量（全通貨まとめて1回取る）。1つめがだめなら2つめ
    // getFx＝為替を取得（1円あたりの各通貨の量）
    const getFx = () => fxP || (fxP = jf("https://open.er-api.com/v6/latest/JPY").then(j => {
        if (!j || !j.rates)
            throw 0;
        return { r: j.rates, d: (() => {
                const t = new Date(j.time_last_update_utc);
                return isNaN(t) ? "" : (t.getMonth() + 1) + "/" + t.getDate();
            })() };
    })
        .catch(() => jf("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json").then(j => {
        if (!j || !j.jpy)
            throw 0;
        const r = {};
        Object.keys(j.jpy).forEach(k => r[k.toUpperCase()] = j.jpy[k]);
        return { r, d: j.date || "" };
    }))
        .catch(e => {
        fxP = null;
        throw e;
    }));
    // fxTxt＝為替から「○円＝1通貨」の文字を作る
    const fxTxt = (code, x) => {
        const per = x.r[code];
        if (!per)
            throw 0;
        let n = 1, y = 1 / per;
        while (y < 1 && n < 1000) {
            n *= 10;
            y *= 10;
        }
        const m = 10000 * per, mt = m >= 100 ? Math.round(m).toLocaleString("ja-JP") : m.toFixed(m < 10 ? 2 : 1);
        return `${n.toLocaleString("ja-JP")} ${code} ＝ 約${y.toFixed(y < 10 ? 2 : 1)}円<br>10,000円 ＝ 約${mt} ${code}`;
    };
    // ハンバーガーのイラスト（1個＝1つ。端数は切って見せる）
    // BURGER＝ハンバーガーのイラスト
    const BURGER = '<svg viewBox="0 0 26 22" width="22" height="19" aria-hidden="true"><path d="M3 9C3 3.5 8 1.5 13 1.5S23 3.5 23 9Z" fill="#e0a24a"/><circle cx="9" cy="5" r=".8" fill="#fbe7b4"/><circle cx="14" cy="3.6" r=".8" fill="#fbe7b4"/><circle cx="18" cy="6" r=".8" fill="#fbe7b4"/><path d="M2 10.5c2 1.8 3 .2 5 1.6s3 .2 5 1.6 3 .2 5 1.6 3 .2 5-1.2V10Z" fill="#6fb04e"/><rect x="2.5" y="13" width="21" height="3.4" rx="1.7" fill="#7a4a2e"/><path d="M3 17h20v1c0 2-1.5 3-3.5 3h-13C4.5 21 3 20 3 18Z" fill="#e0a24a"/></svg>';
    // burgers＝金額分のハンバーガーを並べる（端数は切る）
    const burgers = (v, mx) => {
        const full = Math.floor(v), fr = v - full, sc = mx > 30 ? 30 / mx : 1;
        let h = "", k = Math.round(full * sc);
        h += BURGER.repeat(Math.max(k, full && 1));
        if (fr >= .1 && sc === 1)
            h += `<span class="bmp" style="width:${Math.round(22 * fr)}px">${BURGER}</span>`;
        return h + (sc < 1 ? `<em>（1つで約${(1 / sc).toFixed(1)}個）</em>` : "");
    };
    // c0name＝ビッグマック指数の国名を引く
    const c0name = iso => {
        const c = C.find(x => x.id === ISO2C[iso]);
        return c ? c.name.replace(/（.*）/, "") : iso;
    };
    // ビッグマックの現地価格（エコノミスト誌の公開データ。国ごとの最新の行）
    let bmP = null;
    // getBM＝ビッグマックの価格データを取得（GitHub 上の公開データ）
    const getBM = () => bmP || (bmP = fetch("https://raw.githubusercontent.com/TheEconomist/big-mac-data/master/output-data/big-mac-full-index.csv").then(r => {
        if (!r.ok)
            throw 0;
        return r.text();
    }).then(t => {
        const m = {};
        t.split(/\r?\n/).slice(1).forEach(l => {
            const f = l.match(/("([^"]*)"|[^,]*)(,|$)/g);
            if (!f || f.length < 5)
                return;
            const c = f.map(x => x.replace(/,$/, "").replace(/^"|"$/g, ""));
            const d = c[0], iso = c[1], cur = c[2], p = parseFloat(c[4]);
            if (!iso || !(p > 0))
                return;
            if (!m[iso] || d > m[iso].d)
                m[iso] = { d, cur, p };
        });
        if (!Object.keys(m).length)
            throw 0;
        return m;
    }).catch(e => {
        bmP = null;
        throw e;
    }));
    // BMISO＝ユーロ圏の国は EUZ のデータを使う
    const BMISO = { FIN: "EUZ", ESP: "EUZ", FRA: "EUZ", ITA: "EUZ", DEU: "EUZ", MCO: "EUZ" };
    // __countryLive＝国パネルに、人口・為替・ビッグマック・ニュースの最新情報を後から足す
    window.__countryLive = iso => {
        if (window.__rlCountry)
            window.__rlCountry(iso).then(h => {
                const bx = document.querySelector(`#panel .rlr.cr[data-c="${iso}"]`);
                if (bx)
                    bx.innerHTML = h || "";
            }, () => {
                const bx = document.querySelector(`#panel .rlr.cr[data-c="${iso}"]`);
                if (bx)
                    bx.innerHTML = "";
            });
        const put = (sel, h) => {
            const box = document.querySelector(`#panel .clive[data-c="${iso}"] ${sel}`);
            if (box)
                box.innerHTML = h;
        };
        const cache = live.get(iso) || {};
        live.set(iso, cache);
        const pr = cache.pop || (cache.pop = getPop(iso));
        pr.then(r => put(".pop", `${esc(r.t)}<small>（${esc(r.y)}年・世界銀行）</small>`), () => {
            cache.pop = null;
            put(".pop", "取得できなかった");
        });
        const cu = CUR[iso];
        Promise.all([getFx(), getBM()]).then(([x, m]) => {
            const b = m[BMISO[iso] || iso], per = x.r[cu[0]];
            if (!b || b.cur !== cu[0] || !per) {
                put(".bm", "この国のデータはない");
                return;
            }
            const n = 10000 * per / b.p, jp = m.JPN && m.JPN.cur === "JPY" ? 10000 / m.JPN.p : 0, mx = Math.max(n, jp, 1);
            const row = (lb, v) => `<span class="bmr"><span class="bml">${lb}</span><span class="bmi">${burgers(v, mx)}</span><b>約${v.toFixed(1)}個</b></span>`;
            put(".bm", (jp ? row("日本", jp) : "") + row(esc(c0name(iso)), n) + `<small>現地価格 約${(b.p >= 100 ? Math.round(b.p).toLocaleString("ja-JP") : b.p.toFixed(2))} ${esc(cu[0])}／個${jp ? `、日本は約${Math.round(m.JPN.p)}円／個` : ""}（${esc(b.d.slice(0, 7))}時点・エコノミスト誌のビッグマック指数${BMISO[iso] ? "。ユーロ圏の平均" : ""}）</small>`);
        }, () => put(".bm", "取得できなかった"));
        getFx().then(x => put(".fx", `${fxTxt(cu[0], x)}<small>${esc(cu[1])}・為替レート${x.d ? "（" + esc(x.d) + "時点）" : ""}</small>`), () => put(".fx", `${esc(cu[1])}（${cu[0]}）<small>レートは取得できなかった</small>`));
    };
    // sayH＝あいさつの読み上げボタンの処理
    const sayH = e => {
        const b = e.target.closest(".tzsay");
        if (!b || !spk)
            return;
        const lang = b.dataset.v, vs = spk.getVoices();
        if (vs.length && !vs.some(x => x.lang.replace("_", "-").toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))) {
            const o = b.textContent;
            b.textContent = "音声なし";
            setTimeout(() => {
                b.textContent = o;
            }, 1400);
            return;
        }
        spk.cancel();
        const u = new SpeechSynthesisUtterance(b.dataset.t);
        u.lang = lang;
        u.rate = .85;
        spk.speak(u);
    };
    // パネル全体でクリックを受ける
    document.getElementById("panel").addEventListener("click", sayH);
    (window.__onTrips = window.__onTrips || []).push(render);
    // 最初の描画
    render();
})();
