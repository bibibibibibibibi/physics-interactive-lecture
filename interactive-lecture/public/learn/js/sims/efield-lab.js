/* ============================================================
 * sims/efield-lab.js — 电场实验室（第 5 章核心仿真）
 * 模型：二维点电荷系，k = 9.0（相对单位），电势 V = Σkq/r，
 *       场强 E = Σkq·r̂/r²。五种预设电荷布局：
 *         正点电荷 / 负点电荷 / 电偶极子 / 双正电荷 / 平行板
 *       背景为电势 colormap（红正蓝负，截断 ±VMAX），
 *       白色曲线为电场线（从正电荷 12 条种子线沿 E 数值积分，
 *       遇负电荷或出界停止；纯负电荷布局从边界反向种子）。
 * 探针：#ef-px/#ef-py 滑块拖动十字探针，读数 #ef-v / #ef-e
 *       初始即填充（自检脚本无交互读取）。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['efield-lab'] = (function () {
  'use strict';

  var W = 640, H = 400;
  var X0 = -3.2, X1 = 3.2, Y0 = -2.0, Y1 = 2.0;   /* 世界坐标（m） */
  var K = 9.0;                                     /* 相对库仑常量 */
  var VMAX = 60;                                   /* 电势色标截断 */
  var GW = 128, GH = 80;                           /* 电势网格 */

  /* 预设电荷布局：[q, x, y] */
  var PRESETS = {
    'plus':   { name: '单个正点电荷', charges: [[2, 0, 0]] },
    'minus':  { name: '单个负点电荷', charges: [[-2, 0, 0]] },
    'dipole': { name: '电偶极子（等量异号）', charges: [[1.5, -0.9, 0], [-1.5, 0.9, 0]] },
    'twice':  { name: '两个等量正电荷', charges: [[1.5, -0.9, 0], [1.5, 0.9, 0]] },
    'plates': { name: '平行板（两排 ± 电荷）', charges: (function () {
                  var c = [], i, y;
                  for (i = 0; i < 5; i++) { y = -1.2 + i * 0.6; c.push([1.2, -1.7, y]); }
                  for (i = 0; i < 5; i++) { y = -1.2 + i * 0.6; c.push([-1.2, 1.7, y]); }
                  return c;
              })() }
  };

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { preset: 'dipole', px: 0.6, py: 0.7 };
    var potImg = null;   /* 电势 colormap 缓存（预设切换时重算） */

    panel.innerHTML =
      '<label>电荷布局</label>' +
      '<select id="ef-preset">' +
      '<option value="plus">单个正点电荷</option>' +
      '<option value="minus">单个负点电荷</option>' +
      '<option value="dipole" selected>电偶极子（等量异号）</option>' +
      '<option value="twice">两个等量正电荷</option>' +
      '<option value="plates">平行板（两排 ± 电荷）</option>' +
      '</select>' +
      '<label>探针 x = <span id="ef-px-val">0.6</span> m</label>' +
      '<input type="range" id="ef-px" min="-3.2" max="3.2" step="0.05" value="0.6">' +
      '<label>探针 y = <span id="ef-py-val">0.7</span> m</label>' +
      '<input type="range" id="ef-py" min="-2.0" max="2.0" step="0.05" value="0.7">' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>探针处电势</span><span class="val" id="ef-v">—</span></div>' +
      '<div class="row"><span>探针处场强大小</span><span class="val" id="ef-e">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：背景色表示电势（红正蓝负），白线为电场线；' +
      '把探针沿电场线方向拖动，看 V 单调下降——电场线总是指向电势降低的方向。' +
      '数值为相对单位制（k = 9.0），重在比较大小与方向</label>';

    function charges() { return PRESETS[state.preset].charges; }

    function potential(x, y) {
      var cs = charges(), v = 0, i, dx, dy, r;
      for (i = 0; i < cs.length; i++) {
        dx = x - cs[i][1]; dy = y - cs[i][2];
        r = Math.sqrt(dx * dx + dy * dy);
        if (r < 0.08) r = 0.08;
        v += K * cs[i][0] / r;
      }
      return v;
    }
    function field(x, y) {
      var cs = charges(), ex = 0, ey = 0, i, dx, dy, r, r3;
      for (i = 0; i < cs.length; i++) {
        dx = x - cs[i][1]; dy = y - cs[i][2];
        r = Math.sqrt(dx * dx + dy * dy);
        if (r < 0.06) continue;
        r3 = r * r * r;
        ex += K * cs[i][0] * dx / r3;
        ey += K * cs[i][0] * dy / r3;
      }
      return [ex, ey];
    }

    /* ---- 世界 ↔ 像素 ---- */
    function wx(x) { return (x - X0) / (X1 - X0) * W; }
    function wy(y) { return H - (y - Y0) / (Y1 - Y0) * H; }

    /* ---- 电势 colormap（红正蓝负）---- */
    function buildPotential() {
      var off = document.createElement('canvas');
      off.width = GW; off.height = GH;
      var og = off.getContext('2d');
      var img;
      try {
        img = og && og.createImageData ? og.createImageData(GW, GH) : null;
      } catch (err) { img = null; }
      if (!img || !img.data) { potImg = null; return; }   /* 无像素级 canvas 时退回纯色背景 */
      var i, j, x, y, v, t, r, gr, b, p;
      for (j = 0; j < GH; j++) {
        y = Y1 - (j + 0.5) / GH * (Y1 - Y0);
        for (i = 0; i < GW; i++) {
          x = X0 + (i + 0.5) / GW * (X1 - X0);
          v = potential(x, y);
          t = v / VMAX;
          if (t > 1) t = 1; if (t < -1) t = -1;
          if (t >= 0) { r = 45 + 165 * t; gr = 45 + 30 * t; b = 60; }
          else { r = 45; gr = 45 + 30 * (-t); b = 60 + 160 * (-t); }
          p = (j * GW + i) * 4;
          img.data[p] = r; img.data[p + 1] = gr; img.data[p + 2] = b; img.data[p + 3] = 255;
        }
      }
      try { og.putImageData(img, 0, 0); potImg = off; }
      catch (err) { potImg = null; }
    }

    /* ---- 电场线：沿 E 数值积分 ---- */
    function traceLine(x, y) {
      var pts = [[x, y]], i, e, m, nx, ny, hit, cs = charges();
      for (i = 0; i < 1600; i++) {
        e = field(x, y);
        m = Math.sqrt(e[0] * e[0] + e[1] * e[1]);
        if (m < 1e-6) break;
        nx = x + e[0] / m * 0.03;
        ny = y + e[1] / m * 0.03;
        hit = false;
        for (var c = 0; c < cs.length; c++) {
          var dx = nx - cs[c][1], dy = ny - cs[c][2];
          if (dx * dx + dy * dy < 0.09 * 0.09) { hit = true; break; }
        }
        if (hit) break;
        if (nx < X0 || nx > X1 || ny < Y0 || ny > Y1) break;
        x = nx; y = ny;
        pts.push([x, y]);
      }
      return pts;
    }

    function drawFieldLines() {
      var cs = charges(), seeds = [], i, k, th, hasPos = false;
      for (i = 0; i < cs.length; i++) if (cs[i][0] > 0) hasPos = true;
      if (hasPos) {
        for (i = 0; i < cs.length; i++) {
          if (cs[i][0] <= 0) continue;
          for (k = 0; k < 12; k++) {
            th = 2 * Math.PI * k / 12;
            seeds.push([cs[i][1] + 0.10 * Math.cos(th), cs[i][2] + 0.10 * Math.sin(th)]);
          }
        }
      } else {
        /* 纯负电荷：从边界圆反向种子，E 指向电荷 */
        for (k = 0; k < 16; k++) {
          th = 2 * Math.PI * k / 16;
          seeds.push([2.9 * Math.cos(th), 1.85 * Math.sin(th)]);
        }
      }
      g.strokeStyle = 'rgba(255,255,255,0.85)';
      g.lineWidth = 1.4;
      for (i = 0; i < seeds.length; i++) {
        var pts = traceLine(seeds[i][0], seeds[i][1]);
        if (pts.length < 4) continue;
        g.beginPath();
        g.moveTo(wx(pts[0][0]), wy(pts[0][1]));
        for (k = 1; k < pts.length; k++) g.lineTo(wx(pts[k][0]), wy(pts[k][1]));
        g.stroke();
        /* 中途箭头 */
        var a = pts[Math.floor(pts.length * 0.55)];
        var b2 = pts[Math.floor(pts.length * 0.55) + 2] || pts[pts.length - 1];
        var ang = Math.atan2(wy(b2[1]) - wy(a[1]), wx(b2[0]) - wx(a[0]));
        g.save();
        g.translate(wx(a[0]), wy(a[1]));
        g.rotate(ang);
        g.beginPath();
        g.moveTo(0, 0); g.lineTo(-7, -3.5); g.lineTo(-7, 3.5); g.closePath();
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.fill();
        g.restore();
      }
    }

    function drawCharges() {
      var cs = charges(), i, x, y;
      for (i = 0; i < cs.length; i++) {
        x = wx(cs[i][1]); y = wy(cs[i][2]);
        g.beginPath();
        g.arc(x, y, 7, 0, Math.PI * 2);
        g.fillStyle = cs[i][0] > 0 ? '#EF4444' : '#3B82F6';
        g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = '#fff';
        g.font = 'bold 11px sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(cs[i][0] > 0 ? '+' : '−', x, y);
      }
    }

    function drawProbe() {
      var x = wx(state.px), y = wy(state.py);
      g.strokeStyle = '#FBBF24'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke();
      g.beginPath();
      g.moveTo(x - 14, y); g.lineTo(x + 14, y);
      g.moveTo(x, y - 14); g.lineTo(x, y + 14);
      g.stroke();
      /* E 方向小箭头 */
      var e = field(state.px, state.py);
      var m = Math.sqrt(e[0] * e[0] + e[1] * e[1]);
      if (m > 1e-9) {
        var dx = e[0] / m, dy = -e[1] / m;   /* 像素 y 向下 */
        g.strokeStyle = '#FDE047'; g.lineWidth = 2.4;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + dx * 26, y + dy * 26);
        g.stroke();
        g.beginPath();
        g.arc(x + dx * 26, y + dy * 26, 3, 0, Math.PI * 2);
        g.fillStyle = '#FDE047'; g.fill();
      }
    }

    function updateReadouts() {
      var v = potential(state.px, state.py);
      var e = field(state.px, state.py);
      var m = Math.sqrt(e[0] * e[0] + e[1] * e[1]);
      document.getElementById('ef-v').textContent = 'V = ' + v.toFixed(2) + ' V';
      document.getElementById('ef-e').textContent = 'E = ' + m.toFixed(2) + ' V/m';
      document.getElementById('ef-px-val').textContent = state.px.toFixed(2);
      document.getElementById('ef-py-val').textContent = state.py.toFixed(2);
    }

    function draw() {
      if (!potImg) buildPotential();
      if (potImg) {
        g.imageSmoothingEnabled = true;
        g.drawImage(potImg, 0, 0, W, H);
      } else {
        g.fillStyle = '#2D3436';
        g.fillRect(0, 0, W, H);
      }
      drawFieldLines();
      drawCharges();
      drawProbe();
      updateReadouts();
    }

    document.getElementById('ef-preset').addEventListener('change', function () {
      state.preset = this.value;
      potImg = null;
      draw();
    });
    document.getElementById('ef-px').addEventListener('input', function () {
      state.px = parseFloat(this.value);
      draw();
    });
    document.getElementById('ef-py').addEventListener('input', function () {
      state.py = parseFloat(this.value);
      draw();
    });

    draw();   /* 初始即渲染并填充读数 */
  }

  return { init: init };
})();
