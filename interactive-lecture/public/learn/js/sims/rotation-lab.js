/* ============================================================
 * sims/rotation-lab.js — 转动实验室：转盘 + 双滑块（第 4 章核心仿真）
 * 模型：俯视图水平转盘，盘体转动惯量 J₀ = 2.0 kg·m²（固定），
 *       两个对称滑块各质量 m、距轴 r，系统 J = J₀ + 2mr²。
 * 两种模式：
 *   转动定律（#rt-law）：外力矩 M 恒定，α = M/J，从静止起动 ω = αt；
 *     —— 调 m、r 看「同样的力矩，J 越大 α 越小」。
 *   角动量守恒（#rt-conserve）：无力矩，r = 1.0 m 时 ω₀ = 3 rad/s，
 *     L₀ = J(m, 1.0)·ω₀ 常驻不变；把滑块向轴心收拢（r 减小），
 *     ω = L₀/J 实时增大——花样滑冰收臂加速的原理。
 * 规范（5.3）：盘面几何与条形图坐标固定，只动物理量；
 *       读数初始即填充（自检脚本无交互读取 #rt-j）。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['rotation-lab'] = (function () {
  'use strict';

  var W = 640, H = 400;
  var CX = 225, CY = 185, DISK_R = 118;     /* 转盘几何（固定） */
  var R_PX = 100;                            /* r = 1.0 m 对应的像素半径 */
  var J0 = 2.0, OM0 = 3.0;                   /* 盘体 J₀ 与守恒模式基准角速度 */
  var T_END = 5.0;                           /* 转动定律模式动画时长 s */

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = W; canvas.height = H;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    var state = { m: 1.5, r: 0.8, torque: 4, mode: 'law' };
    var anim = null;
    var theta = 0, omega = 0, tLaw = 0, running = false;

    panel.innerHTML =
      '<label>单个滑块质量 m = <span id="rt-m-val">1.5</span> kg（两滑块对称）</label>' +
      '<input type="range" id="rt-m" min="0.5" max="3" step="0.1" value="1.5">' +
      '<label>滑块距轴 r = <span id="rt-r-val">0.8</span> m</label>' +
      '<input type="range" id="rt-r" min="0.2" max="1.0" step="0.05" value="0.8">' +
      '<label>外力矩 M = <span id="rt-t-val">4.0</span> N·m（仅转动定律模式）</label>' +
      '<input type="range" id="rt-t" min="0" max="10" step="0.5" value="4">' +
      '<div class="sim-btnrow">' +
      '<button type="button" id="rt-law" class="on">转动定律 α = M/J</button>' +
      '<button type="button" id="rt-conserve">角动量守恒 L = Jω</button>' +
      '<button type="button" id="rt-start">▶ 开始</button>' +
      '<button type="button" id="rt-reset">复位</button>' +
      '</div>' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>系统转动惯量</span><span class="val" id="rt-j">—</span></div>' +
      '<div class="row"><span>角加速度</span><span class="val" id="rt-a">—</span></div>' +
      '<div class="row"><span>角速度</span><span class="val" id="rt-om">—</span></div>' +
      '<div class="row"><span>角动量</span><span class="val" id="rt-l">—</span></div>' +
      '</div>' +
      '<label style="margin-top:10px;color:#8B95A7">提示：守恒模式下先 ▶ 开始，再把 r 从 1.0 m 收到 0.2 m，' +
      '看 ω 自动增大而 L 保持不变；转动定律模式下固定 M，把滑块拉远（J 变大）看 α 变小</label>';

    /* ---- 物理量 ---- */
    function J() { return J0 + 2 * state.m * state.r * state.r; }
    function alpha() { return state.mode === 'law' ? state.torque / J() : 0; }
    function L0() { return (J0 + 2 * state.m * 1.0 * 1.0) * OM0; }   /* 守恒基准：r = 1.0 m 时 ω₀ = 3 */
    function omegaNow() {
      if (state.mode === 'conserve') return running ? L0() / J() : 0;
      return omega;   /* law 模式：动画积分值 */
    }

    /* ---- 转盘画面 ---- */
    function drawTable() {
      /* 盘体 */
      g.fillStyle = '#F1F5F9'; g.strokeStyle = '#334155'; g.lineWidth = 2;
      g.beginPath(); g.arc(CX, CY, DISK_R, 0, Math.PI * 2); g.fill(); g.stroke();
      /* 导轨（随盘转动的直径杆） */
      var rp = state.r * R_PX;
      var dx = Math.cos(theta), dy = Math.sin(theta);
      g.strokeStyle = '#94A3B8'; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(CX - DISK_R * dx, CY - DISK_R * dy);
      g.lineTo(CX + DISK_R * dx, CY + DISK_R * dy);
      g.stroke();
      /* 盘体参考标记（显示转过角度） */
      g.strokeStyle = '#2563EB'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(CX, CY);
      g.lineTo(CX + (DISK_R - 12) * Math.cos(theta + Math.PI / 2),
               CY + (DISK_R - 12) * Math.sin(theta + Math.PI / 2)); g.stroke();
      /* 轴心 */
      g.fillStyle = '#334155';
      g.beginPath(); g.arc(CX, CY, 5, 0, Math.PI * 2); g.fill();
      g.font = '11px sans-serif'; g.textAlign = 'left'; g.fillStyle = '#64748B';
      g.fillText('转轴 ⊥ 纸面（俯视图）', CX - 60, CY + DISK_R + 20);
      /* 两个对称滑块 */
      var bw = 14 + 7 * Math.sqrt(state.m);
      [[1, '#DBEAFE', '#1D4ED8'], [-1, '#FEF3C7', '#B45309']].forEach(function (c) {
        var sx = CX + c[0] * rp * dx, sy = CY + c[0] * rp * dy;
        g.save(); g.translate(sx, sy); g.rotate(theta);
        g.fillStyle = c[1]; g.strokeStyle = c[2]; g.lineWidth = 1.6;
        g.fillRect(-bw / 2, -bw / 2, bw, bw); g.strokeRect(-bw / 2, -bw / 2, bw, bw);
        g.restore();
        g.fillStyle = c[2]; g.font = '11px sans-serif'; g.textAlign = 'center';
        g.fillText('m', sx, sy - bw / 2 - 5);
      });
      /* r 标注 */
      g.fillStyle = '#B45309'; g.font = '12px sans-serif'; g.textAlign = 'center';
      g.fillText('r = ' + state.r.toFixed(2) + ' m', CX + rp * dx / 2, CY + rp * dy / 2 - 10);

      /* ω 弧形箭头（盘外缘，逆时针） */
      var om = omegaNow();
      if (om > 0.01) {
        g.strokeStyle = '#DC2626'; g.lineWidth = 2.4;
        g.beginPath(); g.arc(CX, CY, DISK_R + 14, -0.9, 0.55); g.stroke();
        var ax = CX + (DISK_R + 14) * Math.cos(0.55), ay = CY + (DISK_R + 14) * Math.sin(0.55);
        g.fillStyle = '#DC2626';
        g.beginPath();
        g.moveTo(ax, ay); g.lineTo(ax - 11, ay - 2); g.lineTo(ax - 4, ay + 10);
        g.closePath(); g.fill();
        g.font = 'bold 13px sans-serif'; g.textAlign = 'left';
        g.fillText('ω = ' + om.toFixed(2) + ' rad/s', ax - 38, ay - 14);
      }

      /* 模式说明 */
      g.fillStyle = '#475569'; g.font = '12px sans-serif'; g.textAlign = 'left';
      if (state.mode === 'law') {
        g.fillText('转动定律：M = ' + state.torque.toFixed(1) + ' N·m 恒定，α = M/J', 18, 26);
        if (running || tLaw > 0)
          g.fillText('t = ' + tLaw.toFixed(1) + ' s，从静止起动', 18, 44);
        else
          g.fillText('按 ▶ 开始，盘从静止以 α = M/J 加速', 18, 44);
      } else {
        g.fillText('角动量守恒：无力矩，L₀ = J·ω₀ = ' + L0().toFixed(2) + ' kg·m²/s（r = 1.0 m 时 ω₀ = 3 rad/s）', 18, 26);
        g.fillText(running ? '收拢滑块（r↓）→ J↓ → ω = L₀/J ↑，L 不变'
                           : '按 ▶ 开始，盘以当前 ω 持续转动', 18, 44);
      }
    }

    /* ---- 右侧常驻条形图（固定坐标） ---- */
    function drawBars() {
      var bx = 400, bwMax = 150, bh = 16, y0 = 96, gap = 62;
      var rows = [
        { label: 'J（kg·m²）', val: J(), max: 8, color: '#2563EB', txt: J().toFixed(2) },
        { label: 'ω（rad/s）', val: omegaNow(), max: 15, color: '#DC2626', txt: omegaNow().toFixed(2) },
        { label: 'L（kg·m²/s）', val: J() * omegaNow(), max: 25, color: '#059669', txt: (J() * omegaNow()).toFixed(2) }
      ];
      rows.forEach(function (r, i) {
        var y = y0 + i * gap;
        g.fillStyle = '#475569'; g.font = '12px sans-serif'; g.textAlign = 'left';
        g.fillText(r.label, bx, y - 8);
        g.strokeStyle = '#CBD5E1'; g.lineWidth = 1;
        g.strokeRect(bx, y, bwMax, bh);
        g.fillStyle = r.color;
        g.fillRect(bx, y, bwMax * Math.min(r.val / r.max, 1), bh);
        g.fillStyle = '#64748B'; g.font = '12px sans-serif';
        g.fillText(r.txt, bx + bwMax + 8, y + 13);
      });
      /* 守恒徽标 */
      if (state.mode === 'conserve' && running) {
        g.fillStyle = '#059669'; g.font = 'bold 12px sans-serif';
        g.fillText('✓ L 守恒', bx + bwMax + 8, y0 + 2 * gap + 38);
      }
      g.fillStyle = '#94A3B8'; g.font = '11px sans-serif';
      g.fillText('条长为固定满刻度：J ≤ 8、ω ≤ 15、L ≤ 25', bx, y0 + 2 * gap + 64);
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      drawTable();
      drawBars();
      /* 读数（初始即填充，供无交互自检） */
      panel.querySelector('#rt-j').textContent = 'J = ' + J().toFixed(2) + ' kg·m²';
      panel.querySelector('#rt-a').textContent = state.mode === 'law'
        ? 'α = ' + alpha().toFixed(2) + ' rad/s²'
        : 'α = 0.00 rad/s²（无力矩）';
      panel.querySelector('#rt-om').textContent = 'ω = ' + omegaNow().toFixed(2) + ' rad/s';
      panel.querySelector('#rt-l').textContent = 'L = ' + (J() * omegaNow()).toFixed(2) + ' kg·m²/s' +
        (state.mode === 'conserve' && running ? '（守恒）' : '');
    }

    function stopAnim() { if (anim) { cancelAnimationFrame(anim); anim = null; } }

    function bindRange(id, key, fmt) {
      panel.querySelector('#' + id).addEventListener('input', function (e) {
        state[key] = Number(e.target.value);
        panel.querySelector('#' + id + '-val').textContent = state[key].toFixed(fmt);
        if (state.mode === 'law') { stopAnim(); running = false; tLaw = 0; omega = 0; theta = 0; }
        /* conserve 模式：不中断转动，ω = L₀/J 随参数实时变化 */
        draw();
      });
    }
    bindRange('rt-m', 'm', 1);
    bindRange('rt-r', 'r', 2);
    bindRange('rt-t', 'torque', 1);

    function setMode(mode) {
      state.mode = mode;
      panel.querySelector('#rt-law').className = mode === 'law' ? 'on' : '';
      panel.querySelector('#rt-conserve').className = mode === 'conserve' ? 'on' : '';
      stopAnim(); running = false; theta = 0; omega = 0; tLaw = 0; draw();
    }
    panel.querySelector('#rt-law').addEventListener('click', function () { setMode('law'); });
    panel.querySelector('#rt-conserve').addEventListener('click', function () { setMode('conserve'); });

    panel.querySelector('#rt-start').addEventListener('click', function () {
      stopAnim();
      if (state.mode === 'law') { tLaw = 0; omega = 0; }
      running = true;
      var last = null;
      function step(ts) {
        if (last === null) last = ts;
        var dt = Math.min((ts - last) / 1000, 0.05); last = ts;
        if (state.mode === 'law') {
          tLaw = Math.min(tLaw + dt, T_END);
          omega = alpha() * tLaw;
          theta += omega * dt;
          if (tLaw >= T_END) { running = false; draw(); anim = null; return; }
        } else {
          theta += omegaNow() * dt;
        }
        draw();
        anim = requestAnimationFrame(step);
      }
      anim = requestAnimationFrame(step);
    });
    panel.querySelector('#rt-reset').addEventListener('click', function () {
      stopAnim(); running = false; theta = 0; omega = 0; tLaw = 0; draw();
    });

    draw();
  }

  return { init: init };
})();
