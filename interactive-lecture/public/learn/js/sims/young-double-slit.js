/* ============================================================
 * sims/young-double-slit.js — 杨氏双缝干涉仿真器（第 11 章核心仿真）
 * 交互：波长 λ / 双缝间距 d 滑块，实时重画条纹带与光强曲线。
 * 模型：I(x) = 4I₀·cos²(π·d·x/(d′λ))，条纹间距 Δx = d′λ/d
 * 规范：坐标刻度固定（x ∈ ±15 mm，d′ = 1.0 m 固定），只动物理量。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['young-double-slit'] = (function () {
  'use strict';

  var DP = 1.0;             /* 双缝到屏距离 d′，固定 1.0 m */
  var XMAX = 15e-3;         /* 固定坐标窗 ±15 mm */

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;

    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = 640; canvas.height = 400;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { lambda: 550, d: 0.25 };   /* λ: nm；d: mm */

    panel.innerHTML =
      '<label>波长 λ = <span id="ys-lambda-val">550</span> nm（紫 400 ～ 红 700）</label>' +
      '<input type="range" id="ys-lambda" min="400" max="700" step="5" value="550">' +
      '<label>双缝间距 d = <span id="ys-d-val">0.25</span> mm</label>' +
      '<input type="range" id="ys-d" min="0.10" max="0.50" step="0.01" value="0.25">' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>条纹间距 Δx = d′λ/d</span><span class="val" id="ys-dx">—</span></div>' +
      '<div class="row"><span>缝屏距离 d′（固定）</span><span class="val">1.00 m</span></div>' +
      '</div>' +
      '<label style="margin-top:12px;color:#8B95A7">λ 变大 → 条纹变疏；d 变大 → 条纹变密。刻度固定，可直接数条纹验证 Δx</label>';

    panel.querySelector('#ys-lambda').addEventListener('input', function (e) {
      state.lambda = Number(e.target.value);
      panel.querySelector('#ys-lambda-val').textContent = state.lambda;
      draw();
    });
    panel.querySelector('#ys-d').addEventListener('input', function (e) {
      state.d = Number(e.target.value);
      panel.querySelector('#ys-d-val').textContent = state.d.toFixed(2);
      draw();
    });

    function intensity(x) {   /* x: m，返回 0~1 */
      var phase = Math.PI * (state.d * 1e-3) * x / (DP * state.lambda * 1e-9);
      var c = Math.cos(phase);
      return c * c;
    }

    function draw() {
      var W = canvas.width, H = canvas.height;
      var padL = 56, padR = 16, padT = 16, padB = 44;
      var bandH = 64;                          /* 底部条纹带高度 */
      var curveB = H - padB - bandH - 12;      /* 光强曲线区底边 */
      function X(x) { return padL + (W - padL - padR) * (x / XMAX + 1) / 2; }
      function Y(iv) { return curveB - (curveB - padT) * iv; }

      g.clearRect(0, 0, W, H);

      /* —— 光强曲线区坐标轴（刻度固定）—— */
      g.strokeStyle = '#9AA3B2'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(padL, padT - 4); g.lineTo(padL, curveB); g.lineTo(W - padR + 4, curveB); g.stroke();
      g.fillStyle = '#5B6472'; g.font = '12px sans-serif'; g.textAlign = 'center';
      for (var xm = -12; xm <= 12; xm += 6) {
        g.fillText(String(xm), X(xm * 1e-3), curveB + 14);
        g.beginPath(); g.moveTo(X(xm * 1e-3), curveB); g.lineTo(X(xm * 1e-3), curveB + 4); g.stroke();
      }
      g.fillText('屏上位置 x / mm', (padL + W - padR) / 2, curveB + 30);
      g.save(); g.translate(14, (padT + curveB) / 2); g.rotate(-Math.PI / 2);
      g.fillText('光强 I / 4I₀', 0, 0); g.restore();
      g.textAlign = 'left'; g.fillText('1.0', padL - 26, Y(1) + 4);
      g.setLineDash([3, 3]); g.strokeStyle = '#D3D8E0';
      g.beginPath(); g.moveTo(padL, Y(1)); g.lineTo(W - padR, Y(1)); g.stroke();
      g.setLineDash([]);

      /* —— 光强曲线 —— */
      g.beginPath();
      var N = 480;
      for (var i = 0; i <= N; i++) {
        var x = -XMAX + 2 * XMAX * i / N;
        if (i === 0) g.moveTo(X(x), Y(intensity(x))); else g.lineTo(X(x), Y(intensity(x)));
      }
      g.strokeStyle = '#7C3AED'; g.lineWidth = 2; g.stroke();

      /* —— 条纹带（亮度 = 光强）—— */
      var bandT = curveB + 34;
      for (var px = padL; px < W - padR; px++) {
        var xx = (2 * (px - padL) / (W - padL - padR) - 1) * XMAX;
        var iv = intensity(xx);
        g.fillStyle = 'rgba(124,58,237,' + iv.toFixed(3) + ')';
        g.fillRect(px, bandT, 1, bandH);
      }
      g.strokeStyle = '#9AA3B2'; g.lineWidth = 1;
      g.strokeRect(padL, bandT, W - padL - padR, bandH);
      g.fillStyle = '#5B6472'; g.font = '12px sans-serif'; g.textAlign = 'center';
      g.fillText('屏上条纹（示意亮度）', (padL + W - padR) / 2, bandT + bandH + 16);

      /* —— 相邻明纹间距标注 —— */
      var dx = DP * state.lambda * 1e-9 / (state.d * 1e-3);   /* m */
      if (2 * dx < XMAX) {
        g.strokeStyle = '#F59E0B'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(X(0), Y(1.06)); g.lineTo(X(dx), Y(1.06)); g.stroke();
        g.beginPath(); g.moveTo(X(0), Y(1.02)); g.lineTo(X(0), Y(1.10));
        g.moveTo(X(dx), Y(1.02)); g.lineTo(X(dx), Y(1.10)); g.stroke();
        g.fillStyle = '#F59E0B'; g.font = 'bold 12px sans-serif'; g.textAlign = 'left';
        g.fillText('Δx', X(dx) + 4, Y(1.06) + 4);
      }

      panel.querySelector('#ys-dx').textContent = 'Δx = ' + (dx * 1e3).toFixed(2) + ' mm';
    }

    draw();
  }

  return { init: init };
})();
