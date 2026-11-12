/* ============================================================
 * renderer.js — 积木渲染引擎（核心，固定不变）
 * 内容创作者只编写 data/chapters/*.json，永不修改本文件。
 * 新增积木类型：在 BlockRenderers 中注册新 type 即可，完全向后兼容。
 * ============================================================ */
window.Renderer = (function () {
  'use strict';

  /* 段落级 AI 展开讲解适用的积木类型（档位 A） */
  var EXPLAINABLE = ['text', 'formula', 'callout', 'example'];

  /* ---------- 工具 ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function tex(node, latex, display) {
    if (window.katex) {
      try { window.katex.render(latex, node, { displayMode: !!display, throwOnError: false }); return; }
      catch (e) { /* fall through */ }
    }
    node.textContent = latex; // KaTeX 未加载时降级为源码文本
  }

  /* ---------- 段落级 AI 展开讲解包装 ---------- */
  function wrapExplainable(node, block, ctx) {
    var wrap = el('div', 'block block-with-explain');
    wrap.appendChild(node);
    var btn = el('button', 'explain-btn');
    btn.type = 'button';
    btn.title = '让 AI 展开讲解这一段';
    btn.textContent = '✦';
    var sectionAtCreate = ctx.currentSection || '（章首）';   /* 创建时快照：ctx.currentSection 会随后续小节渲染而变 */
    btn.addEventListener('click', function () {
      var text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 600);
      window.ExplainPanel && window.ExplainPanel.open({
        chapter: ctx.chapterTitle,
        chapterId: ctx.chapterId,
        section: sectionAtCreate,
        blockType: block.type,
        text: text
      });
    });
    wrap.appendChild(btn);
    return wrap;
  }

  /* ---------- 18 种积木渲染器 ---------- */
  var BlockRenderers = {

    /* --- 内容组 --- */
    intro: function (b) {
      var n = el('div', 'b-intro');
      n.appendChild(el('p', 'summary', b.summary));
      if (b.prerequisites && b.prerequisites.length) {
        n.appendChild(el('h5', null, '先修要求'));
        n.appendChild(el('ul', null, b.prerequisites.map(function (x) { return '<li>' + x + '</li>'; }).join('')));
      }
      if (b.objectives && b.objectives.length) {
        n.appendChild(el('h5', null, '学习目标'));
        n.appendChild(el('ul', null, b.objectives.map(function (x) { return '<li>' + x + '</li>'; }).join('')));
      }
      return n;
    },

    section: function (b, ctx) {
      ctx.currentSection = (b.number ? b.number + ' ' : '') + b.title;
      var n = el('h2', 'b-section');
      n.id = 'sec-' + ctx.sectionSeq++;
      if (b.number) n.appendChild(el('span', 'sec-chip', b.number));
      n.appendChild(el('span', 'sec-title', b.title));
      /* 点按本节横幅上的按钮，就本节内容调出 AI 讨论 */
      var db = el('button', 'sec-discuss', '💬 讨论本节');
      db.type = 'button';
      db.addEventListener('click', function (ev) {
        ev.stopPropagation();
        /* 收集本节正文（本横幅到下一横幅之间的文本积木）作为讨论上下文 */
        var parts = [], sib = n.nextElementSibling;
        while (sib && !(sib.classList && sib.classList.contains('b-section'))) {
          if (sib.classList && (sib.classList.contains('b-text') || sib.classList.contains('b-callout'))) {
            parts.push(sib.textContent.trim());
          }
          sib = sib.nextElementSibling;
        }
        var secLabel = (b.number ? b.number + ' ' : '') + b.title;
        if (window.ExplainPanel) {
          window.ExplainPanel.open({
            chapter: ctx.chapterId,
            section: secLabel,
            text: ('【整节讨论】' + secLabel + '\n' + parts.join('\n')).slice(0, 1500)
          });
        }
      });
      n.appendChild(db);
      ctx.toc.push({ id: n.id, label: (b.number ? b.number + '　' : '') + b.title });
      return n;
    },

    text: function (b) {
      return el('div', 'b-text', '<p>' + b.html + '</p>');
    },

    formula: function (b, ctx) {
      var n = el('div', 'b-formula');
      var body = el('div', 'f-body');
      tex(body, b.latex, true);
      n.appendChild(body);
      if (b.label) n.appendChild(el('span', 'f-label', b.label));
      ctx.formulas.push({ latex: b.latex, label: b.label || '' });
      return n;
    },

    callout: function (b) {
      var n = el('div', 'b-callout co-' + (b.calloutType || b.variant || 'info'));
      if (b.title) n.appendChild(el('div', 'co-title', b.title));
      n.appendChild(el('div', 'co-body', b.body));
      return n;
    },

    table: function (b) {
      var n = el('div', 'b-table');
      var t = el('table');
      t.appendChild(el('thead', null, '<tr>' + b.headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>'));
      var tbody = el('tbody');
      b.rows.forEach(function (row) {
        tbody.appendChild(el('tr', null, row.map(function (c) { return '<td>' + c + '</td>'; }).join('')));
      });
      t.appendChild(tbody);
      if (b.caption) t.appendChild(el('caption', null, b.caption));
      n.appendChild(t);
      return n;
    },

    figure: function (b) {
      var n = el('figure', 'b-figure');
      var img = el('img');
      img.src = b.src; img.alt = b.caption || '';
      img.loading = 'lazy';
      img.onerror = function () { img.replaceWith(el('div', 'media-fallback', '⚠ 图像加载失败：' + b.src)); };
      n.appendChild(img);
      if (b.caption) n.appendChild(el('figcaption', null, b.caption));
      return n;
    },

    /* --- 交互组 --- */
    simulation: function (b) {
      var n = el('div', 'b-sim');
      var head = el('div', 'sim-head');
      head.appendChild(el('span', 'sim-title', '⚙ ' + (b.title || b.simId)));
      if (b.hint) head.appendChild(el('span', 'sim-hint', b.hint));
      n.appendChild(head);
      var body = el('div', 'sim-body');
      var canvasHost = el('div', 'sim-canvas-host');
      var panelHost = el('div', 'sim-panel');
      body.appendChild(canvasHost); body.appendChild(panelHost);
      n.appendChild(body);
      // 延迟初始化，确保元素已进 DOM 且有尺寸
      requestAnimationFrame(function () {
        var sim = window.Sims && window.Sims[b.simId];
        if (sim) sim.init({ canvasHost: canvasHost, panelHost: panelHost, params: b.params || {} });
        else canvasHost.appendChild(el('div', 'media-fallback', '⚠ 未注册的仿真模块：' + b.simId));
      });
      return n;
    },

    socratic: function (b) {
      var host = el('div');
      requestAnimationFrame(function () {
        window.Socratic && window.Socratic.mount(host, b);
      });
      return host;
    },

    /* --- 媒体组（统一外壳 + 懒加载，逻辑在 media.js） --- */
    video: function (b) { return window.MediaBlocks.video(b); },
    animation: function (b) { return window.MediaBlocks.animation(b); },
    audio: function (b) { return window.MediaBlocks.audio(b); },
    embed: function (b) { return window.MediaBlocks.embed(b); },
    gallery: function (b) { return window.MediaBlocks.gallery(b); },
    'interactive-3d': function (b) { return window.MediaBlocks.interactive3d(b); },

    /* --- 练习组 --- */
    example: function (b) {
      var n = el('details', 'b-example');
      n.appendChild(el('summary', null, '📖 ' + (b.title || '例题')));
      var body = el('div', 'ex-body');
      body.appendChild(el('div', 'ex-problem', b.problem));
      if (b.solution_steps && b.solution_steps.length) {
        body.appendChild(el('div', null, '<strong>分步详解</strong>'));
        body.appendChild(el('ol', 'steps', b.solution_steps.map(function (s) { return '<li>' + s + '</li>'; }).join('')));
      }
      if (b.answer) body.appendChild(el('div', 'ex-answer', '<strong>答案：</strong>' + b.answer));
      n.appendChild(body);
      return n;
    },

    homework: function (b, ctx) {
      /* 作业独立成段：与小节同款的横幅标题 + 进目录；
         目录下挂两个子入口：🦉 苏格拉底式讨论、✏️ 课后练习 */
      var wrap = el('div', 'b-homework-wrap');
      var head = el('h2', 'b-section b-section-hw');
      head.id = 'sec-homework';
      head.appendChild(el('span', 'sec-chip', '📝'));
      head.appendChild(el('span', 'sec-title', b.title || '本章作业'));
      ctx.toc.push({ id: head.id, label: '📝　' + (b.title || '本章作业') });
      wrap.appendChild(head);
      /* 苏格拉底式讨论：作业区内的特色板块，特色子横幅 + 目录醒目子入口 */
      if (b.socratic) {
        var socHead = el('h3', 'b-section-soc');
        var socSessions = b.socratic.sessions || [];
        if (socSessions.length === 1 && socSessions[0].layout === 'presentation-side') {
          socHead.classList.add('soc-presentation-head');
        }
        socHead.id = 'sec-socratic';
        /* 猫头鹰徽章：与左侧目录入口统一用 🦉（智慧之鸮） */
        socHead.appendChild(el('span', 'soc-avatar', '🦉'));
        socHead.appendChild(el('span', 'sec-title', '苏格拉底式讨论 · AI 引导式追问'));
        wrap.appendChild(socHead);
        var socHost = el('div');
        requestAnimationFrame(function () {
          window.Socratic && window.Socratic.mount(socHost, b.socratic);
        });
        wrap.appendChild(socHost);
        ctx.toc.push({ id: socHead.id, label: '🦉　苏格拉底式讨论', cls: 'toc-soc toc-sub' });
      }
      /* 课后练习：作业区内的第二个子板块，独立子横幅 + 目录子入口 */
      var exHead = el('h3', 'b-section-soc b-section-ex');
      exHead.id = 'sec-exercises';
      exHead.appendChild(el('span', 'soc-avatar', '✏️'));
      exHead.appendChild(el('span', 'sec-title', '课后练习 · 按课次分批提交'));
      wrap.appendChild(exHead);
      ctx.toc.push({ id: exHead.id, label: '✏️　课后练习', cls: 'toc-sub' });
      var host = el('div');
      requestAnimationFrame(function () {
        window.Homework && window.Homework.mount(host, b, ctx.chapterId);
      });
      wrap.appendChild(host);
      return wrap;
    },

    /* --- 结构组 --- */
    divider: function () { return el('hr', 'b-divider'); }
  };

  /* ---------- 主入口 ---------- */
  function renderChapter(data, container) {
    var ctx = {
      chapterId: data.id,
      chapterTitle: '第 ' + data.chapter + ' 章 ' + data.title,
      currentSection: '',
      sectionSeq: 1,
      toc: [],
      formulas: []
    };
    document.documentElement.style.setProperty('--subject', subjectColor(data.subject));

    (data.blocks || []).forEach(function (block) {
      var fn = BlockRenderers[block.type];
      var node;
      if (!fn) {
        node = el('div', 'block media-fallback', '⚠ 未知积木类型：' + block.type);
      } else {
        node = fn(block, ctx);
      }
      node.classList.add('reveal');
      if (EXPLAINABLE.indexOf(block.type) >= 0) {
        container.appendChild(wrapExplainable(node, block, ctx));
      } else {
        var outer = el('div', 'block');
        outer.appendChild(node);
        container.appendChild(outer);
      }
    });
    return ctx;
  }

  function subjectColor(id) {
    var map = {
      mechanics: '#F59E0B', electromagnetism: '#06B6D4', oscillation: '#3B82F6',
      optics: '#7C3AED', thermal: '#EF4444', modern: '#10B981'
    };
    return map[id] || '#EF4444';
  }

  return { render: renderChapter, renderers: BlockRenderers };
})();
