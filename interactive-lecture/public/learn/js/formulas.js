/* ============================================================
 * formulas.js — 公式速查页：聚合 15 章全部独立公式
 * 分组：学科 → 章节 → 公式卡片（KaTeX 渲染 + 式号 + 所在节）
 * 支持：关键词过滤 + 学科筛选
 * ============================================================ */
(function () {
  'use strict';

  var CH_IDS = ['ch01','ch02','ch03','ch04','ch05','ch06','ch07','ch08',
                'ch09','ch10','ch11','ch12','ch13','ch14','ch15'];

  var root = document.getElementById('fx-root');
  var qEl = document.getElementById('fx-q');
  var chipsEl = document.getElementById('fx-chips');
  var countEl = document.getElementById('fx-count');

  var ALL = [];        /* {subject, scolor, chid, chtitle, sec, label, latex} */
  var activeSubject = null;
  var subjectsMeta = [];

  /* 递归收集公式，跟踪所在节标题（state.sec 随文档顺序前进） */
  function collect(blocks, state, out) {
    (blocks || []).forEach(function (b) {
      if (!b || typeof b !== 'object') return;
      if (b.type === 'section' && b.title) state.sec = b.title;
      if (b.type === 'homework') state.sec = '本章作业';
      if (b.type === 'formula' && b.latex) {
        out.push({ sec: state.sec, label: b.label || '', latex: b.latex });
      }
      ['blocks', 'children', 'content', 'items', 'steps'].forEach(function (k) {
        if (Array.isArray(b[k])) collect(b[k], state, out);
      });
    });
  }

  function load() {
    var pj = fetch('data/subjects.json').then(function (r) { return r.json(); });
    var pcs = CH_IDS.map(function (id) {
      return fetch('data/chapters/' + id + '.json').then(function (r) { return r.json(); });
    });
    Promise.all([pj].concat(pcs)).then(function (arr) {
      var subs = arr[0].subjects;
      var byCh = {};
      subs.forEach(function (s) {
        (s.links || []).forEach(function (l) { byCh[l.id] = s; });
      });
      subjectsMeta = subs;
      arr.slice(1).forEach(function (data, i) {
        var id = CH_IDS[i];
        var s = byCh[id] || { name: '其他', color: '#3B82F6' };
        var out = [];
        collect(data.blocks, { sec: '（章首）' }, out);
        out.forEach(function (f) {
          ALL.push({
            subject: s.name, scolor: s.color, chid: id,
            chtitle: '第 ' + data.chapter + ' 章　' + data.title,
            sec: f.sec, label: f.label, latex: f.latex
          });
        });
      });
      buildChips();
      render();
    }).catch(function (e) {
      root.innerHTML = '<div class="fx-empty">公式数据加载失败：' + e.message + '</div>';
    });
  }

  function buildChips() {
    chipsEl.innerHTML = '';
    var all = document.createElement('button');
    all.className = 'fx-chip on';
    all.textContent = '全部';
    all.addEventListener('click', function () { activeSubject = null; syncChips(); render(); });
    chipsEl.appendChild(all);
    subjectsMeta.forEach(function (s) {
      var c = document.createElement('button');
      c.className = 'fx-chip';
      c.textContent = s.name;
      c.dataset.subject = s.name;
      c.style.setProperty('--sc', s.color);
      c.addEventListener('click', function () {
        activeSubject = (activeSubject === s.name ? null : s.name);
        syncChips(); render();
      });
      chipsEl.appendChild(c);
    });
  }

  function syncChips() {
    Array.prototype.forEach.call(chipsEl.children, function (c, i) {
      var on = i === 0 ? !activeSubject : c.dataset.subject === activeSubject;
      c.classList.toggle('on', on);
      if (on && i > 0) c.style.background = c.style.getPropertyValue('--sc');
      else if (i > 0) c.style.background = '#fff';
      if (i === 0) c.style.background = on ? '#334155' : '#fff';
    });
  }

  function match(f, q) {
    if (!q) return true;
    q = q.toLowerCase();
    return (f.label + ' ' + f.sec + ' ' + f.chtitle + ' ' + f.latex)
      .toLowerCase().indexOf(q) >= 0;
  }

  function render() {
    var q = qEl.value.trim();
    var list = ALL.filter(function (f) {
      return (!activeSubject || f.subject === activeSubject) && match(f, q);
    });
    countEl.textContent = '共 ' + list.length + ' 条公式（全站 ' + ALL.length + ' 条）';
    root.innerHTML = '';
    if (!list.length) {
      root.innerHTML = '<div class="fx-empty">没有匹配的公式</div>';
      return;
    }

    /* 分组：学科 → 章节 */
    var bySubject = {};
    list.forEach(function (f) {
      (bySubject[f.subject] = bySubject[f.subject] || {})[f.chtitle + '|' + f.chid] = 1;
    });
    var frag = document.createDocumentFragment();
    var renderQueue = [];

    Object.keys(bySubject).forEach(function (sname) {
      var sDiv = document.createElement('div');
      sDiv.className = 'fx-subject';
      var sc = (subjectsMeta.filter(function (s) { return s.name === sname; })[0] || {}).color || '#3B82F6';
      sDiv.style.setProperty('--sc', sc);
      sDiv.innerHTML = '<h2>' + sname + '</h2>';

      var chapters = {};
      list.forEach(function (f) {
        if (f.subject !== sname) return;
        var k = f.chtitle + '|' + f.chid;
        (chapters[k] = chapters[k] || []).push(f);
      });
      Object.keys(chapters).sort().forEach(function (k) {
        var parts = k.split('|');
        var cDiv = document.createElement('div');
        cDiv.className = 'fx-chapter';
        cDiv.innerHTML = '<h3><a href="/#catalog' + parts[1] + '&unit=0">' + parts[0] + ' →</a></h3>';
        var grid = document.createElement('div');
        grid.className = 'fx-grid';
        chapters[k].forEach(function (f) {
          var item = document.createElement('div');
          item.className = 'fx-item';
          var body = document.createElement('div');
          item.appendChild(body);
          var meta = document.createElement('div');
          meta.className = 'fx-meta';
          meta.innerHTML = '<span class="sec">' + (f.sec || '') + '</span>' +
                           '<span>' + (f.label || '') + '</span>';
          item.appendChild(meta);
          grid.appendChild(item);
          renderQueue.push({ el: body, latex: f.latex });
        });
        cDiv.appendChild(grid);
        sDiv.appendChild(cDiv);
      });
      frag.appendChild(sDiv);
    });
    root.appendChild(frag);

    /* 分批渲染 KaTeX，避免长列表卡顿 */
    var i = 0;
    (function batch() {
      var t0 = Date.now();
      while (i < renderQueue.length && Date.now() - t0 < 24) {
        var r = renderQueue[i++];
        if (window.katex) {
          try {
            window.katex.render(r.latex, r.el, { displayMode: true, throwOnError: false });
          } catch (e) { r.el.textContent = r.latex; }
        } else r.el.textContent = r.latex;
      }
      if (i < renderQueue.length) setTimeout(batch, 0);
    })();
  }

  var deb = null;
  qEl.addEventListener('input', function () {
    clearTimeout(deb); deb = setTimeout(render, 160);
  });

  load();
})();
