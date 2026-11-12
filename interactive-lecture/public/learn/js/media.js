/* ============================================================
 * media.js — 媒体组积木公共逻辑
 * 统一外壳（标题栏 + 主体 + 说明 + 学科色边框）、懒加载、失败降级。
 * ============================================================ */
window.MediaBlocks = (function () {
  'use strict';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* 统一外壳 */
  function shell(block, defaultTitle) {
    var n = el('div', 'b-media');
    n.appendChild(el('div', 'media-head', block.title || defaultTitle));
    var body = el('div', 'media-body');
    n.appendChild(body);
    if (block.caption) n.appendChild(el('div', 'media-cap', block.caption));
    return { root: n, body: body };
  }

  function fallback(body, msg) {
    body.innerHTML = '';
    body.appendChild(el('div', 'media-fallback', '⚠ ' + msg));
  }

  /* 懒加载：进入视口才初始化 */
  function lazy(host, initFn) {
    if (!('IntersectionObserver' in window)) { initFn(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.disconnect(); initFn(); }
      });
    }, { rootMargin: '200px' });
    io.observe(host);
  }

  return {
    /* 视频：local / bilibili / youtube */
    video: function (b) {
      var s = shell(b, '视频');
      lazy(s.root, function () {
        try {
          if (b.source === 'local') {
            var v = el('video');
            v.controls = true;
            if (b.poster) v.poster = b.poster;
            v.src = b.src;
            if (b.startAt) v.addEventListener('loadedmetadata', function () { v.currentTime = b.startAt; });
            v.onerror = function () { fallback(s.body, '本地视频加载失败：' + b.src); };
            s.body.appendChild(v);
          } else if (b.source === 'bilibili') {
            var ifr = el('iframe');
            ifr.src = 'https://player.bilibili.com/player.html?bvid=' + encodeURIComponent(b.bvid) +
                      '&page=' + (b.page || 1) + '&autoplay=0';
            ifr.allowFullscreen = true;
            ifr.setAttribute('loading', 'lazy');
            ifr.onerror = function () { fallback(s.body, 'B 站视频嵌入失败：' + b.bvid); };
            s.body.appendChild(ifr);
          } else if (b.source === 'youtube') {
            var ify = el('iframe');
            ify.src = 'https://www.youtube.com/embed/' + encodeURIComponent(b.videoId) +
                      (b.startAt ? '?start=' + b.startAt : '');
            ify.allowFullscreen = true;
            ify.setAttribute('loading', 'lazy');
            ify.onerror = function () { fallback(s.body, 'YouTube 视频嵌入失败：' + b.videoId); };
            s.body.appendChild(ify);
          } else {
            fallback(s.body, '未知视频来源：' + b.source);
          }
        } catch (e) { fallback(s.body, '视频初始化异常：' + e.message); }
      });
      return s.root;
    },

    /* 动画：preset / lottie / svg / css */
    animation: function (b) {
      var s = shell(b, '动画演示');
      var host = el('div', 'anim-host');
      s.body.appendChild(host);
      lazy(s.root, function () {
        try {
          if (b.animType === 'preset') {
            var anim = window.PresetAnims && window.PresetAnims[b.preset];
            if (anim) anim(host, b.params || {});
            else fallback(s.body, '未注册的预置动画：' + b.preset);
          } else if (b.animType === 'svg') {
            var img = el('img');
            img.src = b.src; img.style.width = '100%';
            img.onerror = function () { fallback(s.body, 'SVG 动画加载失败：' + b.src); };
            host.appendChild(img);
          } else if (b.animType === 'css') {
            host.innerHTML = b.html || '';
            if (b.css) { var st = el('style'); st.textContent = b.css; host.appendChild(st); }
          } else if (b.animType === 'lottie') {
            fallback(s.body, 'Lottie 动画将在后续版本接入（' + (b.src || '未指定 src') + '）');
          } else {
            fallback(s.body, '未知动画类型：' + b.animType);
          }
        } catch (e) { fallback(s.body, '动画初始化异常：' + e.message); }
      });
      return s.root;
    },

    /* 音频 */
    audio: function (b) {
      var s = shell(b, '音频');
      lazy(s.root, function () {
        var a = el('audio');
        a.controls = true; a.src = b.src;
        a.onerror = function () { fallback(s.body, '音频加载失败：' + b.src); };
        s.body.appendChild(a);
        if (b.waveform) {
          var c = el('canvas', 'anim-canvas');
          c.height = 48;
          s.body.appendChild(c);
          drawWaveform(c, b.src);
        }
      });
      return s.root;
    },

    /* 通用外部嵌入（PhET / GeoGebra 等） */
    embed: function (b) {
      var s = shell(b, '外部嵌入');
      lazy(s.root, function () {
        var ifr = el('iframe');
        ifr.src = b.src;
        ifr.title = b.title || '外部交互内容';
        if (b.allow) ifr.setAttribute('allow', b.allow);
        ifr.setAttribute('loading', 'lazy');
        if (b.ratio) ifr.style.aspectRatio = b.ratio;
        ifr.onerror = function () { fallback(s.body, '外部内容加载失败：' + b.src); };
        s.body.appendChild(ifr);
      });
      return s.root;
    },

    /* 图组对比 */
    gallery: function (b) {
      var s = shell(b, '图组对比');
      var layout = String(b.layout || '2-col').replace('-', ''); /* 2-col → 2col */
      var grid = el('div', 'gallery-' + layout);
      (b.images || []).forEach(function (img) {
        var f = el('figure');
        var im = el('img');
        im.src = img.src; im.alt = img.caption || ''; im.loading = 'lazy';
        im.onerror = function () { im.replaceWith(el('div', 'media-fallback', '⚠ 图像缺失：' + img.src)); };
        f.appendChild(im);
        if (img.caption) f.appendChild(el('figcaption', null, img.caption));
        grid.appendChild(f);
      });
      s.body.appendChild(grid);
      return s.root;
    },

    /* 3D 交互（Three.js 预置场景，WebGL 不可用时降级） */
    interactive3d: function (b) {
      var s = shell(b, '3D 交互场景');
      var host = el('div', 'd3-host');
      s.body.appendChild(host);
      lazy(s.root, function () {
        var scene = window.Scenes3D && window.Scenes3D[b.sceneId];
        if (!scene) { fallback(s.body, '未注册的 3D 场景：' + b.sceneId); return; }
        try { scene(host, b.params || {}, function () { fallbackWithImage(); }); }
        catch (e) { fallbackWithImage(); }
        function fallbackWithImage() {
          if (b.fallback) {
            host.innerHTML = '';
            var img = el('img');
            img.src = b.fallback; img.style.width = '100%';
            host.appendChild(img);
          } else {
            fallback(s.body, '当前设备不支持 WebGL，已跳过 3D 场景。');
          }
        }
      });
      return s.root;
    }
  };

  /* 简易波形绘制（Web Audio 解码失败时画静态示意波形） */
  function drawWaveform(canvas, src) {
    var ctx = canvas.getContext('2d');
    function draw(bars) {
      var w = canvas.width = canvas.clientWidth || 600;
      var h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#7DD3FC';
      var bw = w / bars.length;
      bars.forEach(function (v, i) {
        var bh = Math.max(2, v * h * 0.9);
        ctx.fillRect(i * bw + 1, (h - bh) / 2, bw - 2, bh);
      });
    }
    fetch(src).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      var AC = window.AudioContext || window.webkitAudioContext;
      return new AC().decodeAudioData(buf);
    }).then(function (audio) {
      var raw = audio.getChannelData(0);
      var bars = [];
      var step = Math.floor(raw.length / 120);
      for (var i = 0; i < 120; i++) {
        var sum = 0;
        for (var j = 0; j < step; j++) sum += Math.abs(raw[i * step + j] || 0);
        bars.push(sum / step);
      }
      draw(bars);
    }).catch(function () {
      var bars = [];
      for (var i = 0; i < 120; i++) bars.push(Math.abs(Math.sin(i * 0.3)) * 0.6 + 0.1);
      draw(bars);
    });
  }
})();
