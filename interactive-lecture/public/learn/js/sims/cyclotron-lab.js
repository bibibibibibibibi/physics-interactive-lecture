/* ============================================================
 * sims/cyclotron-lab.js — 回旋运动实验室（第 7 章核心仿真）
 * 模型：均匀磁场 B（垂直纸面向里）中，带电粒子以速率 v 射入，
 *   回旋半径 R = mv/(qB)（v⊥B 时），回旋周期 T = 2πm/(qB) 与速率无关；
 *   v 与 B 成 θ 角时：R = mv·sinθ/(qB)，平行分量使轨迹成为螺旋线，
 *   螺距 h = v·cosθ·T。
 * 画布：左侧磁场区（⊗）+ 圆周径迹（正电荷逆时针、负电荷顺时针）；
 *   右侧 R–v 关系直线（过原点，斜率 m/(qB)），当前点为红色标记。
 * 规范（5.3）：坐标几何固定（右图横轴恒 0~5×10⁷ m/s，纵轴随粒子
 *   挡位取固定量程），只动曲线与标记点；读数初始即填充（#cy-r）。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['cyclotron-lab'] = (function () {
  'use strict';

  var W = 640, H = 400;
  /* 左：磁场区；右：R–v 图 */
  var BX0 = 20, BX1 = 330, BY0 = 30, BY1 = 370;      /* 磁场区 */
  var PX0 = 375, PX1 = 625, PY0 = 340, PY1 = 50;     /* 右图 */
  var E = 1.60e-19;

  /* 粒子挡位：q/m 与右图 R 量程（v = 5×10⁷、B = 0.1 时的 R 上界） */
  var PARTICLES = {
    electron: { name: '电子',   q: -E,     m: 9.11e-31, rmax: 0.03  },
    proton:   { name: '质子',   q: E,      m: 1.67e-27, rmax: 5.5   },
    alpha:    { name: 'α 粒子', q: 2 * E,  m: 6.64e-27, rmax: 11    }
  };

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { p: 'proton', v: 2.0, b: 1.0, th: 0 };   /* v: ×10⁷ m/s, b: T, th: ° */

    panel.innerHTML =
      '<label>粒子</label>' +
      '<select id="cy-preset">' +
      '<option value="electron">电子（−e，9.11×10⁻³¹ kg）</option>' +
      '<option value="proton" selected>质子（+e，1.67×10⁻²⁷ kg）</option>' +
      '<option value="alpha">α 粒子（+2e，6.64×10⁻²⁷ kg）</option>' +
      '</select>' +
      '<label>速率 v = <span id="cy-v-val">2.0</span> ×10⁷ m/s</label>' +
      '<input type="range" id="cy-v" min="0.5" max="5" step="0.1" value="2.0">' +
      '<label>磁感强度 B = <span id="cy-b-val">1.0</span> T</label>' +
      '<input type="range" id="cy-b" min="0.1" max="2" step="0.1" value="1.0">' +
      '<label>v 与 B 夹角 θ = <span id="cy-th-val">0</span>°（0° = 纯圆周，&gt;0° = 螺旋线）</label>' +
      '<input type="range" id="cy-th" min="0" max="80" step="5" value="0">' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>回旋半径</span><span class="val" id="cy-r">—</span></div>' +
      '<div class="row"><span>回旋周期</span><span class="val" id="cy-t">—</span></div>' +
      '<div class="row"><span>回旋频率</span><span class="val" id="cy-f">—</span></div>' +
      '<div class="row"><span>螺旋螺距</span><span class="val" id="cy-h">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：R 随 v 线性增大、随 B 反比减小；' +
      'T = 2πm/(qB) 与速率无关——回旋加速器据此用固定频率的交变电场反复加速粒子</label>';

    function pt() { return PARTICLES[state.p]; }
    function Rreal() { /* θ = 0 时 v 全部垂直于 B */
      var vp = state.v * 1e7 * (state.th === 0 ? 1 : Math.sin(state.th * Math.PI / 180));
      return pt().m * vp / (Math.abs(pt().q) * state.b);
    }
    function Treal() { return 2 * Math.PI * pt().m / (Math.abs(pt().q) * state.b); }
    function x2px(x) { return PX0 + (PX1 - PX0) * x / 5; }
    function y2px(r) { return PY0 - (PY0 - PY1) * r / pt().rmax; }
    function fmtR(r) { return r < 0.01 ? (r * 1e3).toFixed(2) + ' mm' : r.toFixed(3) + ' m'; }

    /* ---- 左侧：磁场区 + 圆周径迹 ---- */
    function drawField() {
      g.strokeStyle = '#94A3B8'; g.lineWidth = 1.2;
      g.strokeRect(BX0, BY0, BX1 - BX0, BY1 - BY0);
      g.strokeStyle = '#CBD5E1'; g.lineWidth = 1;
      for (var gx = BX0 + 25; gx < BX1 - 10; gx += 34) {
        for (var gy = BY0 + 25; gy < BY1 - 10; gy += 34) {
          g.beginPath();
          g.moveTo(gx - 5, gy - 5); g.lineTo(gx + 5, gy + 5);
          g.moveTo(gx - 5, gy + 5); g.lineTo(gx + 5, gy - 5);
          g.stroke();
        }
      }
      g.fillStyle = '#64748B'; g.font = '12px sans-serif'; g.textAlign = 'left';
      g.fillText('B ⊗（向里）', BX0 + 8, BY0 + 18);

      /* 入射点与径迹圆 */
      var x0 = (BX0 + BX1) / 2, y0 = BY1 - 45;
      var scale = 130 / pt().rmax;               /* px/m，量程固定 */
      var rp = Math.min(Rreal() * scale, 300);
      var neg = pt().q < 0;
      var cx = neg ? x0 + rp : x0 - rp;          /* 负电荷向右弯（顺时针） */
      g.strokeStyle = '#1D4ED8'; g.lineWidth = 2.2;
      g.beginPath(); g.arc(cx, y0, rp, 0, Math.PI * 2); g.stroke();
      /* 入射速度箭头（向上） */
      g.strokeStyle = '#DC2626'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 - 42); g.stroke();
      g.beginPath(); g.moveTo(x0, y0 - 42); g.lineTo(x0 - 5, y0 - 32);
      g.moveTo(x0, y0 - 42); g.lineTo(x0 + 5, y0 - 32); g.stroke();
      g.fillStyle = '#DC2626'; g.font = '12px sans-serif'; g.textAlign = 'left';
      g.fillText('v', x0 + 8, y0 - 36);
      g.fillStyle = '#334155';
      g.beginPath(); g.arc(x0, y0, 4, 0, Math.PI * 2); g.fill();
      /* 圆心与半径线 */
      g.strokeStyle = '#94A3B8'; g.setLineDash([4, 4]);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(cx, y0); g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#64748B'; g.textAlign = 'center';
      g.fillText('R', (x0 + cx) / 2, y0 + 15);
      g.fillText(pt().name + (neg ? '：顺时针回旋' : '：逆时针回旋'), (BX0 + BX1) / 2, BY0 + 40);
      if (state.th > 0) {
        g.fillStyle = '#B45309'; g.font = '11px sans-serif';
        g.fillText('θ > 0：平行分量 v·cosθ 不受磁场影响，', (BX0 + BX1) / 2, BY1 - 22);
        g.fillText('实际轨迹为螺旋线（图中圆为回旋截面）', (BX0 + BX1) / 2, BY1 - 8);
      }
    }

    /* ---- 右侧：R–v 直线（斜率 m·sinθ/(qB)） ---- */
    function drawPlot() {
      g.strokeStyle = '#94A3B8'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(PX0, PY1 - 8); g.lineTo(PX0, PY0 + 6); g.stroke();
      g.beginPath(); g.moveTo(PX0 - 6, PY0); g.lineTo(PX1 + 8, PY0); g.stroke();
      g.fillStyle = '#64748B'; g.font = '11px sans-serif';
      g.textAlign = 'left'; g.fillText('R', PX0 + 4, PY1 - 2);
      g.textAlign = 'right'; g.fillText('v /(10⁷ m/s)', PX1 + 4, PY0 + 16);
      g.textAlign = 'center';
      for (var k = 1; k <= 5; k++) {
        var px = x2px(k);
        g.beginPath(); g.moveTo(px, PY0 - 3); g.lineTo(px, PY0 + 3); g.stroke();
        g.fillText(String(k), px, PY0 + 14);
      }
      g.textAlign = 'right';
      var rm = pt().rmax;
      g.fillText(fmtR(rm), PX0 - 8, y2px(rm) + 4);
      g.fillText(fmtR(rm / 2), PX0 - 8, y2px(rm / 2) + 4);
      /* R = m·sinθ·v/(qB)：过原点直线 */
      var slope = pt().m * (state.th === 0 ? 1 : Math.sin(state.th * Math.PI / 180)) /
                  (Math.abs(pt().q) * state.b);
      g.strokeStyle = '#1D4ED8'; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(x2px(0), y2px(0));
      g.lineTo(x2px(5), y2px(slope * 5e7));
      g.stroke();
      /* 当前点 */
      var mx = x2px(state.v), my = y2px(Rreal());
      g.fillStyle = '#DC2626';
      g.beginPath(); g.arc(mx, my, 4.5, 0, Math.PI * 2); g.fill();
      g.font = '11px sans-serif'; g.textAlign = 'left';
      g.fillText(fmtR(Rreal()), mx + 7, my - 6);
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      drawField();
      drawPlot();
      document.getElementById('cy-r').textContent = 'R = ' + fmtR(Rreal());
      document.getElementById('cy-t').textContent = 'T = ' + Treal().toExponential(2).replace('e', '×10^') + ' s';
      document.getElementById('cy-f').textContent = 'f = ' + (1 / Treal()).toExponential(2).replace('e', '×10^') + ' Hz';
      document.getElementById('cy-h').textContent = state.th > 0
        ? 'h = ' + fmtR(state.v * 1e7 * Math.cos(state.th * Math.PI / 180) * Treal())
        : 'h = 0（纯圆周）';
      document.getElementById('cy-v-val').textContent = state.v.toFixed(1);
      document.getElementById('cy-b-val').textContent = state.b.toFixed(1);
      document.getElementById('cy-th-val').textContent = state.th;
    }

    panel.querySelector('#cy-preset').addEventListener('change', function () {
      state.p = this.value; draw();
    });
    panel.querySelector('#cy-v').addEventListener('input', function () {
      state.v = Number(this.value); draw();
    });
    panel.querySelector('#cy-b').addEventListener('input', function () {
      state.b = Number(this.value); draw();
    });
    panel.querySelector('#cy-th').addEventListener('input', function () {
      state.th = Number(this.value); draw();
    });

    draw();   /* 初始即填充全部读数（自检脚本无交互读取） */
  }

  return { init: init };
})();
