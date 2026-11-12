/* ============================================================
 * textbook-ask.js — 课本阅读页的「划词问 AI」模块（自包含）
 *
 * 两个入口：
 *   1) 鼠标选中正文 ≥8 字 → 浮出「✦ 就选中内容问 AI」
 *   2) window.ExplainPanel.open({chapter, section, text})
 *      （renderer.js 的段落 ✦ 按钮和「💬 讨论本节」按钮调它）
 * 后端契约与交互课堂一致：POST /api/ask {question, context{lecture,slide,bullet}}
 * → {answer}；接口不可用（503/超时）时提示并保留问题，不丢学生输入。
 * 样式随模块自带，页面零接入成本。
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 自带样式（格物浅色体系） ---------- */
  var css = `
  .tba-pop{position:absolute;z-index:60;background:#47675b;color:#faf8e9;font-size:13px;
    border:none;border-radius:999px;padding:7px 14px;cursor:pointer;
    box-shadow:0 4px 14px rgba(39,61,58,.25);font-family:inherit}
  .tba-pop:hover{background:#385545}
  .tba-mask{position:fixed;inset:0;z-index:70;background:rgba(39,61,58,.28)}
  .tba-panel{position:fixed;top:0;right:0;bottom:0;z-index:71;width:min(420px,100vw);
    background:#fdfdf9;border-left:1px solid #d8dcd0;box-shadow:-8px 0 24px rgba(39,61,58,.12);
    display:flex;flex-direction:column;font-size:14px;color:#273d3a}
  .tba-head{display:flex;align-items:center;gap:8px;padding:12px 16px;
    border-bottom:1px solid #d8dcd0;background:#fafaf5}
  .tba-head b{color:#47675b;font-size:14px}
  .tba-head .tba-close{margin-left:auto;background:none;border:none;font-size:16px;
    color:#8a948c;cursor:pointer;padding:4px 8px}
  .tba-head .tba-close:hover{color:#273d3a}
  .tba-ctx{margin:12px 16px 0;padding:10px 12px;background:#f0f2e8;border-left:3px solid #b38e4f;
    border-radius:0 8px 8px 0;font-size:12.5px;color:#3d4f48;max-height:120px;overflow:auto}
  .tba-ctx i{display:block;color:#8a948c;font-style:normal;font-size:11px;margin-bottom:4px}
  .tba-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
  .tba-msg{max-width:92%;padding:9px 12px;border-radius:12px;line-height:1.65;font-size:13.5px}
  .tba-msg.tba-user{align-self:flex-end;background:#47675b;color:#faf8e9}
  .tba-msg.tba-ai{align-self:flex-start;background:#f0f2e8;color:#273d3a}
  .tba-msg.tba-hint{align-self:center;background:none;color:#8a948c;font-size:12px;padding:2px}
  .tba-thinking{color:#8a948c;font-size:13px;align-self:flex-start}
  .tba-input{display:flex;gap:8px;padding:12px 16px;border-top:1px solid #d8dcd0}
  .tba-input input{flex:1;border:1px solid #d8dcd0;border-radius:8px;padding:10px 12px;
    font-size:14px;font-family:inherit;outline:none}
  .tba-input input:focus{border-color:#47675b;box-shadow:0 0 0 2px rgba(71,103,91,.16)}
  .tba-input button{background:#e5c98b;color:#203f32;border:1px solid #e5c98b;border-radius:8px;
    padding:0 16px;font-size:14px;font-weight:600;cursor:pointer}
  .tba-input button:hover{filter:brightness(1.05)}
  .tba-input button:disabled{opacity:.5}
  @media (max-width:640px){
    .tba-panel{top:auto;left:0;right:0;height:72vh;width:auto;border-left:none;
      border-top:1px solid #d8dcd0;border-radius:16px 16px 0 0}
  }`;
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- 面板 ---------- */
  var panel = null, mask = null, msgsBox = null, input = null, sendBtn = null;
  var ctxInfo = { chapter: '', section: '', text: '' };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function ensurePanel() {
    if (panel) return;
    mask = el('div', 'tba-mask');
    panel = el('div', 'tba-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '就选中内容问 AI');

    var head = el('div', 'tba-head');
    head.appendChild(el('b', null, '✦ 课本 AI 讨论'));
    var close = el('button', 'tba-close', '✕');
    close.type = 'button';
    close.addEventListener('click', hide);
    head.appendChild(close);

    msgsBox = el('div', 'tba-msgs');
    var bar = el('div', 'tba-input');
    input = el('input');
    input.placeholder = '就这段内容提问…';
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
    sendBtn = el('button', null, '提问');
    sendBtn.type = 'button';
    sendBtn.addEventListener('click', send);
    bar.appendChild(input); bar.appendChild(sendBtn);

    panel.appendChild(head); panel.appendChild(msgsBox); panel.appendChild(bar);
    mask.addEventListener('click', hide);
    document.body.appendChild(mask);
    document.body.appendChild(panel);
    mask.style.display = 'none';
    panel.style.display = 'none';
  }

  function hide() {
    if (panel) panel.style.display = 'none';
    if (mask) mask.style.display = 'none';
  }

  function addMsg(cls, text) {
    var m = el('div', 'tba-msg ' + cls);
    m.textContent = text;
    msgsBox.appendChild(m);
    msgsBox.scrollTop = msgsBox.scrollHeight;
    return m;
  }

  function send() {
    var q = (input.value || '').trim();
    if (!q || sendBtn.disabled) return;
    input.value = '';
    addMsg('tba-user', q);
    sendBtn.disabled = true;
    var thinking = el('div', 'tba-thinking', 'AI 思考中…');
    msgsBox.appendChild(thinking);
    msgsBox.scrollTop = msgsBox.scrollHeight;
    fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: q,
        context: {
          lecture: ctxInfo.chapter + '（课本阅读）',
          slide: ctxInfo.section,
          bullet: ctxInfo.text.slice(0, 600),
          narration: '', qa: '',
        },
      }),
      signal: AbortSignal.timeout(35000),
    }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }).then(function (d) {
      thinking.remove();
      addMsg('tba-ai', d.answer || '（空回复）');
    }).catch(function () {
      thinking.remove();
      addMsg('tba-hint', 'AI 答疑服务暂不可用（未配置或服务离线），你的问题已保留在对话里，可稍后重试。');
    }).finally(function () { sendBtn.disabled = false; input.focus(); });
  }

  /* ---------- 对外：ExplainPanel.open ---------- */
  window.ExplainPanel = {
    open: function (opts) {
      ensurePanel();
      ctxInfo = { chapter: opts.chapter || '', section: opts.section || '', text: opts.text || '' };
      msgsBox.innerHTML = '';
      var ctxBox = el('div', 'tba-ctx');
      ctxBox.appendChild(el('i', null, (opts.section || '') + ' · 讨论上下文'));
      ctxBox.appendChild(document.createTextNode((opts.text || '').slice(0, 300)));
      msgsBox.appendChild(ctxBox);
      addMsg('tba-hint', '围绕上面的课本内容提问，AI 会结合上下文回答。');
      mask.style.display = '';
      panel.style.display = 'flex';
      input.focus();
    },
  };

  /* ---------- 划词弹出按钮 ---------- */
  var pop = null, rootEl = null, baseInfo = { chapter: '', section: '' };

  function removePop() { if (pop) { pop.remove(); pop = null; } }

  document.addEventListener('selectionchange', function () {
    if (!rootEl) return;
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) { return; }
    var text = sel.toString().trim();
    if (text.length < 8 || !rootEl.contains(sel.anchorNode)) { removePop(); return; }
    var rect = null;
    try { rect = sel.getRangeAt(0).getBoundingClientRect(); } catch (e) { /* ignore */ }
    if (!rect) return;
    removePop();
    pop = el('button', 'tba-pop', '✦ 就选中内容问 AI');
    pop.type = 'button';
    pop.style.left = (rect.left + rect.width / 2 + window.scrollX - 60) + 'px';
    pop.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    document.body.appendChild(pop);
    pop.addEventListener('mousedown', function (e) { e.preventDefault(); });
    pop.addEventListener('click', function () {
      window.ExplainPanel.open({
        chapter: baseInfo.chapter,
        section: baseInfo.section + ' · 选中片段',
        text: '【学生选中的原文】' + text,
      });
      removePop();
    });
  });
  document.addEventListener('mousedown', function (e) {
    if (pop && !pop.contains(e.target)) removePop();
  });

  /* ---------- 页面接入点 ---------- */
  window.TextbookAsk = {
    attach: function (root, info) {
      rootEl = root;
      baseInfo = info || baseInfo;
    },
  };
})();
