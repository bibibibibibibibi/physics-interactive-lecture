/* ============================================================
 * sims/collision-lab.js — 碰撞实验室：两滑块一维对心碰撞（第 3 章核心仿真）
 * 交互：调 m₁、m₂、v₁₀、v₂₀，选「完全弹性 / 完全非弹性」，
 *       开始后两滑块在轨道上相向（同向追赶）运动并碰撞；
 *       下方常驻动量/动能守恒校验条形图，随参数实时更新。
 * 模型：完全弹性碰撞用教材式(3-31)：
 *         v₁ = [(m₁−m₂)v₁₀ + 2m₂v₂₀] / (m₁+m₂)
 *         v₂ = [(m₂−m₁)v₂₀ + 2m₁v₁₀] / (m₁+m₂)
 *       完全非弹性碰撞（碰后共速）：
 *         v′ = (m₁v₁₀ + m₂v₂₀) / (m₁+m₂)
 * 规范（5.3）：轨道与条形图坐标固定，只动物理量；
 *       v₁₀ ≤ v₂₀ 时明确提示「追不上，不发生碰撞」。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['collision-lab'] = (function () {
  'use strict';

  var W = 640, H = 400;
  var TRACK_Y = 96, TRACK_X0 = 50, TRACK_X1 = 600;   /* 轨道（固定坐标） */
  var VSCALE = 38;                                    /* px / (m·s⁻¹) 视觉速度 */

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { m1: 2, m2: 1, v10: 4, v20: 0, mode: 'elastic' };
    var anim = null, phase = null;   /* phase = {t, tCol, x1, x2} 开始后计时 */

    panel.innerHTML =
      '<label>滑块 1 质量 m₁ = <span id="cl-m1-val">2.0</span> kg</label>' +
      '<input type="range" id="cl-m1" min="0.5" max="5" step="0.5" value="2">' +
      '<label>滑块 2 质量 m₂ = <span id="cl-m2-val">1.0</span> kg</label>' +
      '<input type="range" id="cl-m2" min="0.5" max="5" step="0.5" value="1">' +
      '<label>初速度 v₁₀ = <span id="cl-v10-val">4.0</span> m/s</label>' +
      '<input type="range" id="cl-v10" min="0" max="6" step="0.5" value="4">' +
      '<label>初速度 v₂₀ = <span id="cl-v20-val">0.0</span> m/s（负值表示向左）</label>' +
      '<input type="range" id="cl-v20" min="-3" max="3" step="0.5" value="0">' +
      '<div class="sim-btnrow">' +
      '<button type="button" id="cl-elastic" class="on">完全弹性碰撞</button>' +
      '<button type="button" id="cl-inelastic">完全非弹性碰撞</button>' +
      '<button type="button" id="cl-start">▶ 开始</button>' +
      '<button type="button" id="cl-reset">复位</button>' +
      '</div>' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>碰后滑块 1 速度</span><span class="val" id="cl-v1">—</span></div>' +
      '<div class="row"><span>碰后滑块 2 速度</span><span class="val" id="cl-v2">—</span></div>' +
      '<div class="row"><span>动量校验 p前 / p后</span><span class="val" id="cl-p">—</span></div>' +
      '<div class="row"><span>动能变化 ΔE_k = E_k后 − E_k前</span><span class="val" id="cl-ek">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：试试三组极限情形——' +
      'm₁ = m₂（弹性碰撞交换速度）；m₂ ≫ m₁（小球原速弹回）；' +
      'm₂ ≪ m₁（静止小球以近 2v₁₀ 飞出）。v₁₀ ≤ v₂₀ 时滑块 1 追不上滑块 2，不发生碰撞</label>';

    /* ---- 物理量 ---- */
    function v1after() {
      var m1 = state.m1, m2 = state.m2;
      if (state.mode === 'inelastic') return (m1 * state.v10 + m2 * state.v20) / (m1 + m2);
      return ((m1 - m2) * state.v10 + 2 * m2 * state.v20) / (m1 + m2);
    }
    function v2after() {
      var m1 = state.m1, m2 = state.m2;
      if (state.mode === 'inelastic') return (m1 * state.v10 + m2 * state.v20) / (m1 + m2);
      return ((m2 - m1) * state.v20 + 2 * m1 * state.v10) / (m1 + m2);
    }
    function pBefore() { return state.m1 * state.v10 + state.m2 * state.v20; }
    function pAfter()  { return state.m1 * v1after() + state.m2 * v2after(); }
    function ekBefore(){ return 0.5 * state.m1 * state.v10 * state.v10 + 0.5 * state.m2 * state.v20 * state.v20; }
    function ekAfter() { return 0.5 * state.m1 * Math.pow(v1after(), 2) + 0.5 * state.m2 * Math.pow(v2after(), 2); }
    function willCollide() { return state.v10 > state.v20; }

    /* ---- 轨道动画几何 ---- */
    var X1_0 = 120, X2_0 = 470;          /* 初始位置（固定） */
    function bw(m) { return 26 + 14 * Math.sqrt(m); }   /* 滑块宽度随质量增大 */
    function collideTime() {             /* 碰撞时刻（动画时间 s） */
      return (X2_0 - X1_0) / ((state.v10 - state.v20) * VSCALE);
    }

    function drawArrow(x0, y0, x1, y1, color, label, ldy) {
      var dx = x1 - x0, len = Math.abs(dx);
      if (len < 3) return;
      var ux = dx / len;
      g.strokeStyle = color; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x1 - 9 * ux, y1 - 4.5);
      g.lineTo(x1 - 9 * ux, y1 + 4.5);
      g.closePath(); g.fill();
      if (label) {
        g.font = '12px sans-serif'; g.textAlign = 'center';
        g.fillText(label, (x0 + x1) / 2, y1 + (ldy || -8));
      }
    }

    function drawBlock(x, m, label, fill, stroke) {
      var w = bw(m), h = 30;
      g.fillStyle = fill; g.strokeStyle = stroke; g.lineWidth = 1.6;
      g.fillRect(x - w / 2, TRACK_Y - h, w, h);
      g.strokeRect(x - w / 2, TRACK_Y - h, w, h);
      g.fillStyle = stroke; g.font = '12px sans-serif'; g.textAlign = 'center';
      g.fillText(label, x, TRACK_Y - h / 2 + 4);
    }

    function drawTrack() {
      /* 轨道（常驻固定） */
      g.strokeStyle = '#334155'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(TRACK_X0, TRACK_Y); g.lineTo(TRACK_X1, TRACK_Y); g.stroke();
      g.strokeStyle = '#CBD5E1'; g.lineWidth = 1;
      for (var x = TRACK_X0 + 8; x < TRACK_X1; x += 14) {
        g.beginPath(); g.moveTo(x, TRACK_Y); g.lineTo(x - 5, TRACK_Y + 6); g.stroke();
      }
      g.fillStyle = '#64748B'; g.font = '11px sans-serif'; g.textAlign = 'left';
      g.fillText('光滑水平轨道（一维对心碰撞）', TRACK_X0, TRACK_Y + 22);

      /* 滑块位置 */
      var x1 = X1_0, x2 = X2_0, v1 = state.v10, v2 = state.v20, collided = false;
      if (phase && willCollide()) {
        var tCol = collideTime();
        if (phase.t < tCol) {
          x1 = X1_0 + state.v10 * VSCALE * phase.t;
          x2 = X2_0 + state.v20 * VSCALE * phase.t;
        } else {
          collided = true;
          v1 = v1after(); v2 = v2after();
          var xc1 = X1_0 + state.v10 * VSCALE * tCol;
          var xc2 = X2_0 + state.v20 * VSCALE * tCol;
          x1 = xc1 + v1 * VSCALE * (phase.t - tCol);
          x2 = xc2 + v2 * VSCALE * (phase.t - tCol);
        }
      } else if (phase && !willCollide()) {
        x1 = X1_0 + state.v10 * VSCALE * phase.t;
        x2 = X2_0 + state.v20 * VSCALE * phase.t;
      }
      /* 边界钳制在画布内 */
      x1 = Math.max(TRACK_X0 + bw(state.m1) / 2, Math.min(TRACK_X1 - bw(state.m1) / 2, x1));
      x2 = Math.max(TRACK_X0 + bw(state.m2) / 2, Math.min(TRACK_X1 - bw(state.m2) / 2, x2));

      drawBlock(x1, state.m1, 'm₁', '#DBEAFE', '#1D4ED8');
      drawBlock(x2, state.m2, 'm₂', '#FEF3C7', '#B45309');

      /* 速度箭头：碰前蓝色实线，碰后红色实线 */
      var col1 = collided ? '#DC2626' : '#2563EB';
      var col2 = collided ? '#DC2626' : '#2563EB';
      drawArrow(x1, TRACK_Y - 44, x1 + v1 * VSCALE * 0.9, TRACK_Y - 44, col1,
                (collided ? 'v₁' : 'v₁₀') + ' = ' + v1.toFixed(1), -6);
      drawArrow(x2, TRACK_Y - 62, x2 + v2 * VSCALE * 0.9, TRACK_Y - 62, col2,
                (collided ? 'v₂' : 'v₂₀') + ' = ' + v2.toFixed(1), -6);

      /* 碰撞瞬间标记 */
      if (collided && phase.t - collideTime() < 0.35) {
        var xc = (X1_0 + state.v10 * VSCALE * collideTime());
        g.strokeStyle = '#F59E0B'; g.lineWidth = 2;
        g.beginPath(); g.arc(xc + bw(state.m1) / 2 + 2, TRACK_Y - 15, 12, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#F59E0B'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center';
        g.fillText('碰撞!', xc + bw(state.m1) / 2 + 2, TRACK_Y - 34);
      }

      /* 追不上提示 */
      if (!willCollide()) {
        g.fillStyle = '#B45309'; g.font = '13px sans-serif'; g.textAlign = 'center';
        g.fillText('v₁₀ ≤ v₂₀：滑块 1 追不上滑块 2，不发生碰撞（下方仍给出"若碰撞"的理论值）',
                   W / 2, TRACK_Y + 44);
      } else if (phase && collided) {
        g.fillStyle = '#059669'; g.font = '13px sans-serif'; g.textAlign = 'center';
        g.fillText(state.mode === 'elastic' ? '完全弹性碰撞：动量守恒，动能也守恒'
                                            : '完全非弹性碰撞：动量守恒，动能损失最大（共速）',
                   W / 2, TRACK_Y + 44);
      }
    }

    /* ---- 下方常驻：动量 / 动能条形校验（固定坐标） ---- */
    function drawBars() {
      var bx0 = 60, bwMax = 240, by1 = 236, by2 = 268, by3 = 336, by4 = 368;
      var bh = 18;
      g.fillStyle = '#475569'; g.font = '12px sans-serif'; g.textAlign = 'left';
      g.fillText('动量校验（系统总动量）', bx0, by1 - 26);
      g.fillText('动能校验（系统总动能）', bx0, by3 - 26);

      var pB = pBefore(), pA = pAfter();
      var pMax = Math.max(Math.abs(pB), Math.abs(pA), 1);
      /* 动量两条（等长即守恒） */
      g.fillStyle = '#2563EB';
      g.fillRect(bx0, by1, bwMax * Math.abs(pB) / pMax, bh);
      g.fillStyle = '#DC2626';
      g.fillRect(bx0, by2, bwMax * Math.abs(pA) / pMax, bh);
      g.fillStyle = '#64748B'; g.font = '11px sans-serif';
      g.fillText('碰前 p = ' + pB.toFixed(1) + ' kg·m/s', bx0 + bwMax * Math.abs(pB) / pMax + 8, by1 + 13);
      g.fillText('碰后 p = ' + pA.toFixed(1) + ' kg·m/s', bx0 + bwMax * Math.abs(pA) / pMax + 8, by2 + 13);

      var eB = ekBefore(), eA = ekAfter();
      var eMax = Math.max(eB, eA, 1);
      g.fillStyle = '#2563EB';
      g.fillRect(bx0, by3, bwMax * eB / eMax, bh);
      g.fillStyle = '#DC2626';
      g.fillRect(bx0, by4, bwMax * eA / eMax, bh);
      g.fillStyle = '#64748B';
      g.fillText('碰前 E_k = ' + eB.toFixed(1) + ' J', bx0 + bwMax * eB / eMax + 8, by3 + 13);
      g.fillText('碰后 E_k = ' + eA.toFixed(1) + ' J', bx0 + bwMax * eA / eMax + 8, by4 + 13);

      /* 守恒结论徽标 */
      g.font = 'bold 12px sans-serif'; g.textAlign = 'left';
      g.fillStyle = '#059669';
      g.fillText('✓ 动量守恒', bx0 + bwMax + 190, by1 + 26);
      var loss = eB - eA;
      if (loss <= 0.005 * eMax) {
        g.fillStyle = '#059669';
        g.fillText('✓ 动能守恒（弹性）', bx0 + bwMax + 190, by3 + 26);
      } else {
        g.fillStyle = '#B45309';
        g.fillText('动能损失 ' + loss.toFixed(1) + ' J（→ 内能）', bx0 + bwMax + 190, by3 + 26);
      }
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      drawTrack();
      drawBars();
      /* 读数 */
      panel.querySelector('#cl-v1').textContent = 'v₁ = ' + v1after().toFixed(2) + ' m/s';
      panel.querySelector('#cl-v2').textContent = 'v₂ = ' + v2after().toFixed(2) + ' m/s';
      panel.querySelector('#cl-p').textContent =
        pBefore().toFixed(1) + ' = ' + pAfter().toFixed(1) + ' kg·m/s ✓';
      var dEk = ekAfter() - ekBefore();
      panel.querySelector('#cl-ek').textContent =
        (dEk >= 0 ? '+' : '') + dEk.toFixed(1) + ' J' +
        (Math.abs(dEk) < 0.005 ? '（动能守恒）' : '（损失 → 内能）');
    }

    function stopAnim() { if (anim) { cancelAnimationFrame(anim); anim = null; } }

    function bindRange(id, key) {
      panel.querySelector('#' + id).addEventListener('input', function (e) {
        state[key] = Number(e.target.value);
        panel.querySelector('#' + id + '-val').textContent = state[key].toFixed(1);
        stopAnim(); phase = null; draw();
      });
    }
    bindRange('cl-m1', 'm1');
    bindRange('cl-m2', 'm2');
    bindRange('cl-v10', 'v10');
    bindRange('cl-v20', 'v20');

    function setMode(mode) {
      state.mode = mode;
      panel.querySelector('#cl-elastic').className = mode === 'elastic' ? 'on' : '';
      panel.querySelector('#cl-inelastic').className = mode === 'inelastic' ? 'on' : '';
      stopAnim(); phase = null; draw();
    }
    panel.querySelector('#cl-elastic').addEventListener('click', function () { setMode('elastic'); });
    panel.querySelector('#cl-inelastic').addEventListener('click', function () { setMode('inelastic'); });

    panel.querySelector('#cl-start').addEventListener('click', function () {
      stopAnim();
      var t0 = null;
      phase = { t: 0 };
      var tEnd = willCollide() ? collideTime() + 1.6 : 2.5;   /* 碰后再播 1.6 s */
      function step(ts) {
        if (t0 === null) t0 = ts;
        phase.t = Math.min((ts - t0) / 1000, tEnd);
        draw();
        if (phase.t < tEnd) anim = requestAnimationFrame(step);
        else anim = null;
      }
      anim = requestAnimationFrame(step);
    });
    panel.querySelector('#cl-reset').addEventListener('click', function () {
      stopAnim(); phase = null; draw();
    });

    draw();
  }

  return { init: init };
})();
