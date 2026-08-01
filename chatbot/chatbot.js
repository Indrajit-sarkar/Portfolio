/* ═══════════════════════════════════════════════════════════
   Alex AI Chatbot — Widget
   Self-contained IIFE. Injects all DOM. No globals.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── SVG Icons ──────────────────────────────────────────── */
  var ICON_SPARKLE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>';
  var ICON_CLOSE  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var ICON_SEND   = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';

  /* ── Suggested Questions ────────────────────────────────── */
  var CHIPS = [
    'Tell me about Indrajit',
    'Where did he study?',
    'What skills does he have?',
    'Show his projects',
    'What certifications does he have?',
    'How can I contact him?',
    'What technologies does he use?',
    'Does he know Azure AI?',
    'Does he know LangChain?',
    'Does he have cloud experience?'
  ];

  /* ── Welcome Message ────────────────────────────────────── */
  var WELCOME = "Hello! I'm Alex, Indrajit's AI assistant. I can answer questions about his education, experience, projects, technical skills, certifications, and portfolio.";

  /* ── State ──────────────────────────────────────────────── */
  var isOpen    = false;
  var hasOpened = false;
  var isLoading = false;
  var history   = []; // {role:'user'|'model', parts:[{text}]}

  /* ── Refs (set during init) ─────────────────────────────── */
  var fab, panel, msgBody, chipsWrap, inputEl, sendBtn;

  /* ── Helpers ────────────────────────────────────────────── */
  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function timeNow() {
    var d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function scrollBottom() {
    requestAnimationFrame(function () {
      msgBody.scrollTop = msgBody.scrollHeight;
    });
  }

  /* ── Markdown ───────────────────────────────────────────── */
  function md(raw) {
    var text = esc(raw);

    // fenced code blocks  ```lang\n...\n```
    text = text.replace(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // inline code
    text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // bold **text**
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // italic *text*
    text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // process lines for lists and breaks
    var lines = text.split('\n');
    var out = [];
    var inUl = false, inOl = false, inPre = false;

    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];

      if (ln.indexOf('<pre>') !== -1) inPre = true;
      if (ln.indexOf('</pre>') !== -1) { inPre = false; out.push(ln); continue; }
      if (inPre) { out.push(ln); continue; }

      var ulM = ln.match(/^[\-\*]\s+(.*)/);
      var olM = ln.match(/^\d+\.\s+(.*)/);

      if (ulM) {
        if (inOl) { out.push('</ol>'); inOl = false; }
        if (!inUl) { out.push('<ul>'); inUl = true; }
        out.push('<li>' + ulM[1] + '</li>');
      } else if (olM) {
        if (inUl) { out.push('</ul>'); inUl = false; }
        if (!inOl) { out.push('<ol>'); inOl = true; }
        out.push('<li>' + olM[1] + '</li>');
      } else {
        if (inUl) { out.push('</ul>'); inUl = false; }
        if (inOl) { out.push('</ol>'); inOl = false; }
        if (ln.trim() === '') {
          out.push('');
        } else {
          out.push(ln);
        }
      }
    }
    if (inUl) out.push('</ul>');
    if (inOl) out.push('</ol>');

    // join and convert remaining newlines to <br> (but not after block elements)
    var result = out.join('\n');
    result = result.replace(/\n(?!<\/?(?:ul|ol|li|pre|code))/g, '<br>');
    result = result.replace(/(<br>)+$/g, '');
    return result;
  }

  /* ── DOM Builder ────────────────────────────────────────── */
  function buildUI() {
    // FAB
    fab = document.createElement('button');
    fab.className = 'alex-fab';
    fab.setAttribute('aria-label', 'Open AI assistant');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = ICON_SPARKLE;

    // Panel
    panel = document.createElement('div');
    panel.className = 'alex-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with Alex');
    panel.setAttribute('aria-hidden', 'true');

    // Header
    var header = document.createElement('div');
    header.className = 'alex-header';
    header.innerHTML =
      '<div class="alex-avatar">' + ICON_SPARKLE + '</div>' +
      '<div class="alex-header-info">' +
        '<div class="alex-header-title">Alex</div>' +
        '<div class="alex-header-subtitle">AI Portfolio Assistant</div>' +
      '</div>' +
      '<button class="alex-close" aria-label="Close chat">' + ICON_CLOSE + '</button>';

    // Body
    msgBody = document.createElement('div');
    msgBody.className = 'alex-body';
    msgBody.setAttribute('role', 'log');
    msgBody.setAttribute('aria-live', 'polite');
    msgBody.setAttribute('aria-label', 'Chat messages');

    // Chips
    chipsWrap = document.createElement('div');
    chipsWrap.className = 'alex-chips';
    CHIPS.forEach(function (q) {
      var btn = document.createElement('button');
      btn.className = 'alex-chip';
      btn.type = 'button';
      btn.textContent = q;
      chipsWrap.appendChild(btn);
    });

    // Footer
    var footer = document.createElement('div');
    footer.className = 'alex-footer';

    inputEl = document.createElement('textarea');
    inputEl.className = 'alex-input';
    inputEl.placeholder = 'Ask about Indrajit...';
    inputEl.rows = 1;

    sendBtn = document.createElement('button');
    sendBtn.className = 'alex-send';
    sendBtn.type = 'button';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.innerHTML = ICON_SEND;

    footer.appendChild(inputEl);
    footer.appendChild(sendBtn);

    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(msgBody);
    panel.appendChild(chipsWrap);
    panel.appendChild(footer);

    // Insert into page
    document.body.appendChild(fab);
    document.body.appendChild(panel);
  }

  /* ── Message Bubble ─────────────────────────────────────── */
  function addMsg(text, isBot) {
    var wrap = document.createElement('div');
    wrap.className = 'alex-msg ' + (isBot ? 'alex-msg--bot' : 'alex-msg--user');

    var bubble = document.createElement('div');
    bubble.className = 'alex-msg-bubble';
    bubble.innerHTML = isBot ? md(text) : esc(text).replace(/\n/g, '<br>');

    var ts = document.createElement('div');
    ts.className = 'alex-msg-time';
    ts.textContent = timeNow();

    wrap.appendChild(bubble);
    wrap.appendChild(ts);
    msgBody.appendChild(wrap);
    scrollBottom();
  }

  /* ── Typing Indicator ───────────────────────────────────── */
  function showTyping() {
    var el = document.createElement('div');
    el.className = 'alex-typing';
    el.innerHTML = '<span class="alex-dot"></span><span class="alex-dot"></span><span class="alex-dot"></span>';
    msgBody.appendChild(el);
    scrollBottom();
  }

  function hideTyping() {
    var el = msgBody.querySelector('.alex-typing');
    if (el) el.remove();
  }

  /* ── API Call ────────────────────────────────────────────── */
  function send(text) {
    var msg = (text || '').trim();
    if (!msg || isLoading) return;

    // reset input
    inputEl.value = '';
    inputEl.style.height = 'auto';

    // hide chips after first message
    if (chipsWrap) chipsWrap.style.display = 'none';

    // user bubble
    addMsg(msg, false);

    // build payload (send history BEFORE adding current message)
    var payload = { message: msg, history: history.slice() };

    // push to history
    history.push({ role: 'user', parts: [{ text: msg }] });
    if (history.length > 20) history = history.slice(-20);

    // UI: loading state
    isLoading = true;
    inputEl.disabled = true;
    sendBtn.disabled = true;
    showTyping();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(function (data) {
      hideTyping();
      var reply = data.reply || "I don't have that information.";
      addMsg(reply, true);
      history.push({ role: 'model', parts: [{ text: reply }] });
      if (history.length > 20) history = history.slice(-20);
    })
    .catch(function () {
      hideTyping();
      addMsg("Sorry, I'm having trouble connecting right now. Please try again in a moment.", true);
    })
    .finally(function () {
      isLoading = false;
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    });
  }

  /* ── Panel Toggle ───────────────────────────────────────── */
  function togglePanel() {
    isOpen = !isOpen;
    panel.classList.toggle('is-open', isOpen);
    fab.setAttribute('aria-expanded', String(isOpen));
    panel.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      inputEl.focus();
      if (!hasOpened) {
        hasOpened = true;
        addMsg(WELCOME, true);
      }
    } else {
      fab.focus();
    }
  }

  /* ── Event Binding ──────────────────────────────────────── */
  function bindEvents() {
    // FAB click
    fab.addEventListener('click', togglePanel);

    // Close button
    panel.querySelector('.alex-close').addEventListener('click', togglePanel);

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) togglePanel();
    });

    // Textarea auto-resize
    inputEl.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Enter / Shift+Enter
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send(inputEl.value);
      }
    });

    // Send button
    sendBtn.addEventListener('click', function () {
      send(inputEl.value);
    });

    // Chip clicks (delegated)
    chipsWrap.addEventListener('click', function (e) {
      if (e.target.classList.contains('alex-chip')) {
        send(e.target.textContent);
      }
    });
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    buildUI();
    bindEvents();
  }

  /* ── Lazy Boot ──────────────────────────────────────────── */
  function boot() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(init);
    } else {
      setTimeout(init, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
