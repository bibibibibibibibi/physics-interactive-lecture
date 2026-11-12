/* ============================================================
 * sims/relat-lab.js — 相对论时空效应实验室（第 14 章核心仿真）
 * 模型：洛伦兹因子 γ(β) = 1/√(1−β²)，β = v/c
 *   长度收缩  l  = l₀/γ        （运动方向上的测量长度）
 *   时间延缓  Δt = γ·Δt₀       （运动时钟变慢的倍数）
 * 图面：γ(β) 上升曲线（蓝）与 1/γ(β) 下降曲线（红），β ∈ [0,1]，
 *   竖直虚线标记当前 β，两曲线交点 β = 0 处 γ = 1。
 * 规范（5.3）：坐标几何固定（β 窗口恒 0~1，γ 轴恒 0~5），只动标记点；
 *       读数初始即填充（自检脚本无交互读取 #rl-gamma）。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['relat-lab'] = (function () {
  'use strict';

  var W = 640, H = 400;
  var PX0 = 70, PX1 = 620, PY0 = 340, PY1 = 40;   /* 绘图区 */
  var GMAX = 5.0;                                  /* γ 轴上限 */

  function gamma(b) { return 1 / Math.sqrt(1 - b * b); }
  function x2px(b) { return PX0 + (PX1 - PX0) * b; }
  function y2px(v) { return PY0 - (PY0 - PY1) * v / GMAX; }

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { beta: 0.90 };

    panel.innerHTML =
      '<label>相对速率 β = v/c = <span id="rl-beta-val">0.90</span></label>' +
      '<input type="range" id="rl-beta" min="0" max="0.99" step="0.01" value="0.90">' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>洛伦兹因子</span><span class="val" id="rl-gamma">—</span></div>' +
      '<div class="row"><span>长度收缩 l = l₀/γ</span><span class="val" id="rl-l">—</span></div>' +
      '<div class="row"><span>时间延缓 Δt = γΔt₀</span><span class="val" id="rl-t">—</span></div>' +
      '<div class="row"><span>相对论动能 E_k = (γ−1)m₀c²</span><span class="val" id="rl-ek">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：β &lt; 0.3 时 γ ≈ 1，经典力学足够精确；' +
      'β 超过 0.9 后 γ 急剧攀升——民航客机 β≈10⁻⁶，γ−1≈10⁻¹³，完全感觉不到相对论效应；' +
      '这也正是有静质量的物体无法加速到光速的原因</label>';

    function draw() {
      g.clearRect(0, 0, W, H);
      /* 轴 */
      g.strokeStyle = '#94A3B8'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(PX0, PY1 - 8); g.lineTo(PX0, PY0 + 6); g.stroke();
      g.beginPath(); g.moveTo(PX0 - 6, PY0); g.lineTo(PX1 + 8, PY0); g.stroke();
      g.fillStyle = '#64748B'; g.font = '11px sans-serif'; g.textAlign = 'left';
      g.fillText('γ', PX0 + 6, PY1 + 2);
      g.textAlign = 'right';
      g.fillText('β = v/c', PX1 + 4, PY0 + 20);
      /* 刻度 */
      g.textAlign = 'center';
      for (var b = 0; b <= 1.001; b += 0.2) {
        var px = x2px(b);
        g.beginPath(); g.moveTo(px, PY0 - 3); g.lineTo(px, PY0 + 3); g.stroke();
        g.fillText(b.toFixed(1), px, PY0 + 15);
      }
      g.textAlign = 'right';
      for (var v = 1; v <= 5; v++) {
        var py = y2px(v);
        g.beginPath(); g.moveTo(PX0 - 3, py); g.lineTo(PX0 + 3, py); g.stroke();
        g.fillText(String(v), PX0 - 7, py + 4);
      }
      /* γ(β) 曲线（蓝，截断于 γ = 5） */
      g.strokeStyle = '#1D4ED8'; g.lineWidth = 2.4;
      g.beginPath();
      var started = false;
      for (var i = 0; i <= 400; i++) {
        var bb = i / 400 * 0.998, gg = gamma(bb);
        if (gg > GMAX) { started = false; continue; }
        if (!started) { g.moveTo(x2px(bb), y2px(gg)); started = true; }
        else g.lineTo(x2px(bb), y2px(gg));
      }
      g.stroke();
      /* 1/γ(β) 曲线（红） */
      g.strokeStyle = '#DC2626'; g.lineWidth = 2.4;
      g.beginPath();
      for (var j = 0; j <= 400; j++) {
        var bj = j / 400, yv = 1 / gamma(bj);
        if (j === 0) g.moveTo(x2px(bj), y2px(yv));
        else g.lineTo(x2px(bj), y2px(yv));
      }
      g.stroke();
      /* 图例 */
      g.textAlign = 'left'; g.font = '12px sans-serif';
      g.fillStyle = '#1D4ED8';
      g.fillText('γ(β)：时间延缓 / 质量放大倍数', PX0 + 16, PY1 + 26);
      g.fillStyle = '#DC2626';
      g.fillText('1/γ(β)：长度收缩比例 l/l₀', PX0 + 16, PY1 + 44);
      /* 当前 β：竖直虚线 + 两交点 */
      var cb = state.beta, cg = gamma(cb), ci = 1 / cg;
      g.strokeStyle = '#64748B'; g.setLineDash([5, 5]); g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x2px(cb), PY0); g.lineTo(x2px(cb), y2px(Math.min(cg, GMAX)));
      g.stroke(); g.setLineDash([]);
      g.fillStyle = '#1D4ED8';
      g.beginPath(); g.arc(x2px(cb), y2px(Math.min(cg, GMAX)), 5.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#DC2626';
      g.beginPath(); g.arc(x2px(cb), y2px(ci), 5.5, 0, Math.PI * 2); g.fill();
      g.font = '12px sans-serif'; g.textAlign = 'center';
      g.fillText('l/l₀ = ' + ci.toFixed(3), x2px(cb), y2px(ci) + 20);
      if (cg <= GMAX) {
        g.fillStyle = '#1D4ED8';
        g.fillText('γ = ' + cg.toFixed(2), x2px(cb), y2px(cg) - 12);
      }
    }

    function readouts() {
      var gm = gamma(state.beta);
      document.getElementById('rl-gamma').textContent = 'γ = ' + gm.toFixed(2);
      document.getElementById('rl-l').textContent = 'l = ' + (1 / gm).toFixed(3) + ' l₀';
      document.getElementById('rl-t').textContent = 'Δt = ' + gm.toFixed(2) + ' Δt₀';
      document.getElementById('rl-ek').textContent = 'E_k = ' + (gm - 1).toFixed(2) + ' m₀c²';
    }

    document.getElementById('rl-beta').addEventListener('input', function () {
      state.beta = parseFloat(this.value);
      document.getElementById('rl-beta-val').textContent = state.beta.toFixed(2);
      draw(); readouts();
    });

    draw(); readouts();
  }

  return { init: init };
})();
