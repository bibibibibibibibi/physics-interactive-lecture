/* ============================================================
 * sims/emf-lab.js — 交流发电机实验室（第 8 章核心仿真）
 * 模型：N 匝线圈（面积 S 固定 0.01 m²）在匀强磁场 B 中绕竖直轴
 *   以频率 f 匀速转动，磁链 NΦ = NBS·cos(ωt)，感应电动势
 *   ℇ = −d(NΦ)/dt = NBSω·sin(ωt) = ℇ_m·sin(ωt)。
 * 画布：左侧磁极间转动的线圈（俯视透视：线圈水平边投影 ∝ cos(ωt)，
 *   法线 e_n 随转动改变指向）；右侧 ℇ–t 正弦曲线（量程固定：
 *   横轴 0~2T，纵轴随当前 ℇ_m 定标并标注），红点跟随当前时刻。
 * 规范（5.3）：读数初始即填充（#em-emax），动画仅重绘画布。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['emf-lab'] = (function () {
  'use strict';

  var W = 640, H = 400;
  var S = 0.01;                       /* 线圈面积 m²（固定） */
  /* 左：磁极区；右：ℇ–t 曲线 */
  var PX0 = 380, PX1 = 625, PY0 = 330, PY1 = 60;

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { n: 500, b: 0.5, f: 1.0, t: 0 };   /* N 匝 / B T / f Hz */

    panel.innerHTML =
      '<label>线圈匝数 N = <span id="em-n-val">500</span> 匝</label>' +
      '<input type="range" id="em-n" min="100" max="1000" step="50" value="500">' +
      '<label>磁感强度 B = <span id="em-b-val">0.50</span> T</label>' +
      '<input type="range" id="em-b" min="0.1" max="1.0" step="0.05" value="0.5">' +
      '<label>转动频率 f = <span id="em-f-val">1.0</span> Hz（线圈面积 S 固定 0.01 m²）</label>' +
      '<input type="range" id="em-f" min="0.5" max="3" step="0.1" value="1.0">' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>电动势最大值</span><span class="val" id="em-emax">—</span></div>' +
      '<div class="row"><span>角速度</span><span class="val" id="em-omega">—</span></div>' +
      '<div class="row"><span>当前电动势</span><span class="val" id="em-now">—</span></div>' +
      '<div class="row"><span>当前磁链</span><span class="val" id="em-flux">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：ℇ_m = NBSω——匝数、磁场、' +
      '转速任一项加倍，交流电动势的幅值就加倍；曲线过零点时线圈平面恰与磁场垂直' +
      '（磁通最大而电动势为零）</label>';

    function omega() { return 2 * Math.PI * state.f; }
    function emax() { return state.n * state.b * S * omega(); }
    function emf(t) { return emax() * Math.sin(omega() * t); }
    function flux(t) { return state.n * state.b * S * Math.cos(omega() * t); }   /* 磁链 NΦ */

    /* ---- 左侧：磁极 + 转动线圈（投影宽度 ∝ cosθ） ---- */
    function drawCoil() {
      /* 磁极 */
      g.fillStyle = '#E2E8F0'; g.strokeStyle = '#64748B'; g.lineWidth = 1.2;
      g.fillRect(18, 60, 26, 280); g.strokeRect(18, 60, 26, 280);
      g.fillRect(316, 60, 26, 280); g.strokeRect(316, 60, 26, 280);
      g.fillStyle = '#334155'; g.font = 'bold 16px sans-serif'; g.textAlign = 'center';
      g.fillText('N', 31, 205); g.fillText('S', 329, 205);
      /* B 场箭头（向右） */
      g.strokeStyle = '#1D4ED8'; g.lineWidth = 1.6;
      for (var yy = 110; yy <= 300; yy += 48) {
        g.beginPath(); g.moveTo(52, yy); g.lineTo(308, yy); g.stroke();
        g.beginPath(); g.moveTo(308, yy); g.lineTo(298, yy - 4);
        g.moveTo(308, yy); g.lineTo(298, yy + 4); g.stroke();
      }
      g.font = '13px sans-serif'; g.textAlign = 'left';
      g.fillText('B', 58, 100);

      var cx = 180, cy = 200, th = omega() * state.t;
      var proj = Math.cos(th);            /* 水平边投影系数 */
      var ux = 78 * proj, uy = -26 * proj;
      var vx = 0, vy = 72;
      /* 转轴 */
      g.strokeStyle = '#94A3B8'; g.setLineDash([4, 4]); g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx, 70); g.lineTo(cx, 330); g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#64748B'; g.font = '11px sans-serif'; g.textAlign = 'left';
      g.fillText("O′", cx + 5, 80); g.fillText('O', cx + 5, 328);
      /* 线圈（平行四边形） */
      g.strokeStyle = '#0F172A'; g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(cx - ux - vx, cy - uy - vy);
      g.lineTo(cx + ux - vx, cy + uy - vy);
      g.lineTo(cx + ux + vx, cy + uy + vy);
      g.lineTo(cx - ux + vx, cy - uy + vy);
      g.closePath(); g.stroke();
      /* 法线 e_n（垂直于水平边） */
      var nl = Math.hypot(ux, uy) || 1;
      var enx = -uy / nl, eny = ux / nl;
      if (eny > 0) { enx = -enx; eny = -eny; }      /* 指向上半平面 */
      g.strokeStyle = '#DC2626'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx, cy);
      g.lineTo(cx + 52 * enx, cy + 52 * eny); g.stroke();
      var tx = cx + 52 * enx, ty = cy + 52 * eny;
      g.beginPath(); g.moveTo(tx, ty);
      g.lineTo(tx - 9 * enx - 4 * eny, ty - 9 * eny + 4 * enx);
      g.moveTo(tx, ty); g.lineTo(tx - 9 * enx + 4 * eny, ty - 9 * eny - 4 * enx);
      g.stroke();
      g.fillStyle = '#DC2626'; g.font = '12px sans-serif';
      g.fillText('e_n', tx + 6, ty - 4);
      /* θ 标注 */
      g.fillStyle = '#64748B'; g.font = '11px sans-serif'; g.textAlign = 'center';
      var deg = ((th * 180 / Math.PI) % 360 + 360) % 360;
      g.fillText('θ = ωt = ' + deg.toFixed(0) + '°', cx, 352);
      /* 电动势方向提示（ℇ 正负与曲线同步） */
      var e = emf(state.t);
      g.fillStyle = e >= 0 ? '#15803D' : '#B45309';
      g.font = '12px sans-serif';
      g.fillText(e >= 0 ? 'ℇ > 0（与绕行方向相同）' : 'ℇ < 0（与绕行方向相反）', cx, 370);
    }

    /* ---- 右侧：ℇ–t 曲线（横轴 0~2T 固定，纵轴随 ℇ_m 定标） ---- */
    function drawPlot() {
      var T = 1 / state.f, em = emax();
      function x2px(t) { return PX0 + (PX1 - PX0) * t / (2 * T); }
      function y2px(e) { return (PY0 + PY1) / 2 - ((PY0 - PY1) / 2 - 6) * e / em; }
      g.strokeStyle = '#94A3B8'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(PX0 - 6, (PY0 + PY1) / 2); g.lineTo(PX1 + 8, (PY0 + PY1) / 2); g.stroke();
      g.beginPath(); g.moveTo(PX0, PY0 + 8); g.lineTo(PX0, PY1 - 10); g.stroke();
      g.fillStyle = '#64748B'; g.font = '11px sans-serif';
      g.textAlign = 'left'; g.fillText('ℇ', PX0 + 4, PY1 - 2);
      g.textAlign = 'right'; g.fillText('t', PX1 + 6, (PY0 + PY1) / 2 + 14);
      g.fillText('ℇ_m = ' + em.toFixed(1) + ' V', PX0 - 8, y2px(em) + 4);
      g.fillText('−ℇ_m', PX0 - 8, y2px(-em) + 4);
      g.textAlign = 'center';
      g.fillText('T', x2px(T), (PY0 + PY1) / 2 + 14);
      g.fillText('2T', x2px(2 * T), (PY0 + PY1) / 2 + 14);
      /* 正弦曲线 */
      g.strokeStyle = '#1D4ED8'; g.lineWidth = 2.2;
      g.beginPath();
      for (var k = 0; k <= 200; k++) {
        var t = 2 * T * k / 200;
        var x = x2px(t), y = y2px(emf(t));
        if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
      /* 当前时刻红点（模 2T） */
      var tt = state.t % (2 * T);
      g.fillStyle = '#DC2626';
      g.beginPath(); g.arc(x2px(tt), y2px(emf(tt)), 4.5, 0, Math.PI * 2); g.fill();
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      drawCoil();
      drawPlot();
      document.getElementById('em-emax').textContent = 'ℇₘ = ' + emax().toFixed(1) + ' V';
      document.getElementById('em-omega').textContent = 'ω = ' + omega().toFixed(1) + ' rad/s';
      document.getElementById('em-now').textContent = 'ℇ = ' + emf(state.t).toFixed(1) + ' V';
      document.getElementById('em-flux').textContent = 'NΦ = ' + flux(state.t).toFixed(2) + ' Wb';
      document.getElementById('em-n-val').textContent = state.n;
      document.getElementById('em-b-val').textContent = state.b.toFixed(2);
      document.getElementById('em-f-val').textContent = state.f.toFixed(1);
    }

    panel.querySelector('#em-n').addEventListener('input', function () {
      state.n = Number(this.value); draw();
    });
    panel.querySelector('#em-b').addEventListener('input', function () {
      state.b = Number(this.value); draw();
    });
    panel.querySelector('#em-f').addEventListener('input', function () {
      state.f = Number(this.value); draw();
    });

    draw();   /* 初始即填充全部读数（自检脚本无交互读取） */

    /* 动画：仅重绘画布，读数随动 */
    setInterval(function () {
      state.t += 0.03;
      draw();
    }, 30);
  }

  return { init: init };
})();
