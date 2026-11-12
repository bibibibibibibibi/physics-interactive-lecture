/* ============================================================
 * sims/projectile.js — 抛体运动模拟器（第 1 章核心仿真）
 * 交互：拖拽初速度箭头（或 v₀ / α 滑块），实时画轨迹；
 *       发射动画逐点推进，顶点显示射高、落点显示射程与飞行时间；
 *       可叠加多条轨迹对比；45° 参考轨迹常驻（同 v₀ 虚线）。
 * 模型：x = v₀cosα·t，y = v₀sinα·t − ½gt²（g = 9.8 m/s²）
 * 规范（5.3）：坐标刻度固定（x ∈ [0,260] m，y ∈ [0,135] m），
 *       只动物理量；参数变化映射为图形可见变化；标注随进度浮现。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['projectile'] = (function () {
  'use strict';

  var G = 9.8;
  var XMAX = 260, YMAX = 135;          /* 固定坐标窗（m） */
  var W = 640, H = 400;
  var padL = 52, padR = 14, padT = 18, padB = 40;

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { v0: 40, angle: 45 };
    var ghosts = [];                     /* 叠加对比轨迹 [{v0, angle, color}] */
    var anim = null;                     /* 发射动画句柄 */
    var flying = null;                   /* 飞行中的瞬时状态 {t} */
    var GHOST_COLORS = ['#94A3B8', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

    panel.innerHTML =
      '<label>初速度 v₀ = <span id="pj-v0-val">40</span> m/s</label>' +
      '<input type="range" id="pj-v0" min="10" max="50" step="1" value="40">' +
      '<label>抛射角 α = <span id="pj-angle-val">45</span>°</label>' +
      '<input type="range" id="pj-angle" min="15" max="90" step="1" value="45">' +
      '<div class="sim-btnrow">' +
      '<button type="button" id="pj-launch">▶ 发射</button>' +
      '<button type="button" id="pj-ghost">＋ 叠加本轨迹</button>' +
      '<button type="button" id="pj-clear">清除叠加</button>' +
      '</div>' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>射程 d₀ = v₀²sin2α/g</span><span class="val" id="pj-range">—</span></div>' +
      '<div class="row"><span>射高 H = v₀²sin²α/2g</span><span class="val" id="pj-h">—</span></div>' +
      '<div class="row"><span>飞行时间 T = 2v₀sinα/g</span><span class="val" id="pj-t">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：也可直接拖拽画布上的蓝色箭头改变 v₀ 与 α；' +
      '同 v₀ 下 45°（虚线）射程最大，可叠加 30°/60° 等角度对比验证</label>';

    function X(x) { return padL + (W - padL - padR) * x / XMAX; }
    function Y(y) { return H - padB - (H - padB - padT) * y / YMAX; }

    function traj(v0, deg) {
      var a = deg * Math.PI / 180, pts = [];
      var T = 2 * v0 * Math.sin(a) / G;
      for (var i = 0; i <= 60; i++) {
        var t = T * i / 60;
        pts.push([v0 * Math.cos(a) * t, v0 * Math.sin(a) * t - 0.5 * G * t * t]);
      }
      return pts;
    }

    function drawAxes() {
      g.strokeStyle = '#E2E8F0'; g.fillStyle = '#64748B';
      g.lineWidth = 1; g.font = '11px sans-serif'; g.textAlign = 'center';
      for (var x = 0; x <= XMAX; x += 50) {
        g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), Y(YMAX)); g.stroke();
        g.fillText(x + '', X(x), H - padB + 16);
      }
      g.textAlign = 'right';
      for (var y = 0; y <= YMAX; y += 25) {
        g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(XMAX), Y(y)); g.stroke();
        g.fillText(y + '', padL - 8, Y(y) + 4);
      }
      g.fillStyle = '#475569'; g.textAlign = 'left';
      g.fillText('x / m', X(XMAX) - 34, H - padB + 30);
      g.save(); g.translate(14, Y(YMAX) + 30); g.rotate(-Math.PI / 2);
      g.textAlign = 'left'; g.fillText('y / m', 0, 0); g.restore();
      g.strokeStyle = '#334155'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(XMAX), Y(0)); g.stroke();
      g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(YMAX)); g.stroke();
    }

    function drawTraj(pts, color, dash) {
      g.strokeStyle = color; g.lineWidth = 2; g.setLineDash(dash || []);
      g.beginPath();
      pts.forEach(function (p, i) { i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])); });
      g.stroke(); g.setLineDash([]);
    }

    function drawArrow() {
      /* 初速度箭头：长度 ∝ v₀（50 m/s → 78px），方向 = α */
      var a = state.angle * Math.PI / 180, len = 78 * state.v0 / 50;
      var x0 = X(0), y0 = Y(0);
      var x1 = x0 + len * Math.cos(a), y1 = y0 - len * Math.sin(a);
      g.strokeStyle = '#2563EB'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      var ah = 9;
      g.fillStyle = '#2563EB';
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x1 - ah * Math.cos(a - 0.42), y1 + ah * Math.sin(a - 0.42));
      g.lineTo(x1 - ah * Math.cos(a + 0.42), y1 + ah * Math.sin(a + 0.42));
      g.closePath(); g.fill();
      g.font = '12px sans-serif'; g.textAlign = 'left';
      g.fillText('v₀', x1 + 8, y1 - 4);
      /* 抛射角弧线 */
      g.strokeStyle = '#64748B'; g.lineWidth = 1.2;
      g.beginPath(); g.arc(x0, y0, 30, -a, 0); g.stroke();
      g.fillStyle = '#64748B';
      g.fillText('α', x0 + 36 * Math.cos(a / 2) + 4, y0 - 36 * Math.sin(a / 2) + 4);
    }

    function drawFlight() {
      if (!flying) return;
      var a = state.angle * Math.PI / 180, t = flying.t;
      var x = state.v0 * Math.cos(a) * t, y = state.v0 * Math.sin(a) * t - 0.5 * G * t * t;
      if (y < 0) y = 0;
      /* 已飞过轨迹加粗 */
      var pts = [], T = 2 * state.v0 * Math.sin(a) / G;
      for (var i = 0; i <= 40; i++) {
        var ti = Math.min(t, T) * i / 40;
        pts.push([state.v0 * Math.cos(a) * ti, state.v0 * Math.sin(a) * ti - 0.5 * G * ti * ti]);
      }
      drawTraj(pts, '#DC2626', []);
      /* 抛体 */
      g.fillStyle = '#DC2626';
      g.beginPath(); g.arc(X(x), Y(y), 5, 0, 2 * Math.PI); g.fill();
      /* 标注随进度浮现：过顶点→射高；落地→射程与时间 */
      var Hm = state.v0 * state.v0 * Math.sin(a) * Math.sin(a) / (2 * G);
      var tApex = state.v0 * Math.sin(a) / G;
      g.font = '12px sans-serif'; g.textAlign = 'left';
      if (t >= tApex) {
        var xA = state.v0 * Math.cos(a) * tApex;
        g.strokeStyle = '#DC2626'; g.setLineDash([4, 4]);
        g.beginPath(); g.moveTo(X(xA), Y(0)); g.lineTo(X(xA), Y(Hm)); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#DC2626';
        g.fillText('H = ' + Hm.toFixed(1) + ' m', X(xA) + 6, Y(Hm) + 14);
      }
      if (t >= T) {
        var d0 = state.v0 * state.v0 * Math.sin(2 * a) / G;
        g.fillStyle = '#DC2626';
        g.fillText('d₀ = ' + d0.toFixed(1) + ' m，T = ' + T.toFixed(2) + ' s',
                   Math.min(X(d0) - 150, X(XMAX) - 160), Y(0) - 10);
      }
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      drawAxes();
      /* 常驻参考系：同 v₀ 的 45° 参考轨迹 */
      drawTraj(traj(state.v0, 45), '#CBD5E1', [6, 5]);
      g.fillStyle = '#94A3B8'; g.font = '11px sans-serif'; g.textAlign = 'left';
      var ref = traj(state.v0, 45);
      var apex = ref[Math.floor(ref.length / 2)];
      g.fillText('45° 参考（同 v₀ 射程最大）', X(apex[0]) + 8, Y(apex[1]) - 6);
      /* 叠加对比轨迹 */
      ghosts.forEach(function (gh, i) {
        drawTraj(traj(gh.v0, gh.angle), GHOST_COLORS[i % GHOST_COLORS.length], [3, 3]);
      });
      /* 当前轨迹 */
      drawTraj(traj(state.v0, state.angle), '#2563EB', []);
      drawArrow();
      drawFlight();
      /* 读数 */
      var a = state.angle * Math.PI / 180;
      var d0 = state.v0 * state.v0 * Math.sin(2 * a) / G;
      var Hm = state.v0 * state.v0 * Math.sin(a) * Math.sin(a) / (2 * G);
      var T = 2 * state.v0 * Math.sin(a) / G;
      panel.querySelector('#pj-range').textContent = 'd₀ = ' + d0.toFixed(1) + ' m';
      panel.querySelector('#pj-h').textContent = 'H = ' + Hm.toFixed(1) + ' m';
      panel.querySelector('#pj-t').textContent = 'T = ' + T.toFixed(2) + ' s';
    }

    function stopAnim() { if (anim) { cancelAnimationFrame(anim); anim = null; } }

    panel.querySelector('#pj-v0').addEventListener('input', function (e) {
      state.v0 = Number(e.target.value);
      panel.querySelector('#pj-v0-val').textContent = state.v0;
      stopAnim(); flying = null; draw();
    });
    panel.querySelector('#pj-angle').addEventListener('input', function (e) {
      state.angle = Number(e.target.value);
      panel.querySelector('#pj-angle-val').textContent = state.angle;
      stopAnim(); flying = null; draw();
    });
    panel.querySelector('#pj-launch').addEventListener('click', function () {
      stopAnim();
      var T = 2 * state.v0 * Math.sin(state.angle * Math.PI / 180) / G;
      var t0 = null;
      flying = { t: 0 };
      function step(ts) {
        if (t0 === null) t0 = ts;
        flying.t = Math.min((ts - t0) / 1000 * (T / 2.2), T);   /* 约 2.2 s 播完 */
        draw();
        if (flying.t < T) anim = requestAnimationFrame(step);
        else { anim = null; }
      }
      anim = requestAnimationFrame(step);
    });
    panel.querySelector('#pj-ghost').addEventListener('click', function () {
      if (ghosts.length < 5 &&
          !ghosts.some(function (h) { return h.v0 === state.v0 && h.angle === state.angle; })) {
        ghosts.push({ v0: state.v0, angle: state.angle });
      }
      draw();
    });
    panel.querySelector('#pj-clear').addEventListener('click', function () {
      ghosts = []; draw();
    });

    /* 拖拽初速度箭头：箭尖位置 → v₀/α（约束：只能从原点出发，符合物理） */
    var dragging = false;
    function arrowHit(e) {
      var r = canvas.getBoundingClientRect();
      var mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height);
      var a = state.angle * Math.PI / 180, len = 78 * state.v0 / 50;
      var x1 = X(0) + len * Math.cos(a), y1 = Y(0) - len * Math.sin(a);
      return Math.hypot(mx - x1, my - y1) < 26;
    }
    function dragTo(e) {
      var r = canvas.getBoundingClientRect();
      var mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height);
      var dx = mx - X(0), dy = Y(0) - my;
      if (dx < 2 && dy < 2) return;
      var ang = Math.atan2(dy, dx);
      state.angle = Math.round(Math.min(90, Math.max(15, ang * 180 / Math.PI)));
      var len = Math.min(78, Math.hypot(dx, dy));
      state.v0 = Math.round(Math.max(10, len / 78 * 50));
      panel.querySelector('#pj-v0').value = state.v0;
      panel.querySelector('#pj-angle').value = state.angle;
      panel.querySelector('#pj-v0-val').textContent = state.v0;
      panel.querySelector('#pj-angle-val').textContent = state.angle;
      stopAnim(); flying = null; draw();
    }
    canvas.addEventListener('mousedown', function (e) { if (arrowHit(e)) { dragging = true; } });
    canvas.addEventListener('mousemove', function (e) { if (dragging) dragTo(e); });
    canvas.addEventListener('mouseup', function () { dragging = false; });
    canvas.addEventListener('mouseleave', function () { dragging = false; });

    draw();
  }

  return { init: init };
})();
