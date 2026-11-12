/* ============================================================
 * anims/presets.js — 预置动画库
 * 每个预置动画：function(host, params) → 在 host 内建 Canvas 动画。
 * ============================================================ */
window.PresetAnims = window.PresetAnims || {};

/* 卡诺循环四冲程动画 + P-V 图同步（第 13 章） */
window.PresetAnims['carnot-cycle'] = function (host) {
  'use strict';
  var canvas = document.createElement('canvas');
  canvas.className = 'anim-canvas';
  canvas.width = 620; canvas.height = 320;
  host.appendChild(canvas);
  var g = canvas.getContext('2d');

  var ML = 56, MB = 40, W = canvas.width - ML - 16, H = canvas.height - 24 - MB;
  var VMIN = 0.6, VMAX = 6.2, PMIN = 0.2, PMAX = 3.6;
  var GAMMA = 5 / 3, TH = 3.2, TC = 1.6; /* 用 PV 乘积代表温度（任意单位） */

  function x(V) { return ML + (V - VMIN) / (VMAX - VMIN) * W; }
  function y(P) { return 24 + H - (P - PMIN) / (PMAX - PMIN) * H; }

  /* 卡诺循环四个顶点：A,B 在高温等温线，C,D 在低温等温线。
     物理一致性：C,D 由绝热关系 TV^(γ-1) = 常数 精确推出，保证四条曲线
     首尾精确闭合、无折点（旧版 VC=3.4, VD=1.7 不满足绝热关系，是错误的） */
  var ADI_EXP = 1 / (GAMMA - 1); /* 1/(γ-1) = 1.5 */
  var VA = 1.0, VB = 2.0;
  var VC = VB * Math.pow(TH / TC, ADI_EXP); /* = 2·2^1.5 ≈ 5.657 */
  var VD = VA * Math.pow(TH / TC, ADI_EXP); /* = 1·2^1.5 ≈ 2.828 */
  function pIso(T, V) { return T / V; }
  function pAdi(P0, V0, V) { return P0 * Math.pow(V0 / V, GAMMA); }
  var PA = pIso(TH, VA), PB = pIso(TH, VB), PC = pIso(TC, VC), PD = pIso(TC, VD);

  var STAGES = [
    { name: '① 等温膨胀（吸热 Q₁，T = T_H）', color: '#EF4444' },
    { name: '② 绝热膨胀（Q = 0，温度下降）', color: '#F59E0B' },
    { name: '③ 等温压缩（放热 Q₂，T = T_C）', color: '#3B82F6' },
    { name: '④ 绝热压缩（Q = 0，温度上升）', color: '#10B981' }
  ];

  function path(stage, seg) {
    var pts = [], i, t, v, p;
    var N = 40;
    if (stage === 0) { for (i = 0; i <= N; i++) { t = i / N; v = VA + (VB - VA) * t; pts.push([v, pIso(TH, v)]); } }
    if (stage === 1) { for (i = 0; i <= N; i++) { t = i / N; v = VB + (VC - VB) * t; pts.push([v, pAdi(PB, VB, v)]); } }
    if (stage === 2) { for (i = 0; i <= N; i++) { t = i / N; v = VC + (VD - VC) * t; pts.push([v, pIso(TC, v)]); } }
    if (stage === 3) { for (i = 0; i <= N; i++) { t = i / N; v = VD + (VA - VD) * t; pts.push([v, pAdi(PD, VD, v)]); } }
    return pts.slice(0, Math.max(2, Math.floor(pts.length * seg) + 1));
  }

  var t0 = performance.now();
  var playing = true;
  var btn = document.createElement('button');
  btn.textContent = '⏸ 暂停';
  btn.style.cssText = 'margin-top:8px;border:1px solid #263349;background:#0B1424;color:#E5E7EB;border-radius:6px;padding:4px 12px;cursor:pointer';
  btn.addEventListener('click', function () {
    playing = !playing;
    btn.textContent = playing ? '⏸ 暂停' : '▶ 播放';
    if (playing) { t0 = performance.now() - pausedAt; tick(); }
  });
  host.appendChild(btn);
  var pausedAt = 0;

  function tick() {
    if (!playing) { pausedAt = performance.now() - t0; return; }
    var t = ((performance.now() - t0) / 1000) % 8; /* 8 秒一个循环 */
    var stage = Math.floor(t / 2), seg = (t % 2) / 2;

    g.clearRect(0, 0, canvas.width, canvas.height);
    /* 坐标轴 */
    g.strokeStyle = '#3B4A68'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x(VMIN), y(PMIN)); g.lineTo(x(VMAX), y(PMIN)); g.moveTo(x(VMIN), y(PMIN)); g.lineTo(x(VMIN), y(PMAX)); g.stroke();
    g.fillStyle = '#8B95A7'; g.font = '12px sans-serif';
    g.fillText('V', canvas.width - 22, y(PMIN) + 20);
    g.fillText('P', ML - 18, 20);

    /* 完整循环轮廓（淡）；等温实线、绝热虚线，与结构拆解图保持一致 */
    for (var s = 0; s < 4; s++) {
      var pts = path(s, 1);
      g.strokeStyle = 'rgba(139,149,167,.35)'; g.lineWidth = 1;
      g.setLineDash(s === 1 || s === 3 ? [6, 5] : []);
      g.beginPath();
      pts.forEach(function (p, i) { if (i === 0) g.moveTo(x(p[0]), y(p[1])); else g.lineTo(x(p[0]), y(p[1])); });
      g.stroke();
    }
    g.setLineDash([]);
    /* 顶点标注 A B C D */
    g.fillStyle = '#E5E7EB'; g.font = 'bold 12px sans-serif';
    g.fillText('A', x(VA) - 14, y(PA) + 2);
    g.fillText('B', x(VB) + 9, y(PB) + 2);
    g.fillText('C', x(VC) + 6, y(PC) + 14);
    g.fillText('D', x(VD) - 16, y(PD) + 12);
    /* 已完成阶段 + 当前阶段（绝热阶段虚线，与等温实线明确区分） */
    for (var s2 = 0; s2 <= stage; s2++) {
      var frac = s2 === stage ? seg : 1;
      var pts2 = path(s2, frac);
      g.strokeStyle = STAGES[s2].color; g.lineWidth = 3;
      g.setLineDash(s2 === 1 || s2 === 3 ? [9, 6] : []);
      g.beginPath();
      pts2.forEach(function (p, i) { if (i === 0) g.moveTo(x(p[0]), y(p[1])); else g.lineTo(x(p[0]), y(p[1])); });
      g.stroke();
      g.setLineDash([]);
      if (s2 === stage) {
        var last = pts2[pts2.length - 1];
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(x(last[0]), y(last[1]), 6, 0, Math.PI * 2); g.fill();
      }
    }
    /* 线型图例 */
    g.fillStyle = '#8B95A7'; g.font = '11px sans-serif';
    g.fillText('实线＝等温　虚线＝绝热', ML, canvas.height - 12);

    /* 吸放热标注：随过程进度出现（已完成的阶段常显，当前阶段走过 35% 后浮现） */
    var NOTES = [
      { v: (VA + VB) / 2, p: pIso(TH, (VA + VB) / 2), dx: -16, dy: -18, text: '吸热 Q₁', color: '#EF4444' },
      { v: (VB + VC) / 2, p: pAdi(PB, VB, (VB + VC) / 2), dx: -4, dy: -14, text: 'Q = 0', color: '#F59E0B' },
      { v: (VC + VD) / 2, p: pIso(TC, (VC + VD) / 2), dx: -16, dy: 24, text: '放热 Q₂', color: '#3B82F6' },
      { v: (VD + VA) / 2, p: pAdi(PD, VD, (VD + VA) / 2), dx: -34, dy: 4, text: 'Q = 0', color: '#10B981' }
    ];
    g.font = 'bold 13px sans-serif';
    for (var s3 = 0; s3 < 4; s3++) {
      if (s3 < stage || (s3 === stage && seg > 0.35)) {
        var nt = NOTES[s3];
        g.fillStyle = nt.color;
        g.fillText(nt.text, x(nt.v) + nt.dx, y(nt.p) + nt.dy);
      }
    }
    /* 循环将近完成时：点出净功的几何意义 */
    if (stage === 3 && seg > 0.7) {
      g.fillStyle = '#E5E7EB'; g.font = 'bold 13px sans-serif';
      g.fillText('净功 W = Q₁ − |Q₂|', x(2.6), y(1.35));
      g.fillText('＝ 闭合曲线包围的面积', x(2.6), y(1.15));
    }
    /* 阶段标注 */
    g.font = 'bold 15px sans-serif';
    g.fillStyle = STAGES[stage].color;
    g.fillText(STAGES[stage].name, ML, 20);
    g.fillStyle = '#8B95A7'; g.font = '12px sans-serif';
    g.fillText('η = 1 − T_C/T_H = 1 − ' + TC.toFixed(1) + '/' + TH.toFixed(1) + ' = ' +
      ((1 - TC / TH) * 100).toFixed(0) + '%', canvas.width - 190, 20);

    requestAnimationFrame(tick);
  }
  tick();
};
