/* ============================================================
 * sims/incline-block.js — 力与运动模拟器：斜面上的滑块（第 2 章核心仿真）
 * 交互：调倾角 θ（5°~60°）、动摩擦因数 μ（0~0.80）、沿斜面向上外力 F（0~15 N），
 *       释放后滑块沿斜面下滑，右侧实时绘制 v-t 图；
 *       常驻参考：同参数无摩擦（μ=0）v-t 虚线；
 *       画布左侧常驻受力示意图（mg 分解、N、摩擦力 f、外力 F）。
 * 模型：m = 2.0 kg 固定；沿斜面取向下为正，
 *       驱动力 D = m·g·sinθ − F；最大摩擦 ≈ μ·m·g·cosθ
 *       D > μ·m·g·cosθ → a = (D − μ·m·g·cosθ)/m 匀加速下滑
 *       否则 a = 0，滑块静止（静摩擦足以平衡）
 *       斜面全长 L = 12 m（固定），v = √(2aL)，T = √(2L/a)
 * 规范（5.3）：v-t 坐标固定（t ∈ [0,5] s，v ∈ [0,16] m/s），
 *       只动物理量；参数变化映射为图形可见变化；标注随进度浮现。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['incline-block'] = (function () {
  'use strict';

  var G = 9.8, M = 2.0, LEN = 12;        /* g、质量、斜面全长（固定） */
  var TMAX = 5, VMAX = 16;               /* v-t 固定坐标窗 */
  var W = 640, H = 400;

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { theta: 30, mu: 0.10, fext: 0 };
    var anim = null, sliding = null;      /* sliding = {t} 释放后计时 */

    panel.innerHTML =
      '<label>倾角 θ = <span id="ib-theta-val">30</span>°</label>' +
      '<input type="range" id="ib-theta" min="5" max="60" step="1" value="30">' +
      '<label>动摩擦因数 μ = <span id="ib-mu-val">0.10</span></label>' +
      '<input type="range" id="ib-mu" min="0" max="0.8" step="0.02" value="0.10">' +
      '<label>沿斜面向上外力 F = <span id="ib-fext-val">0</span> N</label>' +
      '<input type="range" id="ib-fext" min="0" max="15" step="0.5" value="0">' +
      '<div class="sim-btnrow">' +
      '<button type="button" id="ib-release">▶ 释放滑块</button>' +
      '<button type="button" id="ib-reset">复位</button>' +
      '</div>' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>沿斜面驱动力 D = mgsinθ − F</span><span class="val" id="ib-d">—</span></div>' +
      '<div class="row"><span>加速度 a = (D − μmgcosθ)/m</span><span class="val" id="ib-a">—</span></div>' +
      '<div class="row"><span>滑到底端（L = 12 m）末速度 v</span><span class="val" id="ib-v">—</span></div>' +
      '<div class="row"><span>下滑时间 T</span><span class="val" id="ib-t">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：m 固定 2.0 kg；' +
      '当 D ≤ μmgcosθ 时静摩擦足以平衡，滑块静止（a = 0）；' +
      'μ = tanθ（无外力时）为恰好匀速的临界条件</label>';

    /* ---- 物理量 ---- */
    function drive() { return M * G * Math.sin(rad()) - state.fext; }
    function fric()  { return state.mu * M * G * Math.cos(rad()); }
    function rad()   { return state.theta * Math.PI / 180; }
    function accel() {
      var a = (drive() - fric()) / M;
      return a > 0 ? a : 0;
    }

    /* ---- 布局：左侧斜面场景 330px，右侧 v-t 图 ---- */
    var vtX0 = 392, vtY0 = 30, vtW = 226, vtH = 300;
    function TX(t) { return vtX0 + vtW * t / TMAX; }
    function VY(v) { return vtY0 + vtH - vtH * v / VMAX; }

    /* 斜面几何：顶点（坡顶）固定在 (268,88)，底端沿斜面向左下 */
    var apexX = 268, apexY = 88, sLen = 250;   /* 斜面视觉长度 px */
    function slopePoint(s) {   /* s ∈ [0,1] 从顶端到底端 */
      var a = rad();
      return [apexX - s * sLen * Math.cos(a), apexY + s * sLen * Math.sin(a)];
    }

    function drawArrow(x0, y0, x1, y1, color, label, ldx, ldy) {
      var dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
      if (len < 2) return;
      var ux = dx / len, uy = dy / len;
      g.strokeStyle = color; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x1 - 9 * ux + 4.5 * uy, y1 - 9 * uy - 4.5 * ux);
      g.lineTo(x1 - 9 * ux - 4.5 * uy, y1 - 9 * uy + 4.5 * ux);
      g.closePath(); g.fill();
      if (label) {
        g.font = '12px sans-serif'; g.textAlign = 'left';
        g.fillText(label, x1 + (ldx || 6), y1 + (ldy || 4));
      }
    }

    function drawScene() {
      var a = rad();
      /* 斜面与地面 */
      var base = slopePoint(1);
      g.strokeStyle = '#334155'; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(base[0], base[1]); g.lineTo(apexX, apexY);
      g.lineTo(apexX, base[1]); g.closePath(); g.stroke();
      g.fillStyle = '#F1F5F9';
      g.beginPath();
      g.moveTo(base[0], base[1]); g.lineTo(apexX, apexY);
      g.lineTo(apexX, base[1]); g.closePath(); g.fill();
      g.strokeStyle = '#334155'; g.beginPath();
      g.moveTo(base[0], base[1]); g.lineTo(apexX, apexY);
      g.lineTo(apexX, base[1]); g.closePath(); g.stroke();
      /* 倾角标注 */
      g.strokeStyle = '#64748B'; g.lineWidth = 1.2;
      g.beginPath(); g.arc(base[0], base[1], 34, -a, 0); g.stroke();
      g.fillStyle = '#64748B'; g.font = '12px sans-serif'; g.textAlign = 'left';
      g.fillText('θ', base[0] + 40 * Math.cos(a / 2), base[1] - 40 * Math.sin(a / 2) + 4);

      /* 滑块位置 */
      var s = 0;
      if (sliding && accel() > 0) {
        var x = 0.5 * accel() * sliding.t * sliding.t;    /* 已滑距离 m */
        s = Math.min(x / LEN, 1);
      }
      var c = slopePoint(s);
      /* 滑块（贴着斜面的方块，随斜面旋转） */
      var ux = -Math.cos(a), uy = Math.sin(a);            /* 沿斜面向下单位向量 */
      var nx = -Math.sin(a), ny = -Math.cos(a);           /* 斜面法向（向外） */
      var bw = 30, bh = 22;
      var cx = c[0] + nx * 2, cy = c[1] + ny * 2;
      g.save();
      g.translate(cx, cy); g.rotate(-a);
      g.fillStyle = '#2563EB'; g.strokeStyle = '#1D4ED8'; g.lineWidth = 1.5;
      g.fillRect(-bw / 2, -bh, bw, bh); g.strokeRect(-bw / 2, -bh, bw, bh);
      g.restore();

      /* ---- 常驻受力示意图（画在滑块质心处） ---- */
      var px = cx, py = cy - bh / 2;
      var acc = accel();
      /* 重力分量 mgsinθ（沿斜面向下） */
      var gs = M * G * Math.sin(a), gc = M * G * Math.cos(a);
      drawArrow(px, py, px + ux * gs * 1.6, py + uy * gs * 1.6, '#DC2626', 'mgsinθ', 6, 12);
      /* 重力法向分量 mgcosθ（压向斜面） */
      drawArrow(px, py, px - nx * gc * 1.3, py - ny * gc * 1.3, '#94A3B8', 'mgcosθ', -58, 20);
      /* 支持力 N */
      drawArrow(px, py, px + nx * gc * 1.3, py + ny * gc * 1.3, '#059669', 'N', 6, -8);
      /* 摩擦力（有滑动趋势/滑动时沿斜面向上） */
      if (drive() > 0) {
        drawArrow(px, py, px - ux * Math.min(fric(), drive()) * 1.6, py - uy * Math.min(fric(), drive()) * 1.6,
                  '#F59E0B', 'f', -26, 14);
      }
      /* 外力 F（沿斜面向上） */
      if (state.fext > 0) {
        drawArrow(px, py, px - ux * state.fext * 1.6, py - uy * state.fext * 1.6, '#7C3AED', 'F', -22, -8);
      }
      /* 加速度指示 */
      if (acc > 0) {
        drawArrow(apexX + 16, apexY + 30, apexX + 16 + 40, apexY + 30, '#059669', null);
        g.fillStyle = '#059669'; g.font = '12px sans-serif'; g.textAlign = 'left';
        g.fillText('a = ' + acc.toFixed(2) + ' m/s²', apexX + 16, apexY + 52);
      } else {
        g.fillStyle = '#64748B'; g.font = '12px sans-serif'; g.textAlign = 'left';
        g.fillText('滑块静止（静摩擦平衡）', apexX - 40, apexY + 52);
      }
    }

    function drawVt() {
      /* 固定坐标 */
      g.strokeStyle = '#E2E8F0'; g.fillStyle = '#64748B';
      g.lineWidth = 1; g.font = '11px sans-serif'; g.textAlign = 'center';
      for (var t = 0; t <= TMAX; t += 1) {
        g.beginPath(); g.moveTo(TX(t), VY(0)); g.lineTo(TX(t), VY(VMAX)); g.stroke();
        g.fillText(t + '', TX(t), VY(0) + 15);
      }
      g.textAlign = 'right';
      for (var v = 0; v <= VMAX; v += 4) {
        g.beginPath(); g.moveTo(TX(0), VY(v)); g.lineTo(TX(TMAX), VY(v)); g.stroke();
        g.fillText(v + '', TX(0) - 6, VY(v) + 4);
      }
      g.fillStyle = '#475569'; g.textAlign = 'left';
      g.fillText('t / s', TX(TMAX) - 30, VY(0) + 29);
      g.save(); g.translate(vtX0 - 32, VY(VMAX) - 6); g.rotate(-Math.PI / 2);
      g.fillText('v / (m·s⁻¹)', 0, 0); g.restore();
      g.strokeStyle = '#334155'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(TX(0), VY(0)); g.lineTo(TX(TMAX), VY(0)); g.stroke();
      g.beginPath(); g.moveTo(TX(0), VY(0)); g.lineTo(TX(0), VY(VMAX)); g.stroke();

      /* 常驻参考：同参数无摩擦 v-t（虚线，至到端点） */
      var a0 = drive() / M;
      if (a0 > 0) {
        var T0 = Math.sqrt(2 * LEN / a0);
        g.strokeStyle = '#CBD5E1'; g.lineWidth = 1.6; g.setLineDash([5, 4]);
        g.beginPath(); g.moveTo(TX(0), VY(0));
        g.lineTo(TX(Math.min(T0, TMAX)), VY(Math.min(a0 * T0, VMAX)));
        g.stroke(); g.setLineDash([]);
        g.fillStyle = '#94A3B8'; g.font = '11px sans-serif'; g.textAlign = 'left';
        g.fillText('无摩擦参考', TX(Math.min(T0, TMAX)) - 58, VY(Math.min(a0 * T0, VMAX)) - 8);
      }

      /* 当前 v-t：v = a·t，到端点 L 为止 */
      var acc = accel();
      if (acc > 0) {
        var Tend = Math.sqrt(2 * LEN / acc);
        var tNow = sliding ? Math.min(sliding.t, Tend) : Tend;   /* 未释放时画全预期曲线（细线） */
        g.strokeStyle = '#2563EB'; g.lineWidth = sliding ? 2.5 : 1.4;
        g.beginPath();
        for (var i = 0; i <= 40; i++) {
          var ti = tNow * i / 40;
          var vi = acc * ti;
          if (i === 0) g.moveTo(TX(ti), VY(vi)); else g.lineTo(TX(ti), VY(vi));
        }
        g.stroke();
        /* 标注随进度浮现：到端点后标末速度 */
        if (sliding && sliding.t >= Tend) {
          var vend = acc * Tend;
          g.fillStyle = '#DC2626'; g.font = '12px sans-serif'; g.textAlign = 'left';
          g.fillText('v = ' + vend.toFixed(2) + ' m/s', Math.min(TX(Tend) - 96, TX(TMAX) - 110), VY(vend) - 8);
          g.fillText('T = ' + Tend.toFixed(2) + ' s', Math.min(TX(Tend) - 96, TX(TMAX) - 110), VY(vend) + 8);
        }
      }
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      drawScene();
      drawVt();
      /* 读数 */
      var acc = accel();
      panel.querySelector('#ib-d').textContent = 'D = ' + drive().toFixed(2) + ' N';
      panel.querySelector('#ib-a').textContent = acc > 0 ? 'a = ' + acc.toFixed(2) + ' m/s²' : 'a = 0（静止）';
      if (acc > 0) {
        panel.querySelector('#ib-v').textContent = 'v = ' + Math.sqrt(2 * acc * LEN).toFixed(2) + ' m/s';
        panel.querySelector('#ib-t').textContent = 'T = ' + Math.sqrt(2 * LEN / acc).toFixed(2) + ' s';
      } else {
        panel.querySelector('#ib-v').textContent = 'v = 0 m/s';
        panel.querySelector('#ib-t').textContent = 'T = —（不下滑）';
      }
    }

    function stopAnim() { if (anim) { cancelAnimationFrame(anim); anim = null; } }

    function bindRange(id, key, fmt) {
      panel.querySelector('#' + id).addEventListener('input', function (e) {
        state[key] = Number(e.target.value);
        panel.querySelector('#' + id + '-val').textContent =
          fmt === 2 ? state[key].toFixed(2) : state[key];
        stopAnim(); sliding = null; draw();
      });
    }
    bindRange('ib-theta', 'theta');
    bindRange('ib-mu', 'mu', 2);
    bindRange('ib-fext', 'fext');

    panel.querySelector('#ib-release').addEventListener('click', function () {
      stopAnim();
      if (accel() <= 0) { draw(); return; }
      var Tend = Math.sqrt(2 * LEN / accel());
      var t0 = null;
      sliding = { t: 0 };
      function step(ts) {
        if (t0 === null) t0 = ts;
        sliding.t = Math.min((ts - t0) / 1000 * (Tend / 2.4), Tend);   /* 约 2.4 s 播完 */
        draw();
        if (sliding.t < Tend) anim = requestAnimationFrame(step);
        else anim = null;
      }
      anim = requestAnimationFrame(step);
    });
    panel.querySelector('#ib-reset').addEventListener('click', function () {
      stopAnim(); sliding = null; draw();
    });

    draw();
  }

  return { init: init };
})();
