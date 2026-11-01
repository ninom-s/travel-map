/*
 * topojson-mini.js
 * TopoJSON（弧を共有して小さくした地図データ）を、d3 が描ける GeoJSON に戻す最小の関数 topojson.feature だけを入れたもの。
 * topojson-client（ISC ライセンス）の一部を、オフラインで動くように写した。
 * 使う場所：js/09-map-setup.js（陸地の形を作る）
 */
(function(){
// feature(topology, o)：TopoJSON のオブジェクト o を GeoJSON の Feature / FeatureCollection にする
function feature(topology,o){
  var tf=topology.transform,arcsCache=[];
  // arc(i)：弧番号 i の座標列を返す。負の番号（~j）は逆向きに使う。座標は差分で入っているので足し合わせ、transform で経緯度に直す。計算結果はキャッシュ
  function arc(i){
    var j=i<0?~i:i;
    if(!arcsCache[j]){
      var a=topology.arcs[j],x=0,y=0,out=[];
      for(var k=0;k<a.length;k++){
        var p=a[k];
        if(tf){x+=p[0];y+=p[1];out.push([x*tf.scale[0]+tf.translate[0],y*tf.scale[1]+tf.translate[1]]);}
        else out.push([p[0],p[1]]);
      }
      arcsCache[j]=out;
    }
    var r=arcsCache[j];return i<0?r.slice().reverse():r;
  }
  // line(arcs)：弧番号の並びをつないで、1本の折れ線にする（つなぎ目の重複点は除く）
  function line(arcs){var pts=[];for(var i=0;i<arcs.length;i++){var a=arc(arcs[i]);pts=pts.concat(i?a.slice(1):a);}return pts;}
  // ring(arcs)：多角形の輪。閉じた輪は4点以上必要なので、足りなければ先頭の点を足す
  function ring(arcs){var r=line(arcs);while(r.length<4)r.push(r[0]);return r;}
  // point(p)：点の座標を経緯度に直す
  function point(p){return tf?[p[0]*tf.scale[0]+tf.translate[0],p[1]*tf.scale[1]+tf.translate[1]]:p;}
  // geom(g)：図形の種類（Polygon・LineString・Point など）に応じて座標を組み立てる
  function geom(g){
    var t=g.type,c;
    if(t==="Polygon")c=g.arcs.map(ring);
    else if(t==="MultiPolygon")c=g.arcs.map(function(p){return p.map(ring);});
    else if(t==="LineString")c=line(g.arcs);
    else if(t==="MultiLineString")c=g.arcs.map(line);
    else if(t==="Point")c=point(g.coordinates);
    else if(t==="MultiPoint")c=g.coordinates.map(point);
    else return null;
    return {type:t,coordinates:c};
  }
  // feat(g)：図形1つを Feature（id・properties・geometry）にする
  function feat(g){return {type:"Feature",id:g.id,properties:g.properties||{},geometry:geom(g)};}
  // GeometryCollection なら全部を FeatureCollection に、それ以外は1つの Feature にして返す
  return o.type==="GeometryCollection"?{type:"FeatureCollection",features:o.geometries.map(feat)}:feat(o);
}
// 他のファイルから topojson.feature として呼べるように公開する
window.topojson=window.topojson||{feature:feature};
})();
