/* ============================================================
 * sims/single-slit.js — 单缝夫琅禾费衍射仿真器（第 11 章核心仿真）
 * 交互：缝宽 b / 波长 λ 滑块，实时重画光强曲线与条纹带。
 * 模型：I(x) = I₀·(sinβ/β)²，β = π·b·x/(λf)；中央明纹宽 Δx₀ = 2λf/b
 * 规范：坐标刻度固定（x ∈ ±15 mm，f = 0.50 m 固定），只动物理量。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['single-slit'] = (function () {
  'use strict';

  var F = 0.50;             /* 透镜焦距 f，固定 0.50 m */
  var XMAX = 15e-3;         /* 固定坐标窗 ±15 mm */

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;

    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = 640; canvas.height = 400;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { b: 0.10, lambda: 550 };   /* b: mm；λ: nm */

    panel.innerHTML =
      '<label>缝宽 b = <span id="ss-b-val">0.10</span> mm</label>' +
      '<input type="range" id="ss-b" min="0.05" max="0.50" step="0.01" value="0.10">' +
      '<label>波长 λ = <span id="ss-lambda-val">550</span> nm（紫 400 ～ 红 700）</label>' +
      '<input type="range" id="ss-lambda" min="400" max="700" step="5" value="550">' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>中央明纹宽度 Δx₀ = 2λf/b</span><span class="val" id="ss-w0">—</span></div>' +
      '<div class="row"><span>第一级暗纹位置 x₁ = λf/b</span><span class="val" id="ss-x1">—</span></div>' +
      '</div>' +
      '<label style="margin-top:12px;color:#8B95A7">b 变小 → 中央明纹变宽（衍射更显著）；b 远大于 λ 时条纹向中心收缩，过渡到几何光学</label>';

    panel.querySelector('#ss-b').addEventListener('input', function (e) {
      state.b = Number(e.target.value);
      panel.querySelector('#ss-b-val').textContent = state.b.toFixed(2);
      draw();
    });
    panel.querySelector('#ss-lambda').addEventListener('input', function (e) {
      state.lambda = Number(e.target.value);
      panel.querySelector('#ss-lambda-val').textContent = state.lambda;
      draw();
    });

    function intensity(x) {   /* x: m，返回 0~1 */
      var beta = Math.PI * (state.b * 1e-3) * x / (state.lambda * 1e-9 * F);
      if (Math.abs(beta) < 1e-9) return 1;
      var s = Math.sin(beta) / beta;
      return s * s;
    }

    function draw() {
      var W = canvas.width, H = canvas.height;
      var padL = 56, padR = 16, padT = 16, padB = 44;
      var bandH = 64;
      var curveB = H - padB - bandH - 12;
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
      g.fillText('光强 I / I₀', 0, 0); g.restore();
      g.textAlign = 'left'; g.fillText('1.0', padL - 26, Y(1) + 4);
      g.setLineDash([3, 3]); g.strokeStyle = '#D3D8E0';
      g.beginPath(); g.moveTo(padL, Y(1)); g.lineTo(W - padR, Y(1)); g.stroke();
      g.setLineDash([]);

      /* —— 光强曲线（填充）—— */
      g.beginPath(); g.moveTo(X(-XMAX), Y(0));
      var N = 480;
      for (var i = 0; i <= N; i++) {
        var x = -XMAX + 2 * XMAX * i / N;
        g.lineTo(X(x), Y(intensity(x)));
      }
      g.lineTo(X(XMAX), Y(0)); g.closePath();
      g.fillStyle = 'rgba(124,58,237,.15)'; g.fill();
      g.beginPath();
      for (var j = 0; j <= N; j++) {
        var x2 = -XMAX + 2 * XMAX * j / N;
        if (j === 0) g.moveTo(X(x2), Y(intensity(x2))); else g.lineTo(X(x2), Y(intensity(x2)));
      }
      g.strokeStyle = '#7C3AED'; g.lineWidth = 2; g.stroke();

      /* —— 第一级暗纹标记（±x₁）—— */
      var x1 = state.lambda * 1e-9 * F / (state.b * 1e-3);   /* m */
      if (x1 < XMAX) {
        g.setLineDash([5, 4]); g.strokeStyle = '#F59E0B'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(X(x1), Y(0)); g.lineTo(X(x1), Y(0.12));
        g.moveTo(X(-x1), Y(0)); g.lineTo(X(-x1), Y(0.12)); g.stroke();
        g.setLineDash([]);
        g.fillStyle = '#F59E0B'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center';
        g.fillText('x₁', X(x1), Y(0.16)); g.fillText('−x₁', X(-x1), Y(0.16));
      }

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
      g.fillText('屏上衍射条纹（示意亮度）', (padL + W - padR) / 2, bandT + bandH + 16);

      panel.querySelector('#ss-w0').textContent = 'Δx₀ = ' + (2 * x1 * 1e3).toFixed(2) + ' mm';
      panel.querySelector('#ss-x1').textContent = 'x₁ = ' + (x1 * 1e3).toFixed(2) + ' mm';
    }

    draw();
  }

  return { init: init };
})();
