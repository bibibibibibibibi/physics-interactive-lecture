/* ============================================================
 * sims/pe-lab.js — 光电效应实验室（第 15 章核心仿真）
 * 模型：爱因斯坦方程 hν = eU₀ + W
 *   遏止电势差 U₀ = (h/e)(ν − ν₀)，红限频率 ν₀ = W/h
 * 左：光电管电路示意（光窗 → 阴极 K → 阳极 A → 电压表）
 * 右：U₀–ν 直线（斜率 h/e，ν 轴截距即 ν₀；ν < ν₀ 时无光电子）
 * 规范（5.3）：坐标几何固定（ν 窗口恒 0~12×10¹⁴ Hz），只动物理量曲线；
 *       读数初始即填充（自检脚本无交互读取 #pe-u0）。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['pe-lab'] = (function () {
  'use strict';

  var W = 640, H = 400;
  /* 右图坐标：ν ∈ [0, 12e14 Hz]，U ∈ [−2.5, 3.5 V] */
  var PX0 = 350, PX1 = 625, PY0 = 330, PY1 = 30;
  var NU_MAX = 12e14, U_MIN = -2.5, U_MAX = 3.5;
  var H_C = 6.626e-34, E_C = 1.602e-19;
  /* 金属预设：逸出功 W / eV（教材常用数据） */
  var METALS = { na: { name: '钠', w: 2.29 }, zn: { name: '锌', w: 3.74 }, pt: { name: '铂', w: 6.35 } };

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { nu: 6.0, metal: 'na', w: METALS.na.w };   /* ν 单位 1e14 Hz，W 单位 eV */

    panel.innerHTML =
      '<div class="sim-btnrow">' +
      '<button type="button" id="pe-m-na" class="on">钠（W = 2.29 eV）</button>' +
      '<button type="button" id="pe-m-zn">锌（W = 3.74 eV）</button>' +
      '<button type="button" id="pe-m-pt">铂（W = 6.35 eV）</button>' +
      '</div>' +
      '<label>入射光频率 ν = <span id="pe-nu-val">6.00</span> ×10¹⁴ Hz</label>' +
      '<input type="range" id="pe-nu" min="0" max="12" step="0.1" value="6">' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>遏止电势差</span><span class="val" id="pe-u0">—</span></div>' +
      '<div class="row"><span>红限频率 ν₀ = W/h</span><span class="val" id="pe-nu0">—</span></div>' +
      '<div class="row"><span>光电子最大初动能</span><span class="val" id="pe-ek">—</span></div>' +
      '<div class="row"><span>当前状态</span><span class="val" id="pe-state">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：换金属（变逸出功 W）整条直线平移、' +
      '斜率 h/e 不变——这正是密立根实验验证爱因斯坦方程的关键；ν &lt; ν₀ 时无论光多强都没有光电子</label>';

    function nuHz() { return state.nu * 1e14; }
    function nu0() { return state.w * E_C / H_C; }          /* Hz */
    function u0() { return H_C * (nuHz() - nu0()) / E_C; }  /* V（可为负） */
    function x2px(nu14) { return PX0 + (PX1 - PX0) * nu14 / 12; }
    function y2px(u) { return PY0 - (PY0 - PY1) * (u - U_MIN) / (U_MAX - U_MIN); }

    /* ---- 左侧：光电管电路示意 ---- */
    function drawTube() {
      var cx = 165, cy = 175, R = 95;
      /* 玻璃管 */
      g.strokeStyle = '#94A3B8'; g.lineWidth = 2;
      g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
      /* 阴极 K（左侧受光面）、阳极 A（小圆） */
      g.strokeStyle = '#1D4ED8'; g.lineWidth = 4;
      g.beginPath(); g.arc(cx, cy, R * 0.62, Math.PI * 0.55, Math.PI * 1.45); g.stroke();
      g.fillStyle = '#1D4ED8';
      g.beginPath(); g.arc(cx + 22, cy, 9, 0, Math.PI * 2); g.fill();
      g.font = '12px sans-serif'; g.textAlign = 'center';
      g.fillStyle = '#334155';
      g.fillText('K（' + METALS[state.metal].name + '）', cx - 52, cy - 60);
      g.fillText('A', cx + 22, cy - 18);
      /* 入射光箭头（ν ≥ ν₀ 红/ν < ν₀ 灰） */
      var on = nuHz() >= nu0();
      g.strokeStyle = on ? '#DC2626' : '#CBD5E1'; g.lineWidth = 2.5;
      for (var i = -1; i <= 1; i++) {
        var y = cy + i * 26;
        g.beginPath(); g.moveTo(8, y - 10); g.lineTo(cx - 58, y); g.stroke();
        g.beginPath();
        g.moveTo(cx - 58, y); g.lineTo(cx - 68, y - 2); g.moveTo(cx - 58, y); g.lineTo(cx - 66, y - 10);
        g.stroke();
      }
      g.fillStyle = on ? '#DC2626' : '#94A3B8'; g.textAlign = 'left';
      g.fillText('hν', 12, cy - 52);
      /* 光电子（ν ≥ ν₀ 时从 K 飞向 A） */
      if (on) {
        g.fillStyle = '#047857';
        var ph = (Date.now() / 900) % 1;
        for (var k = 0; k < 3; k++) {
          var fx = cx - 40 + (62) * ((ph + k / 3) % 1);
          g.beginPath(); g.arc(fx, cy - 20 + k * 20, 3.2, 0, Math.PI * 2); g.fill();
        }
        g.font = '11px sans-serif'; g.textAlign = 'center';
        g.fillText('e⁻', cx + 40, cy + 34);
      }
      /* 外电路：K → 电压表 → A */
      g.strokeStyle = '#64748B'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(cx - 58, cy + 68); g.lineTo(cx - 58, 315); g.lineTo(cx + 22, 315);
      g.lineTo(cx + 22, cy + 9); g.stroke();
      g.strokeStyle = '#334155'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(cx - 18, 315, 13, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#334155'; g.font = '13px sans-serif';
      g.fillText('V', cx - 18, 319);
      g.font = '11px sans-serif'; g.fillStyle = '#64748B';
      g.fillText('反向电压表读数 = 遏止电势差 U₀', cx, 345);
    }

    /* ---- 右侧：U₀–ν 图 ---- */
    function drawPlot() {
      /* 轴 */
      g.strokeStyle = '#94A3B8'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(PX0, PY1 - 8); g.lineTo(PX0, PY0 + 6); g.stroke();
      g.beginPath(); g.moveTo(PX0 - 6, y2px(0)); g.lineTo(PX1 + 8, y2px(0)); g.stroke();
      g.fillStyle = '#64748B'; g.font = '11px sans-serif'; g.textAlign = 'left';
      g.fillText('U₀ / V', PX0 + 5, PY1 + 4);
      g.textAlign = 'right';
      g.fillText('ν /10¹⁴ Hz', PX1 + 4, y2px(0) + 18);
      /* ν 刻度（每 2）与 U 刻度（每 1 V） */
      g.textAlign = 'center';
      for (var n = 0; n <= 12; n += 2) {
        var px = x2px(n);
        g.beginPath(); g.moveTo(px, y2px(0) - 3); g.lineTo(px, y2px(0) + 3); g.stroke();
        g.fillText(String(n), px, y2px(0) + 15);
      }
      g.textAlign = 'right';
      for (var u = -2; u <= 3; u++) {
        var py = y2px(u);
        g.beginPath(); g.moveTo(PX0 - 3, py); g.lineTo(PX0 + 3, py); g.stroke();
        g.fillText(String(u), PX0 - 7, py + 4);
      }
      /* U₀ = (h/e)(ν−ν₀) 直线：ν 从 ν₀ 起 */
      var n0 = nu0() / 1e14;
      g.strokeStyle = '#1D4ED8'; g.lineWidth = 2.2;
      g.beginPath();
      var nEnd = 12;
      g.moveTo(x2px(n0), y2px(0));
      g.lineTo(x2px(nEnd), y2px(u0at(nEnd)));
      g.stroke();
      /* ν₀ 截距标记 */
      g.fillStyle = '#DC2626'; g.textAlign = 'center';
      g.beginPath(); g.arc(x2px(n0), y2px(0), 4, 0, Math.PI * 2); g.fill();
      g.fillText('ν₀', x2px(n0), y2px(0) - 10);
      /* 斜率说明 */
      g.fillStyle = '#64748B'; g.textAlign = 'left';
      g.fillText('斜率 = h/e（与金属种类无关）', PX0 + 12, PY1 + 22);
      /* 当前点 */
      var cur = u0();
      if (cur >= 0) {
        g.fillStyle = '#DC2626';
        g.beginPath(); g.arc(x2px(state.nu), y2px(Math.min(cur, U_MAX)), 6, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#DC2626'; g.setLineDash([4, 4]); g.lineWidth = 1;
        g.beginPath(); g.moveTo(x2px(state.nu), y2px(Math.min(cur, U_MAX)));
        g.lineTo(x2px(state.nu), y2px(0)); g.stroke();
        g.setLineDash([]);
      } else {
        /* ν < ν₀：ν 轴上画 ×，标注无光电子 */
        g.strokeStyle = '#94A3B8'; g.lineWidth = 2.4;
        var xx = x2px(state.nu), yy = y2px(0);
        g.beginPath(); g.moveTo(xx - 6, yy - 6); g.lineTo(xx + 6, yy + 6);
        g.moveTo(xx + 6, yy - 6); g.lineTo(xx - 6, yy + 6); g.stroke();
        g.fillStyle = '#94A3B8'; g.textAlign = 'center';
        g.fillText('ν < ν₀，无光电子', xx, yy + 30);
      }
    }
    function u0at(nu14) { return H_C * (nu14 * 1e14 - nu0()) / E_C; }

    function draw() {
      g.clearRect(0, 0, W, H);
      drawTube();
      drawPlot();
    }

    /* ---- 读数 ---- */
    function readouts() {
      var cur = u0();
      var nu014 = nu0() / 1e14;
      document.getElementById('pe-u0').textContent =
        cur >= 0 ? 'U₀ = ' + cur.toFixed(2) + ' V' : 'U₀ = 0 V（ν 低于红限）';
      document.getElementById('pe-nu0').textContent = 'ν₀ = ' + nu014.toFixed(2) + ' ×10¹⁴ Hz';
      document.getElementById('pe-ek').textContent =
        cur >= 0 ? 'E_k = eU₀ = ' + cur.toFixed(2) + ' eV' : 'E_k = 0 eV';
      document.getElementById('pe-state').textContent =
        METALS[state.metal].name + '：' + (cur >= 0 ? '有光电子逸出' : '无光电子（与光强无关）');
    }

    /* ---- 交互 ---- */
    document.getElementById('pe-nu').addEventListener('input', function () {
      state.nu = parseFloat(this.value);
      document.getElementById('pe-nu-val').textContent = state.nu.toFixed(2);
      draw(); readouts();
    });
    ['na', 'zn', 'pt'].forEach(function (m) {
      document.getElementById('pe-m-' + m).addEventListener('click', function () {
        state.metal = m; state.w = METALS[m].w;
        ['na', 'zn', 'pt'].forEach(function (x) {
          document.getElementById('pe-m-' + x).className = x === m ? 'on' : '';
        });
        draw(); readouts();
      });
    });

    draw(); readouts();
    /* 光电子飞行动画（低频刷新即可） */
    setInterval(function () { if (nuHz() >= nu0()) draw(); }, 240);
  }

  return { init: init };
})();
