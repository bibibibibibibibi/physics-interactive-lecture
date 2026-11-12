/* ============================================================
 * scenes/pvt-surface.js — P-V-T 曲面 3D 场景（第 13 章）
 * 1 mol 理想气体 pV = νRT 的三维曲面：
 * 真实物理刻度（V/L、T/K、P/atm）、温度着色、三条高亮等温线。
 * 拖拽旋转；Three.js 未加载或 WebGL 不可用时调用 onFail() 降级。
 * ============================================================ */
window.Scenes3D = window.Scenes3D || {};
window.Scenes3D['pvt-surface'] = function (host, params, onFail) {
  'use strict';
  if (!window.THREE) { onFail && onFail(); return; }

  var W = host.clientWidth || 600, H = 380;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (e) { onFail && onFail(); return; }
  renderer.setSize(W, H);
  renderer.setClearColor(0x0B1424);
  host.style.position = 'relative';
  host.appendChild(renderer.domElement);

  /* ---------- 物理量 → 场景坐标的映射（1 mol 理想气体） ----------
   * V ∈ [0.5, 4] L    → x ∈ [-2, 2]（小体积端拉开，突出 P∝1/V 的陡降）
   * T ∈ [200, 600] K  → z ∈ [-1.3, 1.3]
   * P = 0.08206·T/V atm，P ∈ [4.1, 98.5] atm → y = P/100 × 2.4 */
  var R_LATM = 0.08206; /* L·atm/(mol·K) */
  function px(V) { return (V - 2.25) / 1.75 * 2; }
  function pz(T) { return (T - 400) / 200 * 1.3; }
  function py(P) { return P / 100 * 2.4; }
  function Patm(V, T) { return R_LATM * T / V; }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
  camera.position.set(4.6, 3.4, 4.6);
  camera.lookAt(0, 0.6, 0);
  var group = new THREE.Group();
  scene.add(group);

  /* ---------- 曲面：实体（温度着色）+ 网格线 ---------- */
  var SEG = 48;
  var verts = [], cols = [];
  var cLow = new THREE.Color(0x2563EB), cHigh = new THREE.Color(0xEF4444);
  for (var i = 0; i < SEG; i++) {
    for (var j = 0; j < SEG; j++) {
      var V0 = 0.5 + 3.5 * i / SEG, V1 = 0.5 + 3.5 * (i + 1) / SEG;
      var T0 = 200 + 400 * j / SEG, T1 = 200 + 400 * (j + 1) / SEG;
      var quad = [
        [V0, T0], [V1, T0], [V1, T1],
        [V0, T0], [V1, T1], [V0, T1]
      ];
      quad.forEach(function (vt) {
        verts.push(px(vt[0]), py(Patm(vt[0], vt[1])), pz(vt[1]));
        var c = cLow.clone().lerp(cHigh, (vt[1] - 200) / 400);
        cols.push(c.r, c.g, c.b);
      });
    }
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.55, side: THREE.DoubleSide
  })));
  group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: 0x93C5FD, wireframe: true, transparent: true, opacity: 0.18
  })));

  /* ---------- 高亮等温线：300 / 400 / 500 K（曲面上的双曲线） ---------- */
  var ISO_COLOR = { 300: 0xFDE047, 400: 0xFFFFFF, 500: 0xFB923C };
  [300, 400, 500].forEach(function (Tk) {
    var pts = [];
    for (var k = 0; k <= 60; k++) {
      var V = 0.5 + 3.5 * k / 60;
      pts.push(new THREE.Vector3(px(V), py(Patm(V, Tk)), pz(Tk)));
    }
    var lg = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: ISO_COLOR[Tk] })));
    var lab = makeLabel(Tk + ' K', 0.8);
    lab.position.set(px(4) + 0.42, py(Patm(4, Tk)) + 0.08, pz(Tk));
    group.add(lab);
  });

  /* ---------- 文字标签（Canvas 贴图 Sprite，始终面向相机） ---------- */
  function makeLabel(text, scale) {
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 144;              /* 高分辨率贴图保证放大后清晰 */
    var c = cv.getContext('2d');
    if (!c) return new THREE.Object3D();
    c.font = 'bold 64px sans-serif';
    c.fillStyle = '#F1F5F9';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 256, 72);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false
    }));
    sp.scale.set(1.7 * (scale || 1), 0.48 * (scale || 1), 1);
    return sp;
  }

  /* ---------- 坐标轴：轴线 + 刻度线 + 真实数值 ---------- */
  var axesMat = new THREE.LineBasicMaterial({ color: 0x8B95A7 });
  var O = [-2, 0, -1.3]; /* 原点角 */
  function line(a, b, mat) {
    var g2 = new THREE.BufferGeometry().setFromPoints(
      [new THREE.Vector3(a[0], a[1], a[2]), new THREE.Vector3(b[0], b[1], b[2])]);
    group.add(new THREE.Line(g2, mat || axesMat));
  }
  line(O, [2.35, 0, -1.3]);            /* V 轴 */
  line(O, [-2, 0, 1.7]);               /* T 轴 */
  line(O, [-2, 2.62, -1.3]);           /* P 轴 */

  [0.5, 1, 2, 3, 4].forEach(function (V) {  /* V 刻度（L） */
    line([px(V), 0, -1.3], [px(V), -0.06, -1.3]);
    var t = makeLabel(String(V), 0.62);
    t.position.set(px(V), -0.28, -1.3); group.add(t);
  });
  [200, 300, 400, 500, 600].forEach(function (T) {  /* T 刻度（K） */
    line([-2, 0, pz(T)], [-2.06, 0, pz(T)]);
    var t = makeLabel(String(T), 0.62);
    t.position.set(-2.52, -0.02, pz(T)); group.add(t);
  });
  [20, 40, 60, 80].forEach(function (P) {  /* P 刻度（atm） */
    line([-2, py(P), -1.3], [-2.06, py(P), -1.3]);
    var t = makeLabel(String(P), 0.62);
    t.position.set(-2.48, py(P), -1.3); group.add(t);
  });
  var labV = makeLabel('V / L', 0.9); labV.position.set(2.85, -0.1, -1.3); group.add(labV);
  var labT = makeLabel('T / K', 0.9); labT.position.set(-2, -0.1, 2.15); group.add(labT);
  var labP = makeLabel('P / atm', 0.9); labP.position.set(-2, 3.02, -1.3); group.add(labP);

  /* ---------- 图例（画布下方的说明条，不覆盖场景） ---------- */
  var legend = document.createElement('div');
  legend.style.cssText = 'font-size:13.5px;color:#E2E8F0;' +
    'background:#0B1424;border:1px solid #263349;border-radius:0 0 8px 8px;padding:8px 12px;' +
    'line-height:1.8;margin-top:-4px';
  legend.innerHTML = '1 mol 理想气体　P = 0.08206·T/V（atm）　|　' +
    '曲面颜色 = 温度　<span style="color:#60A5FA">■</span> 200 K → ' +
    '<span style="color:#F87171">■</span> 600 K　|　' +
    '亮线 = 300 / 400 / 500 K 等温线（各为一条双曲线 PV = 常量）';
  host.appendChild(legend);

  /* ---------- 拖拽旋转 + 自动缓转 ---------- */
  var rotY = 0.65, rotX = 0.22, dragging = false, px0 = 0, py0 = 0, auto = true;
  renderer.domElement.addEventListener('pointerdown', function (e) {
    dragging = true; auto = false; px0 = e.clientX; py0 = e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    rotY += (e.clientX - px0) * 0.008;
    rotX = Math.max(-0.2, Math.min(1.1, rotX + (e.clientY - py0) * 0.005));
    px0 = e.clientX; py0 = e.clientY;
  });
  renderer.domElement.addEventListener('pointerup', function () { dragging = false; });

  (function tick() {
    if (auto) rotY += 0.003;
    group.rotation.y = rotY;
    group.rotation.x = rotX;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  })();
};
