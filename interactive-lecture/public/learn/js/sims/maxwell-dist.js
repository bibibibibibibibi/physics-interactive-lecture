/* ============================================================
 * sims/maxwell-dist.js — 麦克斯韦速率分布曲线模拟器（第 12 章核心仿真）
 * 交互：温度 / 摩尔质量滑块，实时重画 f(v) 分布曲线，
 * 标出三种统计速率：最概然 v_p、平均 v̄、方均根 √(v²̄)。
 * 模型：f(v) = 4π (m/2πkT)^(3/2) · v² · exp(-mv²/2kT)
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['maxwell-dist'] = (function () {
  'use strict';

  var K = 1.381e-23;        /* 玻耳兹曼常量 J/K */
  var AMU = 1.66e-27;       /* 原子质量单位 kg */

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;

    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = 640; canvas.height = 400;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { T: 300, M: 32 };   /* T: K；M: g/mol（默认氧气） */

    panel.innerHTML =
      '<label>温度 T = <span id="mw-t-val">300</span> K</label>' +
      '<input type="range" id="mw-t" min="100" max="1200" step="10" value="300">' +
      '<label>摩尔质量 M = <span id="mw-m-val">32</span> g/mol（2=H₂ 16=CH₄ 28=N₂ 32=O₂ 44=CO₂）</label>' +
      '<input type="range" id="mw-m" min="2" max="44" step="1" value="32">' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>最概然速率 v_p</span><span class="val" id="mw-vp">—</span></div>' +
      '<div class="row"><span>平均速率 v̄</span><span class="val" id="mw-vavg">—</span></div>' +
      '<div class="row"><span>方均根速率 √v²̄</span><span class="val" id="mw-vrms">—</span></div>' +
      '</div>' +
      '<label style="margin-top:12px;color:#8B95A7">升高温度：曲线变矮变宽、峰值右移；增大分子质量：曲线变窄变高、峰值左移</label>';

    panel.querySelector('#mw-t').addEventListener('input', function (e) {
      state.T = Number(e.target.value);
      panel.querySelector('#mw-t-val').textContent = state.T;
      draw();
    });
    panel.querySelector('#mw-m').addEventListener('input', function (e) {
      state.M = Number(e.target.value);
      panel.querySelector('#mw-m-val').textContent = state.M;
      draw();
    });

    function speeds() {
      var m = state.M / 1000 / 6.022e23;   /* 单个分子质量 kg */
      var vp = Math.sqrt(2 * K * state.T / m);
      var vavg = Math.sqrt(8 * K * state.T / (Math.PI * m));
      var vrms = Math.sqrt(3 * K * state.T / m);
      return { vp: vp, vavg: vavg, vrms: vrms };
    }
    function f(v, m) {
      var a = m / (2 * Math.PI * K * state.T);
      return 4 * Math.PI * Math.pow(a, 1.5) * v * v * Math.exp(-m * v * v / (2 * K * state.T));
    }

    function draw() {
      var W = canvas.width, H = canvas.height;
      var padL = 56, padR = 16, padT = 18, padB = 42;
      var sp = speeds();
      var m = state.M / 1000 / 6.022e23;
      var vmax = Math.max(3.2 * sp.vrms, 500);
      var fmax = f(sp.vp, m);
      function X(v) { return padL + (W - padL - padR) * v / vmax; }
      function Y(fv) { return H - padB - (H - padT - padB) * fv / (fmax * 1.12); }

      g.clearRect(0, 0, W, H);

      /* 坐标轴与刻度 */
      g.strokeStyle = '#9AA3B2'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(padL, padT - 4); g.lineTo(padL, H - padB); g.lineTo(W - padR + 4, H - padB); g.stroke();
      g.fillStyle = '#5B6472'; g.font = '12px sans-serif'; g.textAlign = 'center';
      var step = vmax > 2400 ? 1000 : (vmax > 1200 ? 500 : 250);
      for (var v = step; v < vmax; v += step) {
        g.fillText(String(v), X(v), H - padB + 16);
        g.beginPath(); g.moveTo(X(v), H - padB); g.lineTo(X(v), H - padB + 4); g.stroke();
      }
      g.fillText('v / (m·s⁻¹)', (padL + W - padR) / 2, H - 8);
      g.save(); g.translate(14, (padT + H - padB) / 2); g.rotate(-Math.PI / 2);
      g.fillText('f(v)', 0, 0); g.restore();

      /* 分布曲线（填充） */
      g.beginPath(); g.moveTo(X(0), Y(0));
      for (var i = 0; i <= 240; i++) {
        var vv = vmax * i / 240;
        g.lineTo(X(vv), Y(f(vv, m)));
      }
      g.lineTo(X(vmax), Y(0)); g.closePath();
      g.fillStyle = 'rgba(239,68,68,.15)'; g.fill();
      g.beginPath();
      for (var j = 0; j <= 240; j++) {
        var v2 = vmax * j / 240;
        if (j === 0) g.moveTo(X(v2), Y(f(v2, m))); else g.lineTo(X(v2), Y(f(v2, m)));
      }
      g.strokeStyle = '#EF4444'; g.lineWidth = 2.5; g.stroke();

      /* 三种统计速率标记 */
      var marks = [
        { v: sp.vp, label: 'v_p', color: '#F59E0B', id: '#mw-vp' },
        { v: sp.vavg, label: 'v̄', color: '#3B82F6', id: '#mw-vavg' },
        { v: sp.vrms, label: '√v²̄', color: '#7C3AED', id: '#mw-vrms' }
      ];
      marks.forEach(function (mk, idx) {
        g.setLineDash([5, 4]);
        g.strokeStyle = mk.color; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(X(mk.v), Y(0)); g.lineTo(X(mk.v), Y(f(mk.v, m))); g.stroke();
        g.setLineDash([]);
        g.fillStyle = mk.color; g.font = 'bold 13px sans-serif';
        g.fillText(mk.label, X(mk.v), Y(f(mk.v, m)) - 8 - idx * 0);
        var el = panel.querySelector(mk.id);
        if (el) el.textContent = Math.round(mk.v) + ' m/s';
      });

      /* 曲线下面积恒为 1 的提示 */
      g.fillStyle = '#8B95A7'; g.font = '12px sans-serif'; g.textAlign = 'right';
      g.fillText('曲线下总面积 = 1（归一化）', W - padR - 4, padT + 10);
    }

    draw();
  }

  return { init: init };
})();
