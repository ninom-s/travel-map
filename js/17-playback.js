// ======================================================================
// 17. 旅の再生  (17-playback.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// d3 が読み込めなかったときは、ここから先の処理を実行しない（元のコードの「return」と同じ働き）
if (!window.d3) throw new Error("d3 が読み込めていないため、地図の処理を止めた");
// ---- trip playback ----
// PLAYS＝旅の再生の台本。旅ごとに、移動の順番（区間・日付・ひとこと）の配列を作る
const PLAYS = (() => {
    const st = k => EU.stops.find(s => s.k === k) || AF.stops.find(s => s.k === k);
    const S = (k, legs, o = {}) => {
        const s = st(k) || {};
        return { d: o.d || s.d || "", t: o.t || s.name || k, n: o.n !== undefined ? o.n : (s.note || ""), end: o.end || k, legs };
    };
    const PL = ["PL1", "PL2", "PL3", "PL4", "PL5", "PL6"];
    const eu = [
        S("FRA", [["air", ["NRT", ...PL.slice().reverse(), "FRA"]]], { d: "1/2", t: "成田 → フランクフルト", n: "初めての海外へ。14時間15分のフライト" }),
        S("ARN", [["air", ["FRA", "ARN"]]], { d: "1/3" }),
        S("RVN", [["air", ["ARN", "HEL", "RVN"]]]),
        S("AUR", [["van", ["RVN", "AUR"]]], { d: "1/4", t: "オーロラを見た林道", n: "初日の夜、ツアーのバンで林道へ" }),
        S("RNZ", [["van", ["AUR", "RVN"]], ["bus", ["RVN", "RNZ"]]], { d: "1/6", t: "ラヌア動物園", n: "バスで約1時間。ヘラジカの大きさに衝撃" }),
        S("RVN", [["bus", ["RNZ", "RVN"]]], { d: "1/6", t: "ロヴァニエミへ戻る", n: "" }),
        S("LON", [["air", ["RVN", "HEL", "HEA"]]]),
        S("OXF", [["train", ["LON", "HWY", "BIC", "OXF"]], ["train", ["OXF", "BIC", "HWY", "LON"]]], { d: "ロンドン滞在中", t: "オックスフォード", n: "列車で日帰り。帰りも列車でロンドンへ", end: "LON" }),
        S("BOU", [["bus", ["LON", "BIB", "STO", "BOU", "CHC", "LON"]]]),
        S("EDI", [["bus", ["LON", "HEA", "BHM", "MAN", "PRE", "CAR", "EDI"]]]),
        S("FTW", [["bus", ["EDI", "GLA", "LLO", "CRI", "GCO", "FTW"]]]),
        S("GLF", [["train", ["FTW", "COR", "LEH", "GLF"]]], { d: "1/12", t: "グレンフィナン高架橋", n: "フォートウィリアムから列車で" }),
        S("EDI", [["train", ["GLF", "LEH", "COR", "FTW"]], ["bus", ["FTW", "GCO", "CRI", "LLO", "GLA", "EDI"]]], { d: "1/12", t: "エディンバラへ戻る", n: "" }),
        S("BCN", [["air", ["EDI", "BCN"]]]),
        S("MRS", [["bus", ["BCN", "GIR", "FIG", "PER", "NAR", "MPL", "NIM", "ARL", "MRS"]]]),
        S("MCO", [["bus", ["MRS", "AIX", "BRI", "LMU", "CNS", "NAP", "NCE"]], ["train", ["NCE", "VIL", "EZE", "CAP", "MCO"]]]),
        S("MEN", [["train", ["MCO", "ROQ", "MEN"]]]),
        S("NCE", [["train", ["MEN", "ROQ", "MCO", "CAP", "EZE", "VIL", "NCE"]]]),
        S("MIL", [["train", ["NCE", "VIL", "EZE", "CAP", "MCO", "ROQ", "MEN", "VTM"]], ["taxi", ["VTM", "BOR", "SRM"]], ["bus", ["SRM", "IMP", "ALA", "SAV", "ALT", "CEV", "MDV", "FOS", "CMG", "TUR"]], ["bus", ["TUR", "CHV", "VCL", "NOV", "LAM"]], ["bus", ["LAM", "MIL"]]]),
        S("STM", [["bus", ["MIL", "LEC", "VAR"]], ["boat", ["VAR", "BEL", "MEG"]], ["bus", ["MEG", "GRA", "CHI", "MAL", "STM"]]]),
        S("TIR", [["train", ["STM", "PON", "OSP", "AGR", "POS", "BRU", "TIR"]], ["bus", ["TIR", "SON", "COL", "LEC", "MIL"]]], { d: "1/23", t: "ベルニナ鉄道", n: "ティラーノまで列車、バスでミラノへ戻る", end: "MIL" }),
        S("VCE", [["bus", ["MIL", "LAM"]], ["bus", ["LAM", "BGY", "BRE", "VRN", "VIC", "PAD", "MES"]], ["train", ["MES", "VCE"]]]),
        S("BZO", [["bus", ["MES", "PAD", "VIC", "VRN"]], ["bus", ["VRN", "ROV", "TRE", "BZO"]]]),
        S("MUC", [["bus", ["BZO", "BRX", "STZ", "BRN", "INN", "KUF", "ROS", "MUC"]]]),
        S("FUS", [["bus", ["MUC", "SCH", "STG", "HSW"]], ["walk", ["HSW", "FUS"]], ["bus", ["FUS", "STG", "SCH", "MUC"]]], { end: "MUC" }),
        S("NOE", [["train", ["MUC", "AUG", "DON", "NOE"]]]),
        S("ROT", [["train", ["NOE", "DON", "TRL", "ANS", "STE", "ROT"]]]),
        S("NUE", [["train", ["ROT", "STE", "ANS", "HEI", "NUE"]]]),
        S("WUE", [["bus", ["NUE", "SLF", "WUE"]]]),
        S("FRA", [["bus", ["WUE", "MAR", "ASC", "FRA"]]], { d: "2/3" }),
        S("NRT", [["air", ["FRA", ...PL, "NRT"]]], { d: "2/3–2/4", t: "帰国", n: "フランクフルトから成田へ。13時間のフライト" })
    ];
    const af = [
        S("CAI", [["air", ["NRT", "PEK"]], ["air", ["PEK", "CAI"]]], { d: "12/20–12/21", n: "北京で乗り継いでカイロへ。着いた日にハン・ハリーリ市場とコシャリ" }),
        S("GIZ", [["taxi", ["CAI", "GIZ"]]], { n: "タクシーでギザへ。ピラミッドの見えるホテルに3泊" }),
        S("LXR", [["taxi", ["GIZ", "CAI"]], ["air", ["CAI", "LXR"]]]),
        S("DEN", [["van", ["LXR", "EDR", "QEN", "DEN"]], ["van", ["DEN", "QEN", "EDR", "LXR"]]], { d: "ルクソール滞在中", t: "デンデラ神殿", n: "ルクソールからツアーで日帰り", end: "LXR" }),
        S("HRG", [["bus", ["LXR", "QEN", "EDS", "SAF", "HRG"]]]),
        S("PDI", [["boat", ["HRG", "PDI"]], ["boat", ["PDI", "HRG"]]], { d: "12/27", t: "パラダイス島", n: "船で紅海の島へ日帰り。シュノーケル", end: "HRG" }),
        S("CAI", [["air", ["HRG", "CAI"]]], { d: "12/28", t: "カイロへ", n: "フルガダに泊まってから、飛行機でカイロへ" }),
        S("NBO", [["air", ["CAI", "DOH"]], ["air", ["DOH", "NBO"]]], { d: "12/28–12/29", n: "一晩かけて、カイロからドーハ乗り継ぎでナイロビへ" }),
        S("KCP", [["car", ["NBO", "EML", "KIM", "KCP"]]]),
        S("AMB", [["car", ["KCP", "AMB"]], ["car", ["AMB", "KCP"]]], { d: "12/30–1/1", t: "サファリ", n: "キャンプからサファリジープで公園の中へ", end: "KCP" }),
        S("NBO", [["car", ["KCP", "KIM", "EML", "NBO"]]], { d: "1/1", t: "ナイロビへ戻る", n: "" }),
        S("HND", [["air", ["NBO", "BAH"]], ["air", ["BAH", "GZ"]], ["air", ["GZ", "HND"]]], { d: "1/2–1/3", t: "帰国", n: "バーレーンと広州で乗り継いで羽田へ" })
    ];
    return { eu, af };
})();
// MCOL＝移動手段ごとの線の色（CSS 変数を使う）
const MCOL = { air: "var(--air)", train: "var(--train)", bus: "var(--bus)", boat: "var(--boat)", car: "var(--car)", van: "var(--car)", taxi: "var(--taxi)", walk: "var(--walk)" };
// 再生用の SVG の層：gPlayH＝光のふち、gPlay＝進んだ線、gPulse＝いまの位置の脈打つ丸
const gPlayH = svg.insert("g", () => gOver.node()).attr("class", "playh");
const gPlay = svg.insert("g", () => gOver.node()).attr("class", "playl");
const gPulse = svg.append("g").attr("class", "playp");
// 再生パネルの要素（日付・場所・説明・ボタンなど）
const playEl = document.getElementById("play"), pDate = playEl.querySelector(".pdate"), pName = playEl.querySelector(".pname"), pNote = playEl.querySelector(".pnote"), pBar = playEl.querySelector(".pbar i"), pPause = document.getElementById("ppause"), pSpeed = document.getElementById("pspeed"), pStop = document.getElementById("pstop"), playBtn = document.getElementById("playbtn");
// PS＝再生の状態：on 再生中／paused 一時停止／trip 旅／i 何番目か／tok 中断用の合言葉／speed 倍速
const PS = { on: false, paused: false, trip: "eu", i: 0, tok: 0, speed: 1, pulse: null };
// syncPlay＝ズームや回転で地図が動いたとき、再生の線を合わせ直す
function syncPlay() {
    const k = cur.k;
    gPlayH.attr("transform", cur);
    gPlay.attr("transform", cur);
    gPlayH.selectAll("path").attr("stroke-width", function () {
        return (this.classList.contains("air") ? 5 : 8) / k;
    });
    gPlay.selectAll("path").attr("stroke-width", function () {
        return (this.classList.contains("air") ? 2.2 : 4) / k;
    });
    gPlay.selectAll("path.air.done").attr("stroke-dasharray", `${7 / k} ${5 / k}`);
    if (PS.pulse) {
        const [x, y] = cur.apply(proj(P[PS.pulse]));
        gPulse.attr("transform", `translate(${x},${y})`);
    }
}
// 地図が動いたら再生の線も追従させる
zoom.on("zoom.play", syncPlay);
zoom.on("start.play", e => {
    if (e.sourceEvent && PS.on && !PS.paused)
        pausePlay();
});
// 再生の線を描き直す（回転・リサイズ後に呼ばれる）
window.__playRedraw = () => {
    gPlayH.selectAll("path").attr("d", function () {
        return path({ type: "LineString", coordinates: JSON.parse(this.dataset.c).map(k => P[k]) });
    });
    gPlay.selectAll("path").attr("d", function () {
        return path({ type: "LineString", coordinates: JSON.parse(this.dataset.c).map(k => P[k]) });
    });
    syncPlay();
};
// RM＝「動きを減らす」設定か（ON なら演出を控えめにする）
const RM = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
// wait＝倍速を考慮して待つ。途中で停止された（tok が変わった）ら false を返す
const wait = (ms, tok) => new Promise(r => setTimeout(() => r(tok === PS.tok), ms / PS.speed));
// fitLegs＝これから通る区間が収まる位置へ、地図を動かす
function fitLegs(legs) {
    const pts = legs.flatMap(([, ks]) => ks.map(k => proj(P[k])));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = Math.max(1, Math.min(kRef() * 12, 0.6 / Math.max((x1 - x0) / W, (y1 - y0) / (H * 0.78), 1e-3)));
    return d3.zoomIdentity.translate(W / 2, H * 0.56).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
}
// setCap＝再生パネルの説明文・番号を更新する
function setCap(step, i, n) {
    pDate.textContent = step.d;
    pName.textContent = step.t;
    pNote.textContent = step.n;
    pNote.hidden = !step.n;
    pBar.style.width = ((i + 1) / n * 100) + "%";
}
// runStep＝1ステップ再生：視点を動かし、線を伸ばし、乗り物を走らせる。飛行機は線を描いてから降りる
async function runStep(i, tok) {
    const steps = PLAYS[PS.trip], step = steps[i];
    gPlay.selectAll(`[data-s="${i}"]`).remove();
    gPlayH.selectAll(`[data-s="${i}"]`).remove();
    gPlayG.selectAll(`[data-s="${i}"]`).remove();
    setCap(step, i, steps.length);
    PS.pulse = null;
    gPulse.selectAll("*").remove();
    if (typeof hideVeh === "function")
        hideVeh();
    if (step.legs.some(([, ks]) => ks.includes("PL1")))
        return await globeFlight(step, i, tok);
    const t = fitLegs(step.legs);
    if (GL.on) {
        await exitGlobe(null, null, { T: t, mdur: 900 / PS.speed });
        if (tok !== PS.tok)
            return false;
    }
    else if (RM())
        svg.call(zoom.transform, t);
    else {
        try {
            await svg.transition("play").duration(900 / PS.speed).ease(d3.easeCubicInOut).call(zoom.transform, t).end();
        }
        catch (e) {
            return false;
        }
    }
    if (tok !== PS.tok)
        return false;
    for (const [m, ks] of step.legs) {
        const c = JSON.stringify(ks), d = path({ type: "LineString", coordinates: ks.map(k => P[k]) });
        const hl = gPlayH.append("path").attr("data-s", i).attr("data-c", c).attr("d", d).attr("class", "ph-halo " + m);
        const el = gPlay.append("path").attr("data-s", i).attr("data-c", c).attr("d", d).attr("class", "ph-line " + m).style("stroke", MCOL[m] || "var(--eu)");
        syncPlay();
        const L = el.node().getTotalLength();
        const px = L * cur.k;
        const fin = () => {
            hl.attr("stroke-dasharray", null).attr("stroke-dashoffset", null);
            el.attr("stroke-dasharray", null).attr("stroke-dashoffset", null).classed("done", true);
            syncPlay();
            VS.frac = 1;
            drawVeh();
        };
        setVeh("f", el.node(), m, 0, ks);
        if (RM() || L < 0.01) {
            fin();
            continue;
        }
        hl.attr("stroke-dasharray", `${L} ${L}`).attr("stroke-dashoffset", L);
        el.attr("stroke-dasharray", `${L} ${L}`).attr("stroke-dashoffset", L);
        const dur = Math.max(450, Math.min(1600, 350 + px * 1.6)) / PS.speed;
        try {
            await Promise.all([hl.transition("play").duration(dur).ease(d3.easeLinear).attr("stroke-dashoffset", 0).end(), el.transition("play").duration(dur).ease(d3.easeLinear).attr("stroke-dashoffset", 0).tween("veh", () => t => {
                    VS.frac = t;
                    drawVeh();
                }).end()]);
        }
        catch (e) {
            return false;
        }
        if (tok !== PS.tok)
            return false;
        fin();
    }
    PS.pulse = step.end;
    gPulse.selectAll("*").remove();
    gPulse.append("circle").attr("class", "pp1").attr("r", 9);
    gPulse.append("circle").attr("class", "pp2").attr("r", 5);
    syncPlay();
    return await wait(1500, tok);
}
// loop＝最初から最後まで runStep をつなぐ。最後まで来たら終了
async function loop(tok) {
    const steps = PLAYS[PS.trip];
    while (PS.i < steps.length) {
        const ok = await runStep(PS.i, tok);
        if (!ok || tok !== PS.tok)
            return;
        PS.i++;
    }
    if (tok !== PS.tok)
        return;
    PS.paused = true;
    pPause.textContent = "↺";
    pPause.setAttribute("aria-label", "最初から再生");
    playEl.classList.add("done");
    pDate.textContent = PS.trip === "eu" ? "2025.1.2 – 2.4" : "2025.12.20 – 2026.1.3";
    pName.textContent = "おしまい";
    pNote.textContent = "イラストをタップすると、思い出と写真が見られる";
    pNote.hidden = false;
    hideVeh();
    if (GL.on)
        exitGlobe(null, null, { T: jumpT(PS.trip) });
    jump(PS.trip);
}
// startPlay＝再生を始める（地球儀から平面へ戻して頭から）
function startPlay(trip) {
    if (typeof closePanel === "function")
        closePanel();
    PS.trip = trip;
    PS.i = 0;
    PS.on = true;
    PS.paused = false;
    PS.tok++;
    gPlay.selectAll("*").remove();
    gPlayH.selectAll("*").remove();
    gPulse.selectAll("*").remove();
    gPlayG.selectAll("*").remove();
    if (typeof hideVeh === "function")
        hideVeh();
    stage.classList.add("playing");
    playEl.hidden = false;
    playEl.classList.toggle("af", trip === "af");
    gPulse.classed("af", trip === "af");
    playEl.classList.remove("done");
    pPause.textContent = "❚❚";
    pPause.setAttribute("aria-label", "一時停止");
    if (MOBILE.matches && !document.body.classList.contains("isfull")) {
        const r = stage.getBoundingClientRect();
        if (r.top < 0 || r.bottom > innerHeight)
            stage.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    loop(PS.tok);
}
// pausePlay＝一時停止
function pausePlay() {
    if (!PS.on || PS.paused)
        return;
    PS.paused = true;
    PS.tok++;
    svg.interrupt("play");
    gsv.interrupt("grot");
    gPlayG.selectAll("path").interrupt("play");
    gPlay.selectAll("path").interrupt("play");
    gPlayH.selectAll("path").interrupt("play");
    pPause.textContent = "▶";
    pPause.setAttribute("aria-label", "再開");
    playEl.classList.add("paused");
}
// resumePlay＝一時停止からの再開
function resumePlay() {
    if (!PS.on)
        return;
    if (playEl.classList.contains("done")) {
        startPlay(PS.trip);
        return;
    }
    PS.paused = false;
    PS.tok++;
    pPause.textContent = "❚❚";
    pPause.setAttribute("aria-label", "一時停止");
    playEl.classList.remove("paused");
    loop(PS.tok);
}
// stopPlay＝再生を止めて、見た目を元に戻す
function stopPlay() {
    PS.on = false;
    PS.paused = false;
    PS.tok++;
    svg.interrupt("play");
    gPlay.selectAll("path").interrupt("play");
    gPlayH.selectAll("path").interrupt("play");
    gPlay.selectAll("*").remove();
    gPlayH.selectAll("*").remove();
    gPulse.selectAll("*").remove();
    gPlayG.selectAll("*").remove();
    PS.pulse = null;
    if (typeof hideVeh === "function")
        hideVeh();
    if (RIDE)
        RIDE.cancel = true;
    stage.classList.remove("playing");
    playEl.hidden = true;
    playEl.classList.remove("done", "paused");
}
// ボタン類：一時停止／再開、速度切り替え、停止
pPause.addEventListener("click", () => PS.paused ? resumePlay() : pausePlay());
pSpeed.addEventListener("click", () => {
    PS.speed = PS.speed === 1 ? 2 : 1;
    pSpeed.textContent = PS.speed + "×";
    pSpeed.setAttribute("aria-label", `速さ ${PS.speed}倍`);
});
pStop.addEventListener("click", stopPlay);
// curTrip＝いま再生できる旅（選んでいる旅が1つならそれ）
const curTrip = () => {
    const b = document.querySelector('.seg .chip[aria-pressed="true"]');
    const t = b && b.dataset.trip;
    return t === "af" ? "af" : "eu";
};
// 再生メニュー（旅を選んで再生）の開閉処理
const playMenu = document.getElementById("playmenu");
const selTrip = () => {
    const b = document.querySelector('.seg .chip[aria-pressed="true"]');
    return (b && b.dataset.trip) || "all";
};
const setMenu = on => {
    playMenu.hidden = !on;
    playBtn.setAttribute("aria-expanded", on ? "true" : "false");
};
// playLabel＝再生ボタンの文字を、選んでいる旅に合わせて変える
const playLabel = () => {
    const t = selTrip();
    playBtn.hidden = t === "hi" || t === "ko" || t === "ld" || t === "th" || t === "cn" || (t === "all" && !SHOW.eu && !SHOW.af);
    playBtn.innerHTML = t === "all" ? `<span aria-hidden="true">▶</span> 再生` : `<span aria-hidden="true">▶</span> ${t === "af" ? "アフリカ旅" : "ヨーロッパ旅"}を再生`;
    if (t === "all")
        playBtn.setAttribute("aria-controls", "playmenu");
    else {
        playBtn.removeAttribute("aria-controls");
        playBtn.removeAttribute("aria-expanded");
    }
};
playLabel();
// 旅のタブを押したら、再生ボタンの表示を更新
document.querySelectorAll(".seg .chip").forEach(b => b.addEventListener("click", () => {
    if (PS.on)
        stopPlay();
    setMenu(false);
    playLabel();
}));
// 再生ボタン（1つなら即再生、複数ならメニュー）
playBtn.addEventListener("click", () => {
    const t = selTrip();
    if (t === "all") {
        setMenu(playMenu.hidden);
        return;
    }
    startPlay(t);
});
// メニューから旅を選んだとき
playMenu.querySelectorAll("[data-play]").forEach(b => b.addEventListener("click", () => {
    setMenu(false);
    startPlay(b.dataset.play);
}));
// キーボード操作（スペース＝一時停止／再開、Esc＝停止）
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && PS.on && !stage.classList.contains("full"))
        stopPlay();
});
