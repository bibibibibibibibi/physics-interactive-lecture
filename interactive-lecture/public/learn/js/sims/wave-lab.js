/* ============================================================
 * sims/wave-lab.js — 波动实验室：行波传播 ↔ 驻波（第 10 章核心仿真）
 * 模型：
 *   行波 y = A·cos(ωt − kx)（波形整体向右平移，u = ω/k = λν）
 *   驻波 y = 2A·cos(kx)·cos(ωt)（波形不传播，标出波节/波腹）
 * 规范（5.3）：坐标几何固定（窗口恒为 2λ₀=4 m，只动物理量曲线）；
 *       读数初始即填充（自检脚本无交互读取 #wv-u）。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['wave-lab'] = (function () {
  'use strict';

  var W = 640, H = 400;
  var GX0 = 40, GX1 = 620, GCY = 200;        /* 波形区（x 轴居中） */
  var XSPAN = 4.0;                            /* 窗口恒对应 4 m（= 2λ₀，λ₀ = 2 m 基准） */
  var AMP0 = 110;                             /* A = 1 m 对应像素幅度 */

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { A: 0.6, lambda: 2.0, mode: 'travel' };  /* mode: travel | stand */
    var NU = 1.0;                                          /* 频率固定 ν = 1 Hz */
    var t = 0, running = true, raf = null, lastTs = 0;

    panel.innerHTML =
      '<div class="sim-btnrow">' +
      '<button type="button" id="wv-travel" class="on">行波（波形传播）</button>' +
      '<button type="button" id="wv-stand">驻波（波形不传播）</button>' +
      '</div>' +
      '<label>振幅 A = <span id="wv-a-val">0.60</span> m</label>' +
      '<input type="range" id="wv-a" min="0.2" max="1.0" step="0.05" value="0.6">' +
      '<label>波长 λ = <span id="wv-l-val">2.00</span> m</label>' +
      '<input type="range" id="wv-l" min="1" max="4" step="0.1" value="2">' +
      '<div class="sim-btnrow">' +
      '<button type="button" id="wv-toggle" class="on">⏸ 暂停</button>' +
      '<button type="button" id="wv-reset">复位 t = 0</button>' +
      '</div>' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>波速 u = λν</span><span class="val" id="wv-u">—</span></div>' +
      '<div class="row"><span>角频率 ω = 2πν</span><span class="val" id="wv-w">—</span></div>' +
      '<div class="row"><span>波数 k = 2π/λ</span><span class="val" id="wv-k">—</span></div>' +
      '<div class="row"><span>当前模式</span><span class="val" id="wv-mode">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：行波模式看同一相位（红点）以 u 右移，' +
      '波形平移而质元只在原地振动；驻波模式看波节（红点）始终不动、波腹（蓝点）振幅最大，' +
      '相邻波节间距恒为 λ/2</label>';

    /* ---- 物理量 ---- */
    function k() { return 2 * Math.PI / state.lambda; }
    function omega() { return 2 * Math.PI * NU; }
    function speed() { return state.lambda * NU; }
    function x2px(x) { return GX0 + (GX1 - GX0) * x / XSPAN; }
    function y2px(y) { return GCY - y * AMP0; }

    /* ---- 画面 ---- */
    function draw() {
      g.clearRect(0, 0, W, H);
      var kk = k(), ww = omega();

      /* 坐标轴 */
      g.strokeStyle = '#94A3B8'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(GX0 - 10, GCY); g.lineTo(GX1 + 6, GCY); g.stroke();
      g.beginPath(); g.moveTo(GX0, GCY - AMP0 - 20); g.lineTo(GX0, GCY + AMP0 + 20); g.stroke();
      g.fillStyle = '#64748B'; g.font = '11px sans-serif'; g.textAlign = 'left';
      g.fillText('y', GX0 + 4, GCY - AMP0 - 8);
      g.fillText('x / m', GX1 - 26, GCY + 16);
      /* x 刻度（每 1 m） */
      g.textAlign = 'center';
      for (var xi = 0; xi <= XSPAN; xi++) {
        var px = x2px(xi);
        g.beginPath(); g.moveTo(px, GCY - 3); g.lineTo(px, GCY + 3); g.stroke();
        g.fillText(String(xi), px, GCY + 16);
      }
      /* ±A 参考虚线 */
      g.strokeStyle = '#E2E8F0'; g.setLineDash([4, 4]);
      [-1, 1].forEach(function (s) {
        g.beginPath(); g.moveTo(GX0, y2px(s * state.A)); g.lineTo(GX1, y2px(s * state.A)); g.stroke();
      });
      g.setLineDash([]);

      var steps = 400, i, x, y;
      if (state.mode === 'travel') {
        /* 行波：y = A·cos(ωt − kx)，整窗右移 */
        g.strokeStyle = '#2563EB'; g.lineWidth = 2.4; g.beginPath();
        for (i = 0; i <= steps; i++) {
          x = XSPAN * i / steps;
          y = state.A * Math.cos(ww * t - kk * x);
          if (i === 0) g.moveTo(x2px(x), y2px(y)); else g.lineTo(x2px(x), y2px(y));
        }
        g.stroke();
        /* 追踪同一相位（红点）：x_p = (ωt mod 2π)/k，即波峰位置 */
        var ph = (ww * t) % (2 * Math.PI);
        var xp = ph / kk;
        while (xp - state.lambda >= 0) xp -= state.lambda;
        for (var m = 0; m * state.lambda + xp <= XSPAN; m++) {
          var xx = xp + m * state.lambda;
          g.fillStyle = '#DC2626';
          g.beginPath(); g.arc(x2px(xx), y2px(state.A * Math.cos(ww * t - kk * xx)), 5, 0, Math.PI * 2); g.fill();
        }
        /* 波速箭头 */
        g.strokeStyle = '#059669'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(W - 150, 40); g.lineTo(W - 90, 40); g.stroke();
        g.beginPath(); g.moveTo(W - 90, 40); g.lineTo(W - 98, 35); g.lineTo(W - 98, 45); g.closePath();
        g.fillStyle = '#059669'; g.fill();
        g.font = '12px sans-serif'; g.textAlign = 'left';
        g.fillText('u', W - 84, 44);
        g.fillStyle = '#64748B'; g.font = '11px sans-serif';
        g.fillText('红点 = 同一相位（波峰），以波速 u 右移', GX0 + 4, 24);
      } else {
        /* 驻波：y = 2A·cos(kx)·cos(ωt) */
        var env = function (x) { return 2 * state.A * Math.cos(kk * x); };
        /* 包络虚线 */
        g.strokeStyle = '#CBD5E1'; g.lineWidth = 1.2; g.setLineDash([5, 4]);
        [1, -1].forEach(function (s) {
          g.beginPath();
          for (i = 0; i <= steps; i++) {
            x = XSPAN * i / steps;
            y = s * Math.abs(2 * state.A * Math.cos(kk * x));
            if (i === 0) g.moveTo(x2px(x), y2px(y)); else g.lineTo(x2px(x), y2px(y));
          }
          g.stroke();
        });
        g.setLineDash([]);
        /* 瞬时波形 */
        g.strokeStyle = '#2563EB'; g.lineWidth = 2.4; g.beginPath();
        for (i = 0; i <= steps; i++) {
          x = XSPAN * i / steps;
          y = env(x) * Math.cos(ww * t);
          if (i === 0) g.moveTo(x2px(x), y2px(y)); else g.lineTo(x2px(x), y2px(y));
        }
        g.stroke();
        /* 波节（红）波腹（蓝） */
        var n;
        for (n = 0; ; n++) {
          var xn = (2 * n + 1) * state.lambda / 4;      /* cos(kx)=0 → 波节 */
          if (xn > XSPAN + 1e-9) break;
          g.fillStyle = '#DC2626';
          g.beginPath(); g.arc(x2px(xn), GCY, 5, 0, Math.PI * 2); g.fill();
        }
        for (n = 0; ; n++) {
          var xa = n * state.lambda / 2;                /* |cos(kx)|=1 → 波腹 */
          if (xa > XSPAN + 1e-9) break;
          g.fillStyle = '#2563EB';
          g.beginPath(); g.arc(x2px(xa), y2px(env(xa) * Math.cos(ww * t)), 5, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = '#64748B'; g.font = '11px sans-serif'; g.textAlign = 'left';
        g.fillText('红点 = 波节（不动）　蓝点 = 波腹（振幅 2A）　相邻波节间距 λ/2', GX0 + 4, 24);
      }

      /* 读数 */
      setT('wv-u', 'u = ' + speed().toFixed(2) + ' m/s');
      setT('wv-w', 'ω = ' + omega().toFixed(2) + ' rad/s');
      setT('wv-k', 'k = ' + k().toFixed(2) + ' rad/m');
      setT('wv-mode', state.mode === 'travel' ? '行波' : '驻波');
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
    bind('wv-a', 'A', 'wv-a-val', function (v) { return v.toFixed(2); });
    bind('wv-l', 'lambda', 'wv-l-val', function (v) { return v.toFixed(2); });

    function setMode(m) {
      state.mode = m;
      var bt = document.getElementById('wv-travel');
      var bs = document.getElementById('wv-stand');
      if (bt) bt.classList.toggle('on', m === 'travel');
      if (bs) bs.classList.toggle('on', m === 'stand');
      draw();
    }
    var bt = document.getElementById('wv-travel');
    if (bt) bt.addEventListener('click', function () { setMode('travel'); });
    var bs = document.getElementById('wv-stand');
    if (bs) bs.addEventListener('click', function () { setMode('stand'); });

    var tog = document.getElementById('wv-toggle');
    if (tog) tog.addEventListener('click', function () {
      running = !running;
      tog.textContent = running ? '⏸ 暂停' : '▶ 继续';
      tog.classList.toggle('on', running);
    });
    var rst = document.getElementById('wv-reset');
    if (rst) rst.addEventListener('click', function () { t = 0; draw(); });

    draw();  /* 读数初始即填充 */
    if (window.requestAnimationFrame) {
      raf = window.requestAnimationFrame(loop);
    }
  }

  return { init: init };
})();
