/* ============================================================
 * sims/shm-lab.js — 简谐振动实验室：旋转矢量 ↔ 弹簧振子 ↔ x-t 图线
 * （第 9 章核心仿真）
 * 模型：x = A cos(ωt + φ)，v = −Aω sin(ωt + φ)。
 * 画面：左侧旋转矢量圆（逆时针匀角速转动），其端点在水平直径上的
 *       投影驱动下方弹簧振子滑块；右侧实时描出 x-t 图线（解析式，
 *       窗口固定为最近两个周期），当前时刻以动点标出。
 * 规范（5.3）：坐标几何固定，只动物理量；
 *       读数初始即填充（自检脚本无交互读取 #sh-x）。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['shm-lab'] = (function () {
  'use strict';

  var W = 640, H = 400;
  var CX = 150, CY = 165, R0 = 92;          /* 旋转矢量圆几何（固定，A=1m 对应 R0 像素） */
  var OY = 300, OX0 = 58, OX1 = 242;        /* 弹簧振子滑轨 */
  var GX0 = 300, GX1 = 622, GCY = 165, GAMP = 110;  /* x-t 图区 */

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { A: 0.6, w: 1.5, phi: Math.PI / 3 };
    var t = 0, running = true, raf = null, lastTs = 0;

    panel.innerHTML =
      '<label>振幅 A = <span id="sh-a-val">0.60</span> m</label>' +
      '<input type="range" id="sh-a" min="0.2" max="1.0" step="0.05" value="0.6">' +
      '<label>角频率 ω = <span id="sh-w-val">1.50</span> rad/s</label>' +
      '<input type="range" id="sh-w" min="0.5" max="3" step="0.1" value="1.5">' +
      '<label>初相 φ = <span id="sh-f-val">1.05</span> rad（π/3 ≈ 1.05）</label>' +
      '<input type="range" id="sh-f" min="0" max="6.28" step="0.01" value="1.05">' +
      '<div class="sim-btnrow">' +
      '<button type="button" id="sh-toggle" class="on">⏸ 暂停</button>' +
      '<button type="button" id="sh-reset">复位 t = 0</button>' +
      '</div>' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>相位 ωt+φ</span><span class="val" id="sh-ph">—</span></div>' +
      '<div class="row"><span>位移</span><span class="val" id="sh-x">—</span></div>' +
      '<div class="row"><span>速度</span><span class="val" id="sh-v">—</span></div>' +
      '<div class="row"><span>周期</span><span class="val" id="sh-t">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：旋转矢量端点的水平投影就是滑块的位移；' +
      '调 φ 看曲线整体平移，调 ω 看周期变化，调 A 看幅度变化</label>';

    /* ---- 物理量 ---- */
    function phase() { return state.w * t + state.phi; }
    function xNow() { return state.A * Math.cos(phase()); }
    function vNow() { return -state.A * state.w * Math.sin(phase()); }
    function period() { return 2 * Math.PI / state.w; }

    /* ---- 画面 ---- */
    function draw() {
      g.clearRect(0, 0, W, H);
      var th = phase();
      var R = state.A * R0;
      var ex = CX + R * Math.cos(th), ey = CY - R * Math.sin(th);  /* 端点（y 轴翻转） */
      var px = CX + R * Math.cos(th);                              /* 水平投影 */

      /* 旋转矢量圆 */
      g.strokeStyle = '#CBD5E1'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(CX, CY, R0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = '#94A3B8'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(CX - R0 - 8, CY); g.lineTo(CX + R0 + 8, CY); g.stroke();
      g.beginPath(); g.moveTo(CX, CY - R0 - 8); g.lineTo(CX, CY + R0 + 8); g.stroke();
      g.fillStyle = '#64748B'; g.font = '11px sans-serif'; g.textAlign = 'left';
      g.fillText('x', CX + R0 + 10, CY + 4);
      /* 初相参考虚线 */
      g.strokeStyle = '#CBD5E1'; g.setLineDash([4, 4]);
      g.beginPath(); g.moveTo(CX, CY);
      g.lineTo(CX + R * Math.cos(state.phi), CY - R * Math.sin(state.phi)); g.stroke();
      g.setLineDash([]);
      /* 旋转矢量 */
      g.strokeStyle = '#2563EB'; g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(CX, CY); g.lineTo(ex, ey); g.stroke();
      g.fillStyle = '#2563EB';
      g.beginPath(); g.arc(ex, ey, 4.5, 0, Math.PI * 2); g.fill();
      g.font = 'bold 13px sans-serif';
      g.fillText('A', (CX + ex) / 2 + 8, (CY + ey) / 2 - 6);
      /* ω 弧箭头 */
      g.strokeStyle = '#DC2626'; g.lineWidth = 2;
      g.beginPath(); g.arc(CX, CY, R0 + 12, -0.4, -1.15, true); g.stroke();
      g.fillStyle = '#DC2626'; g.font = '12px sans-serif';
      g.fillText('ω', CX + R0 + 6, CY - 30);
      /* 投影竖虚线 */
      g.strokeStyle = '#B45309'; g.setLineDash([3, 3]); g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(ex, ey); g.lineTo(px, CY); g.stroke();
      g.beginPath(); g.moveTo(px, CY); g.lineTo(px, OY - 26); g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#B45309';
      g.beginPath(); g.arc(px, CY, 3.5, 0, Math.PI * 2); g.fill();

      /* 弹簧振子：墙 + 弹簧（折线） + 滑块 */
      g.strokeStyle = '#334155'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(OX0 - 10, OY - 30); g.lineTo(OX0 - 10, OY + 8); g.stroke();
      g.lineWidth = 1;
      for (var i = 0; i < 6; i++) {
        g.beginPath(); g.moveTo(OX0 - 18 + i * 3, OY - 30); g.lineTo(OX0 - 14 + i * 3, OY - 24); g.stroke();
      }
      var bx = px;  /* 滑块中心 */
      g.strokeStyle = '#475569'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(OX0 - 10, OY - 12);
      var coils = 7, span = (bx - 14) - (OX0 - 10);
      for (var c = 1; c <= coils * 2; c++) {
        var sx = (OX0 - 10) + span * c / (coils * 2);
        g.lineTo(sx, OY - 12 + (c % 2 ? -7 : 7));
      }
      g.lineTo(bx - 14, OY - 12); g.stroke();
      g.fillStyle = '#DBEAFE'; g.strokeStyle = '#1D4ED8'; g.lineWidth = 1.6;
      g.fillRect(bx - 14, OY - 26, 28, 26); g.strokeRect(bx - 14, OY - 26, 28, 26);
      g.fillStyle = '#1D4ED8'; g.font = '11px sans-serif'; g.textAlign = 'center';
      g.fillText('m', bx, OY - 9);
      /* 平衡位置标记 */
      g.strokeStyle = '#94A3B8'; g.setLineDash([2, 3]);
      g.beginPath(); g.moveTo(CX, OY - 32); g.lineTo(CX, OY + 6); g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#64748B';
      g.fillText('O', CX, OY + 18);
      g.fillText('平衡位置', CX, OY + 31);

      /* x-t 图线（最近两个周期，解析式） */
      g.strokeStyle = '#94A3B8'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(GX0, GCY); g.lineTo(GX1, GCY); g.stroke();
      g.beginPath(); g.moveTo(GX0, GCY - GAMP - 12); g.lineTo(GX0, GCY + GAMP + 12); g.stroke();
      g.fillStyle = '#64748B'; g.textAlign = 'left'; g.font = '11px sans-serif';
      g.fillText('x', GX0 + 4, GCY - GAMP - 2);
      g.fillText('t', GX1 - 4, GCY + 16);
      /* ±A 虚线 */
      g.strokeStyle = '#E2E8F0'; g.setLineDash([4, 4]);
      [-1, 1].forEach(function (s) {
        var yy = GCY - s * state.A * GAMP;
        g.beginPath(); g.moveTo(GX0, yy); g.lineTo(GX1, yy); g.stroke();
      });
      g.setLineDash([]);
      g.fillStyle = '#94A3B8';
      g.fillText('+A', GX0 + 3, GCY - state.A * GAMP - 4);
      g.fillText('−A', GX0 + 3, GCY + state.A * GAMP + 12);
      var T = period(), win = 2 * T;
      g.strokeStyle = '#2563EB'; g.lineWidth = 2.2;
      g.beginPath();
      for (var k = 0; k <= 240; k++) {
        var tt = t - win + win * k / 240;
        var xx = GX0 + (GX1 - GX0) * k / 240;
        var yy = GCY - state.A * Math.cos(state.w * tt + state.phi) * GAMP;
        if (k === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy);
      }
      g.stroke();
      /* 当前点 */
      var cy0 = GCY - xNow() * GAMP;
      g.fillStyle = '#DC2626';
      g.beginPath(); g.arc(GX1, cy0, 5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#64748B'; g.font = '11px sans-serif';
      g.fillText('窗口 = 2T', GX0 + 4, GCY + GAMP + 24);

      /* 读数 */
      var ph2 = phase() % (2 * Math.PI);
      setT('sh-ph', 'φ = ' + ph2.toFixed(2) + ' rad');
      setT('sh-x', 'x = ' + xNow().toFixed(2) + ' m');
      setT('sh-v', 'v = ' + vNow().toFixed(2) + ' m/s');
      setT('sh-t', 'T = ' + T.toFixed(2) + ' s');
    }

    function setT(id, s) {
      var el = document.getElementById(id);
      if (el) el.textContent = s;
    }

    /* ---- 动画 ---- */
    function loop(ts) {
      if (!lastTs) lastTs = ts;
      var dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      if (running) t += dt;
      draw();
      raf = window.requestAnimationFrame(loop);
    }

    /* ---- 交互 ---- */
    function bind(id, key, valId, fmt) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        state[key] = parseFloat(el.value);
        setT(valId, fmt(state[key]));
        draw();
      });
    }
    bind('sh-a', 'A', 'sh-a-val', function (v) { return v.toFixed(2); });
    bind('sh-w', 'w', 'sh-w-val', function (v) { return v.toFixed(2); });
    bind('sh-f', 'phi', 'sh-f-val', function (v) { return v.toFixed(2); });

    var tog = document.getElementById('sh-toggle');
    if (tog) tog.addEventListener('click', function () {
      running = !running;
      tog.textContent = running ? '⏸ 暂停' : '▶ 继续';
      tog.classList.toggle('on', running);
    });
    var rst = document.getElementById('sh-reset');
    if (rst) rst.addEventListener('click', function () { t = 0; draw(); });

    draw();  /* 读数初始即填充 */
    if (window.requestAnimationFrame) {
      raf = window.requestAnimationFrame(loop);
    }
  }

  return { init: init };
})();
