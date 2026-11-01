// ======================================================================
// 09. 地図の土台づくり  (09-map-setup.js)
// 地図の処理は js/01〜36 に分かれていて、番号順に読み込まれる。
// 上から下へ1本につながっており、前のファイルで作った const / function を後ろのファイルが使う。
// ======================================================================
// 陸地の形：同梱の Datamap の世界地図を topojson で地物（GeoJSON）に変える。失敗したら null（陸地なしで続行）
let world = null;
try {
    if (window.topojson && window.Datamap && Datamap.prototype.worldTopo) {
        const t = Datamap.prototype.worldTopo;
        const key = t.objects.world ? "world" : Object.keys(t.objects)[0];
        world = topojson.feature(t, t.objects[key]).features;
    }
}
catch (e) {
    world = null;
}
// 経路（地点コードの並び）の上で、全体の長さの f 倍（0〜1）進んだ位置の [経度, 緯度] を返す
function alongRoute(keys, f) {
    const pts = keys.map(k => P[k]);
    const L = [];
    let tot = 0;
    for (let i = 1; i < pts.length; i++) {
        const l = d3.geoDistance(pts[i - 1], pts[i]);
        L.push(l);
        tot += l;
    }
    let t = f * tot;
    for (let i = 0; i < L.length; i++) {
        if (t <= L[i] || i === L.length - 1)
            return d3.geoInterpolate(pts[i], pts[i + 1])(L[i] ? Math.min(1, t / L[i]) : 0);
        t -= L[i];
    }
}
// タッチ操作の端末か（点を押せる範囲を広げる）。HIT＝押せる半径
const COARSE = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
const HIT = COARSE ? 16 : 9;
// 画面の主な要素：stage＝地図の枠、panel＝解説パネル、lodtag＝左上の説明札
const stage = document.getElementById("stage"), panel = document.getElementById("panel"), lodtag = document.getElementById("lodtag");
// d3 が読み込めなかったときは、案内文を出して処理を止める
if (!window.d3) {
    stage.insertAdjacentHTML("afterbegin", '<p style="padding:16px">地図を読み込めなかった。ページを開き直してみて。</p>');
    // ここで止める（以降のファイルも先頭の確認で止まる）
    throw new Error("d3 が読み込めていないため、地図の処理を止めた");
}
// W/H＝地図の枠の大きさ（ピクセル）
let W = stage.clientWidth, H = stage.clientHeight;
// 全旅の寄港地と主な空港。最初の地図は、この全部が収まる範囲に合わせる
const allKeys = [...EU.stops.map(s => s.k), ...AF.stops.map(s => s.k), ...HI.stops.map(s => s.k), ...KO.stops.map(s => s.k), ...LD.stops.map(s => s.k), ...TH.stops.map(s => s.k), ...CN.stops.map(s => s.k), "NRT", "HND", "PEK", "GZ", "DMK"];
// 地図の図法（ナチュラルアース図法、東へ60度回転）。path＝地物をSVGのパスに変える関数
const proj = d3.geoNaturalEarth1().rotate([-60, 0]);
const path = d3.geoPath(proj);
// 全地点が収まるように図法の拡大・位置を合わせる（回転角はそのまま）
function fitBase() {
    const an = proj.angle();
    proj.angle(0).fitExtent([[24, 24], [W - 24, H - 24]], { type: "MultiPoint", coordinates: allKeys.map(k => P[k]) });
    proj.angle(an);
}
fitBase();
// 地図のSVGを作る。gMap＝陸地など、gOver＝点・線・イラスト・名前
const svg = d3.select(stage).insert("svg", ":first-child").attr("role", "img").attr("aria-label", "2つの旅のズームできる地図");
const gMap = svg.append("g");
const gOver = svg.append("g");
// いまのズーム状態（d3.zoomIdentity＝拡大も移動もなし）
let cur = d3.zoomIdentity;
