/* ============================================================
 * sims/rc-lab.js — RC 充放电实验室（第 6 章核心仿真）
 * 模型：充电 q = q₀(1−e^(−t/τ))，放电 q = q₀e^(−t/τ)，τ = RC
 *   q₀ = Cℇ（充电渐近值），I₀ = ℇ/R（充电）或 U₀/R（放电）
 * 左：RC 电路示意（电源/开关/电阻/电容，极板电荷随 q 填充）
 * 右：q–t 曲线（充/放电两模式），时间滑块逐点读取，τ 处标注 63%/37%
 * 规范（5.3）：坐标几何固定（横轴恒 0~5τ，纵轴恒 0~q₀），只动曲线与标记点；
 *       读数初始即填充（自检脚本无交互读取 #rc-tau）。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['rc-lab'] = (function () {
  'use strict';

  var W = 640, H = 400;
  /* 右图坐标：t/τ ∈ [0, 5]，q/q₀ ∈ [0, 1.1] */
  var PX0 = 355, PX1 = 625, PY0 = 330, PY1 = 40;
  var EMF = 12;   /* 电源电动势 ℇ / V（固定，只改变 R、C） */

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    /* R / kΩ，C / μF，t / s（滑块按 τ 的倍数 0~5），mode: charge/discharge */
    var state = { r: 10, c: 10, tq: 1.0, mode: 'charge' };

    panel.innerHTML =
      '<div class="sim-btnrow">' +
      '<button type="button" id="rc-mode-c" class="on">充电（接电源 ℇ = 12 V）</button>' +
      '<button type="button" id="rc-mode-d">放电（断开电源，经 R 释放）</button>' +
      '</div>' +
      '<label>电阻 R = <span id="rc-r-val">10</span> kΩ</label>' +
      '<input type="range" id="rc-r" min="1" max="100" step="1" value="10">' +
      '<label>电容 C = <span id="rc-c-val">10</span> μF</label>' +
      '<input type="range" id="rc-c" min="1" max="100" step="1" value="10">' +
      '<label>观察时刻 t = <span id="rc-t-val">1.0</span> τ</label>' +
      '<input type="range" id="rc-t" min="0" max="5" step="0.1" value="1.0">' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>时间常量</span><span class="val" id="rc-tau">—</span></div>' +
      '<div class="row"><span>极板电荷</span><span class="val" id="rc-q">—</span></div>' +
      '<div class="row"><span>电路电流</span><span class="val" id="rc-i">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：τ = RC 由 R、C 共同决定；' +
      't = τ 时充电达 63%、放电剩 37%；t = (3~5)τ 即可认为过程结束（对照教材表 6-3）</label>';

    function TAU() { return state.r * state.c * 1e-3; }                    /* s */
    function q0() { return state.c * 1e-6 * EMF; }                         /* C */
    function frac() {  /* 当前时刻的 q/q0 */
      var x = state.tq;
      return state.mode === 'charge' ? 1 - Math.exp(-x) : Math.exp(-x);
    }
    function iNow() {  /* A */
      var x = state.tq;
      var i0 = EMF / (state.r * 1e3);
      return i0 * Math.exp(-x);
    }
    function x2px(x) { return PX0 + (PX1 - PX0) * x / 5; }
    function y2px(f) { return PY0 - (PY0 - PY1) * f / 1.1; }

    /* ---- 左侧：RC 电路示意 ---- */
    function drawCircuit() {
      var cx = 165, top = 70, bot = 300;
      g.strokeStyle = '#334155'; g.lineWidth = 2;
      /* 外框回路 */
      g.beginPath();
      g.moveTo(60, top); g.lineTo(270, top);          /* 顶边 */
      g.moveTo(60, bot); g.lineTo(270, bot);          /* 底边 */
      g.moveTo(60, top); g.lineTo(60, bot);           /* 左边 */
      g.moveTo(270, top); g.lineTo(270, bot);         /* 右边 */
      g.stroke();
      /* 电源（左，充电模式）或短接（放电模式） */
      if (state.mode === 'charge') {
        g.beginPath(); g.moveTo(52, 150); g.lineTo(68, 150); g.stroke();       /* 长 */
        g.lineWidth = 4; g.beginPath(); g.moveTo(55, 165); g.lineTo(65, 165); g.stroke();
        g.lineWidth = 2;
        g.fillStyle = '#334155'; g.font = '12px sans-serif'; g.textAlign = 'right';
        g.fillText('ℇ', 46, 160);
        /* 断开缺口示意：顶边开关 */
      } else {
        g.strokeStyle = '#94A3B8';
        g.beginPath(); g.moveTo(52, 157); g.lineTo(68, 157); g.stroke();
        g.strokeStyle = '#334155';
        g.fillStyle = '#64748B'; g.font = '11px sans-serif'; g.textAlign = 'right';
        g.fillText('短接', 46, 160);
      }
      /* 开关 S（顶边） */
      g.beginPath(); g.arc(105, top, 3, 0, Math.PI * 2); g.fillStyle = '#334155'; g.fill();
      g.beginPath(); g.arc(145, top, 3, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(105, top); g.lineTo(142, top - 16); g.stroke();
      g.font = '12px sans-serif'; g.textAlign = 'center';
      g.fillText('S', 125, top - 22);
      /* 电阻 R（顶边右侧锯齿） */
      g.beginPath();
      var rx0 = 190, rx1 = 240, n = 6, amp = 7;
      g.moveTo(rx0, top);
      for (var i = 0; i < n; i++) {
        g.lineTo(rx0 + (rx1 - rx0) * (i + 0.5) / n, top + (i % 2 ? amp : -amp));
      }
      g.lineTo(rx1, top); g.stroke();
      g.fillText('R', 215, top - 16);
      /* 电容 C（右边） */
      g.lineWidth = 3.5;
      g.beginPath(); g.moveTo(258, 168); g.lineTo(282, 168); g.stroke();
      g.beginPath(); g.moveTo(258, 184); g.lineTo(282, 184); g.stroke();
      g.lineWidth = 2;
      g.fillText('C', 292, 180);
      /* 极板电荷随 q 填充 */
      var f = frac();
      g.fillStyle = 'rgba(220,38,38,' + (0.15 + 0.65 * f) + ')';
      g.font = 'bold 13px sans-serif';
      g.fillText('+' , 250, 172);
      g.fillText('−', 250, 192);
      g.font = '11px sans-serif'; g.fillStyle = '#DC2626'; g.textAlign = 'left';
      g.fillText('q = ' + Math.round(f * 100) + '% q₀', 210, 210);
      /* 电流方向箭头 */
      if (state.tq < 4.8) {
        g.strokeStyle = '#047857'; g.lineWidth = 2;
        var dir = state.mode === 'charge' ? 1 : -1;   /* 充电顺时针 */
        var ay = 250;
        g.beginPath(); g.moveTo(100 - 12 * dir, ay); g.lineTo(100 + 12 * dir, ay); g.stroke();
        g.beginPath();
        g.moveTo(100 + 12 * dir, ay);
        g.lineTo(100 + 5 * dir, ay - 4); g.moveTo(100 + 12 * dir, ay); g.lineTo(100 + 5 * dir, ay + 4);
        g.stroke();
        g.fillStyle = '#047857'; g.font = '11px sans-serif'; g.textAlign = 'center';
        g.fillText('I', 100, ay + 16);
      }
      g.fillStyle = '#64748B'; g.font = '11px sans-serif'; g.textAlign = 'center';
      g.fillText(state.mode === 'charge' ? '充电回路：ℇ → R → C' : '放电回路：C → R（电流反向）',
                 cx, 345);
    }

    /* ---- 右侧：q–t 曲线 ---- */
    function drawPlot() {
      g.strokeStyle = '#94A3B8'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(PX0, PY1 - 8); g.lineTo(PX0, PY0 + 6); g.stroke();
      g.beginPath(); g.moveTo(PX0 - 6, PY0); g.lineTo(PX1 + 8, PY0); g.stroke();
      g.fillStyle = '#64748B'; g.font = '11px sans-serif';
      g.textAlign = 'left'; g.fillText('q/q₀', PX0 + 4, PY1 - 2);
      g.textAlign = 'right'; g.fillText('t/τ', PX1 + 4, PY0 + 16);
      /* 刻度：x 每 1τ，y 标 0.37/0.63/1.0 */
      g.textAlign = 'center';
      for (var k = 1; k <= 5; k++) {
        var px = x2px(k);
        g.beginPath(); g.moveTo(px, PY0 - 3); g.lineTo(px, PY0 + 3); g.stroke();
        g.fillText(k === 1 ? 'τ' : String(k) + 'τ', px, PY0 + 14);
      }
      g.textAlign = 'right';
      g.fillText('1.0', PX0 - 8, y2px(1.0) + 4);
      g.fillText('0.63', PX0 - 8, y2px(0.632) + 4);
      g.fillText('0.37', PX0 - 8, y2px(0.368) + 4);
      /* 渐近线（充电 q0 / 放电 0）与 τ 参考线 */
      g.strokeStyle = '#CBD5E1'; g.setLineDash([4, 4]);
      if (state.mode === 'charge') {
        g.beginPath(); g.moveTo(PX0, y2px(1)); g.lineTo(PX1, y2px(1)); g.stroke();
      }
      g.beginPath(); g.moveTo(x2px(1), PY0); g.lineTo(x2px(1), y2px(1.02)); g.stroke();
      g.setLineDash([]);
      /* 曲线 */
      g.strokeStyle = '#1D4ED8'; g.lineWidth = 2.2;
      g.beginPath();
      for (var s = 0; s <= 100; s++) {
        var x = s * 5 / 100;
        var f = state.mode === 'charge' ? 1 - Math.exp(-x) : Math.exp(-x);
        var px = x2px(x), py = y2px(f);
        if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.stroke();
      /* 当前时刻标记 */
      var fx = frac();
      var mx = x2px(state.tq), my = y2px(fx);
      g.strokeStyle = '#DC2626'; g.setLineDash([3, 3]); g.lineWidth = 1;
      g.beginPath(); g.moveTo(mx, PY0); g.lineTo(mx, my); g.stroke();
      g.beginPath(); g.moveTo(PX0, my); g.lineTo(mx, my); g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#DC2626';
      g.beginPath(); g.arc(mx, my, 4.5, 0, Math.PI * 2); g.fill();
      g.font = '11px sans-serif'; g.textAlign = 'left';
      g.fillText((fx * 100).toFixed(1) + '%', mx + 7, my - 6);
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      drawCircuit();
      drawPlot();
      /* 读数 */
      document.getElementById('rc-tau').textContent = 'τ = ' + TAU().toFixed(3) + ' s';
      document.getElementById('rc-q').textContent =
        'q = ' + (frac() * 100).toFixed(1) + ' % q₀（q₀ = ' +
        (q0() * 1e6).toFixed(0) + ' μC）';
      document.getElementById('rc-i').textContent =
        'I = ' + (iNow() * 1e3).toFixed(2) + ' mA' +
        (state.mode === 'discharge' ? '（与充电反向）' : '');
      document.getElementById('rc-r-val').textContent = state.r;
      document.getElementById('rc-c-val').textContent = state.c;
      document.getElementById('rc-t-val').textContent = state.tq.toFixed(1);
    }

    panel.querySelector('#rc-r').addEventListener('input', function () {
      state.r = Number(this.value); draw();
    });
    panel.querySelector('#rc-c').addEventListener('input', function () {
      state.c = Number(this.value); draw();
    });
    panel.querySelector('#rc-t').addEventListener('input', function () {
      state.tq = Number(this.value); draw();
    });
    panel.querySelector('#rc-mode-c').addEventListener('click', function () {
      state.mode = 'charge';
      panel.querySelector('#rc-mode-c').classList.add('on');
      panel.querySelector('#rc-mode-d').classList.remove('on');
      draw();
    });
    panel.querySelector('#rc-mode-d').addEventListener('click', function () {
      state.mode = 'discharge';
      panel.querySelector('#rc-mode-d').classList.add('on');
      panel.querySelector('#rc-mode-c').classList.remove('on');
      draw();
    });

    draw();   /* 初始即填充全部读数（自检脚本无交互读取） */
  }

  return { init: init };
})();
