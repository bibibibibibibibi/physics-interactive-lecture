/* ============================================================
 * sims/pv-diagram.js — P-V 图热力学过程模拟器（第 13 章核心仿真）
 * 交互：拖动状态点 A，选择过程类型，拖动手柄沿过程曲线到达 B，
 * 实时计算 W（功）、ΔU（内能变化）、Q（热量）。
 * 模型：单原子理想气体，Cv = 3R/2，γ = 5/3。
 * ============================================================ */
window.Sims = window.Sims || {};
window.Sims['pv-diagram'] = (function () {
  'use strict';

  var R = 8.314, CV = 1.5 * R, GAMMA = 5 / 3;
  /* 坐标范围：V ∈ [0.5, 6] L → 用 m³×10⁻³；P ∈ [0.5, 6] atm → Pa×10⁵ */
  var VMIN = 0.5, VMAX = 6, PMIN = 0.5, PMAX = 6;

  function init(hosts) {
    var canvasHost = hosts.canvasHost, panel = hosts.panelHost;

    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = 640; canvas.height = 440;
    canvasHost.appendChild(canvas);
    var g = canvas.getContext('2d');

    /* 状态：A、B 两点（V 单位 L，P 单位 atm）；物质的量固定 1 mol，
       坐标刻度与参考等温线全部固定，避免「线不动只变温度数」的错觉 */
    var state = { n: 1, process: 'isothermal', A: { V: 1.5, P: 4 }, B: { V: 3.2, P: 0 } };
    state.B.P = pOnCurve(state.process, state.A, state.B.V);

    /* ----- 控制面板 ----- */
    panel.innerHTML =
      '<label>过程类型</label>' +
      '<select id="pv-proc">' +
      '<option value="isothermal">等温过程</option>' +
      '<option value="isobaric">等压过程</option>' +
      '<option value="isochoric">等容过程</option>' +
      '<option value="adiabatic">绝热过程</option>' +
      '</select>' +
      '<div class="sim-readouts">' +
      '<div class="row"><span>T (A)</span><span class="val" id="pv-ta">—</span></div>' +
      '<div class="row"><span>T (B)</span><span class="val" id="pv-tb">—</span></div>' +
      '<div class="row"><span>功 W (气体对外)</span><span class="val" id="pv-w">—</span></div>' +
      '<div class="row"><span>内能 ΔU</span><span class="val" id="pv-du">—</span></div>' +
      '<div class="row"><span>热量 Q (吸热为正)</span><span class="val" id="pv-q">—</span></div>' +
      '</div>' +
      '<label style="margin-top:12px;color:#8B95A7">1 mol 单原子理想气体；拖动 A 点改变初态，拖动 ◇ 手柄沿曲线改变末态；浅色线为固定温度的等温线</label>';

    var procSel = panel.querySelector('#pv-proc');
    procSel.addEventListener('change', function () {
      state.process = procSel.value;
      if (state.process === 'isochoric') {
        /* 等容：V 锁定为 A.V，B 只沿竖直线滑动；给 B 一个合理的初始压强 */
        state.B = { V: state.A.V,
                    P: Math.min(PMAX, Math.max(PMIN + 0.2, state.A.P * 0.6)) };
      } else {
        /* 从等容切出时 B 与 A 重合（V 相同），给 B 一个展开的初值 */
        if (state.B.V === state.A.V || state.B.P == null) {
          state.B.V = Math.min(VMAX, state.A.V * 1.6 + 0.4);
        }
        state.B.P = pOnCurve(state.process, state.A, state.B.V);
      }
      draw();
    });

    /* ----- 物理 ----- */
    function T_of(V, P) { return (P * 1e5 * V * 1e-3) / (state.n * R); } // K
    function pOnCurve(proc, A, V) {
      if (proc === 'isobaric') return A.P;
      if (proc === 'isochoric') return null; // V 固定
      if (proc === 'isothermal') return A.P * A.V / V;
      return A.P * Math.pow(A.V / V, GAMMA); // adiabatic
    }
    function work(proc, A, B) { // J，气体对外做功
      var Pa = A.P * 1e5, Va = A.V * 1e-3, Vb = B.V * 1e-3;
      if (proc === 'isochoric') return 0;
      if (proc === 'isobaric') return Pa * (Vb - Va);
      if (proc === 'isothermal') return state.n * R * T_of(A.V, A.P) * Math.log(Vb / Va);
      return (Pa * Va - B.P * 1e5 * Vb) / (GAMMA - 1); // adiabatic
    }

    /* ----- 坐标映射 ----- */
    var ML = 60, MR = 20, MT = 20, MB = 48;
    function x(V) { return ML + (V - VMIN) / (VMAX - VMIN) * (canvas.width - ML - MR); }
    function y(P) { return canvas.height - MB - (P - PMIN) / (PMAX - PMIN) * (canvas.height - MT - MB); }
    function invX(px) { return VMIN + (px - ML) / (canvas.width - ML - MR) * (VMAX - VMIN); }
    function invY(py) { return PMIN + (canvas.height - MB - py) / (canvas.height - MT - MB) * (PMAX - PMIN); }

    /* ----- 绘制 ----- */
    function draw() {
      var A = state.A;
      if (state.process !== 'isochoric') {
        state.B.P = pOnCurve(state.process, A, state.B.V);
      } else {
        state.B.V = A.V;          /* 等容：B 始终锁在过 A 的竖直线上（拖动 A 也不脱线） */
        if (state.B.P == null) state.B.P = Math.min(PMAX, Math.max(PMIN + 0.2, A.P * 0.6));
      }
      var B = state.B;

      g.clearRect(0, 0, canvas.width, canvas.height);
      /* 网格与坐标轴 */
      g.strokeStyle = '#1E2B44'; g.lineWidth = 1;
      for (var V = 1; V <= 6; V++) { line(x(V), y(PMIN), x(V), y(PMAX)); }
      for (var P = 1; P <= 6; P++) { line(x(VMIN), y(P), x(VMAX), y(P)); }
      g.strokeStyle = '#3B4A68'; g.lineWidth = 1.5;
      line(x(VMIN), y(PMIN), x(VMAX), y(PMIN));
      line(x(VMIN), y(PMIN), x(VMIN), y(PMAX));
      g.fillStyle = '#8B95A7'; g.font = '13px sans-serif';
      g.fillText('V / L', canvas.width - 46, canvas.height - 18);
      g.fillText('P / atm', 12, 26);

      /* 固定温度的参考等温线：n 固定 1 mol，p(v) = nRT/V，T = PV·100/8.314。
         坐标刻度与参考线都不随操作变化，拖动 A/B 时可直观读出
         「初末态各自落在哪两条等温线之间」。 */
      var REF_T = [50, 100, 150, 200, 250, 300];
      for (var ri = 0; ri < REF_T.length; ri++) {
        var Tref = REF_T[ri];
        g.strokeStyle = 'rgba(125,211,252,.18)'; g.lineWidth = 1;
        g.beginPath();
        var started = false, lastPx = 0, lastPy = 0;
        for (var v = VMIN; v <= VMAX; v += 0.05) {
          var p = 0.08314 * Tref / v; // atm（n=1，V 单位 L）
          if (p < PMIN || p > PMAX) continue;
          var px = x(v), py = y(p);
          if (!started) { g.moveTo(px, py); started = true; } else g.lineTo(px, py);
          lastPx = px; lastPy = py;
        }
        g.stroke();
        if (started) {
          g.fillStyle = 'rgba(125,211,252,.55)'; g.font = '11px sans-serif';
          g.fillText(Tref + ' K', Math.min(lastPx - 52, canvas.width - 58), lastPy - 6);
        }
      }

      /* 过程曲线 A→B */
      g.strokeStyle = '#EF4444'; g.lineWidth = 2.5;
      g.beginPath();
      if (state.process === 'isochoric') {
        g.moveTo(x(A.V), y(A.P)); g.lineTo(x(A.V), y(B.P));
      } else {
        var v0 = Math.min(A.V, B.V), v1 = Math.max(A.V, B.V);
        for (var vv = v0; vv <= v1; vv += 0.02) {
          var pp = pOnCurve(state.process, A, vv);
          if (pp == null) continue;
          var xx = x(vv), yy = y(pp);
          if (vv === v0) g.moveTo(xx, yy); else g.lineTo(xx, yy);
        }
      }
      g.stroke();

      /* 做功面积 */
      g.fillStyle = 'rgba(239,68,68,.12)';
      g.beginPath();
      g.moveTo(x(A.V), y(PMIN));
      if (state.process === 'isochoric') {
        g.lineTo(x(A.V), y(A.P));
      } else {
        var va = Math.min(A.V, B.V), vb = Math.max(A.V, B.V);
        for (var v2 = va; v2 <= vb; v2 += 0.02) {
          var p2 = pOnCurve(state.process, A, v2);
          g.lineTo(x(v2), y(p2));
        }
        g.lineTo(x(B.V), y(PMIN));
      }
      g.closePath(); g.fill();

      /* 状态点 */
      dot(x(A.V), y(A.P), '#7DD3FC', 'A');
      dot(x(B.V), y(B.P), '#F59E0B', 'B ◇');

      /* 读数 */
      var TA = T_of(A.V, A.P), TB = T_of(B.V, B.P);
      var W = work(state.process, A, B);
      var DU = state.n * CV * (TB - TA);
      var Q = state.process === 'adiabatic' ? 0 : DU + W;
      set('pv-ta', TA.toFixed(1) + ' K'); set('pv-tb', TB.toFixed(1) + ' K');
      set('pv-w', fmtJ(W)); set('pv-du', fmtJ(DU)); set('pv-q', fmtJ(Q));
    }
    function line(x1, y1, x2, y2) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    function dot(px, py, color, label) {
      g.fillStyle = color;
      g.beginPath(); g.arc(px, py, 7, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#E5E7EB'; g.font = 'bold 13px sans-serif';
      g.fillText(label, px + 10, py - 8);
    }
    function set(id, v) { panel.querySelector('#' + id).textContent = v; }
    function fmtJ(v) { return (v >= 0 ? '+' : '') + v.toFixed(1) + ' J'; }

    /* ----- 拖拽 ----- */
    var dragTarget = null;
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (canvas.width / r.width),
               y: (e.clientY - r.top) * (canvas.height / r.height) };
    }
    canvas.addEventListener('pointerdown', function (e) {
      var p = pos(e);
      var dA = Math.hypot(p.x - x(state.A.V), p.y - y(state.A.P));
      var dB = Math.hypot(p.x - x(state.B.V), p.y - y(state.B.P));
      dragTarget = dA < dB ? (dA < 24 ? 'A' : null) : (dB < 24 ? 'B' : null);
      if (dragTarget) canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragTarget) return;
      var p = pos(e);
      var V = Math.min(VMAX, Math.max(VMIN, invX(p.x)));
      var P = Math.min(PMAX, Math.max(PMIN, invY(p.y)));
      if (dragTarget === 'A') {
        state.A = { V: V, P: P };
      } else {
        if (state.process === 'isochoric') state.B = { V: state.A.V, P: P };
        else state.B = { V: V, P: 0 };
      }
      draw();
    });
    canvas.addEventListener('pointerup', function () { dragTarget = null; });

    draw();
  }

  return { init: init };
})();
