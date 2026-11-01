// ======================================================================
// 35. 旅の数字  (35-stats.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- 旅の数字（選んでいる旅の合計。距離は地図の線の長さから計算した概算） ----
(() => {
    // EARTH＝地球の半径(km)、LAP＝地球一周(km)
    const EARTH = 6371, LAP = 40075;
    // 国の数は、ヨーロッパ・エジプト・ケニアは visited、それ以外はここで決める（地図の色塗りには使わない）
    const CTRY = { hi: ["USA"], ko: ["KOR"], ld: ["GBR"], th: ["THA"], cn: ["CHN"] };
    // 線は1本でも、実際は往復したもの
    const ROUND = new Set(["FRA>NRT", "NBO>KCP", "BKK>CNX", "BJG>TSN"]), NRT2 = new Set(["hi", "ko", "ld", "cn"]);
    // 日帰りの線のうち、行きと帰りで別の線になっている（ぐるっと回る）ので1回分で数えるもの
    const ONEWAY = new Set(["MIL>VAR", "VAR>MEG", "MEG>STM", "STM>TIR", "TIR>MIL", "MUC>HSW", "HSW>FUS", "FUS>STG"]);
    // MODES＝手段ごとの表示（名前・色・単位）
    const MODES = [["air", "飛行機", "var(--air)", "便"], ["train", "列車", "var(--train)", "回"], ["bus", "バス", "var(--bus)", "回"], ["taxi", "タクシー", "var(--taxi)", "回"],
        ["car", "サファリジープ・ツアーのバン", "var(--car)", "回"], ["boat", "船", "var(--boat)", "回"], ["walk", "徒歩", "var(--walk)", "回"]];
    // lenKm＝地点コードの並びを通る線の長さ(km)
    const lenKm = ids => {
        let d = 0;
        for (let i = 1; i < ids.length; i++) {
            const a = P[ids[i - 1]], b = P[ids[i]];
            if (!a || !b)
                return 0;
            d += d3.geoDistance(a, b) * EARTH;
        }
        return d;
    };
    // mult＝その線を何本分として数えるか。往復なら2、片道なら1、運休して乗れなかった予定は0
    const mult = (t, s) => {
        const m = s[0], kind = s[1], ids = s[2], a = ids[0], z = ids[ids.length - 1], key = a + ">" + z;
        if (m === "plan")
            return 0; // 運休して乗れなかった予定のルート
        if (ROUND.has(key))
            return 2;
        if (m === "air" && a === "NRT" && NRT2.has(t.key))
            return 2; // 帰りの線は描いていない
        if (kind === "trip")
            return (a === z || ONEWAY.has(key)) ? 1 : 2; // 日帰りは往復
        return 1;
    };
    // legs＝区間の数（北極まわりの目印は数えない）
    const legs = ids => ids.filter(k => !/^PL\d$/.test(k)).length - 1; // 北極まわりの目印は便に数えない
    // calc＝1つの旅の合計（距離・手段別の回数・国数・日数）を計算する
    const calc = t => {
        const by = {};
        let km = 0;
        t.seg.forEach(s => {
            const k = mult(t, s);
            if (!k)
                return;
            const mk = s[0] === "van" ? "car" : s[0], d = lenKm(s[2]) * k, n = (s[0] === "air" ? legs(s[2]) : 1) * k;
            (by[mk] = by[mk] || { km: 0, n: 0 }).km += d;
            by[mk].n += n;
            km += d;
        });
        return { km, by };
    };
    // r10/r100/fmt＝丸めと桁区切り
    const r10 = x => Math.round(x / 10) * 10, r100 = x => Math.round(x / 100) * 100, fmt = x => x.toLocaleString("ja-JP");
    // tile＝数字タイル1枚の HTML
    const tile = (lab, val, unit, sub, wide) => `<div class="stile${wide ? " wide" : ""}"><small>${lab}</small><b>${val}${unit ? `<i>${unit}</i>` : ""}</b>${sub ? `<em>${sub}</em>` : ""}</div>`;
    // sumStat＝選んだ旅の合計を数字タイルにする。i はタイルの順番
    const sumStat = (ts, i) => {
        let s = 0;
        for (const t of ts) {
            if (!t.stats)
                return null;
            const v = parseFloat(String(t.stats[i][0]).replace(/[^0-9.]/g, ""));
            if (!isFinite(v))
                return null;
            s += v;
        }
        return s;
    };
    // refresh＝選んでいる旅に合わせて、数字を計算し直して描く
    const refresh = () => {
        const ts = TRIPS.filter(t => tripOn(t.key)), el = id => document.getElementById(id);
        if (!ts.length)
            return;
        const cs = new Set();
        ts.forEach(t => (t.visited && t.visited.size ? [...t.visited] : (CTRY[t.key] || [])).forEach(c => cs.add(c)));
        const per = ts.map(t => ({ t, r: calc(t) })), tot = {};
        let km = 0;
        per.forEach(({ r }) => {
            km += r.km;
            Object.keys(r.by).forEach(m => {
                const o = tot[m] = tot[m] || { km: 0, n: 0 };
                o.km += r.by[m].km;
                o.n += r.by[m].n;
            });
        });
        const places = ts.reduce((a, t) => a + t.stops.length, 0), days = sumStat(ts, 2), hours = sumStat(ts, 4), flights = (tot.air || { n: 0 }).n;
        const plan = ts.every(t => t.key === "th"), hasPlan = ts.some(t => t.key === "th");
        let h = tile(plan ? "行く国" : "訪れた国", cs.size, "か国") + tile(plan ? "行く場所" : "訪れた場所", places, "か所");
        if (days !== null)
            h += tile("日数", days, "日");
        if (flights)
            h += tile("飛行機", flights, "便", hours !== null ? `機内に約${fmt(hours)}時間` : "");
        h += tile(plan ? "移動する距離" : "移動した距離", "約" + fmt(r100(km)), "km", km ? `地球${(km / LAP).toFixed(1)}周ぶん` : "", true);
        el("stiles").innerHTML = h;
        const ms = MODES.filter(m => tot[m[0]] && tot[m[0]].km > 0);
        el("sbar").innerHTML = ms.map(m => `<i style="width:${(tot[m[0]].km / km * 100).toFixed(2)}%;background:${m[2]}"></i>`).join("");
        el("smodes").innerHTML = ms.map(m => {
            const o = tot[m[0]];
            return `<li><span class="sw" style="background:${m[2]}"></span><span class="nm">${m[1]}</span><span class="km">約${fmt(m[0] === "air" ? r100(o.km) : o.km < 10 ? Math.max(1, Math.round(o.km)) : r10(o.km))} km</span><span class="n">${o.n}${m[3]}</span></li>`;
        }).join("");
        const tt = el("stttrips");
        if (ts.length > 1) {
            tt.hidden = false;
            tt.textContent = per.map(({ t, r }) => `${TRIPNAME[t.key]} 約${fmt(r100(r.km))} km`).join("　／　");
        }
        else {
            tt.hidden = true;
            tt.textContent = "";
        }
        el("statsub").textContent = ts.length > 1 ? "いま地図に出している旅の合計" : (ts[0].key === "th" ? "タイ（予定の旅。計画の線から計算）" : TRIPNAME[ts[0].key]);
        el("snote").textContent = "" + (hasPlan && !plan ? "タイは予定の旅で、計画の線から計算している。" : "");
    };
    // 外から呼べるように公開（旅の切り替え時に更新）
    window.__statsRefresh = refresh;
    (window.__onTrips = window.__onTrips || []).push(refresh);
    refresh();
})();
