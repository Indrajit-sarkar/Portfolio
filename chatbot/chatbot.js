/* ═══════════════════════════════════════════════════════════════
   Alex AI Chatbot — Voice-Enabled Widget
   Self-contained IIFE. Injects all DOM. No globals.
   
   Features:
   - Text chat (existing)
   - Wake word: "Hey Alex" / "Hi Alex" (SpeechRecognition)
   - Voice input: mic button (SpeechRecognition)
   - Voice output: TTS (SpeechSynthesis, best available voice)
   - State machine: IDLE → GREETING → LISTENING → PROCESSING → SPEAKING → IDLE
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── SVG Icons ──────────────────────────────────────────────── */
  var ICON_SPARKLE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>';
  var ICON_CLOSE  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var ICON_SEND   = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
  var ICON_MIC    = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>';
  var ICON_MIC_OFF = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12m-9-8v5l4.28 4.28"/><path d="M5 10a7 7 0 0 0 11.36 5.36"/><rect x="9" y="2" width="6" height="11" rx="3"/><line x1="12" y1="19" x2="12" y2="22"/></svg>';
  var ICON_VOLUME = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  var ICON_MUTE   = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  var ICON_REPLAY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';

  /* ── Config ─────────────────────────────────────────────────── */
  var CHIPS = [
    'Tell me about Indrajit',
    'Show his projects',
    'What skills does he have?',
    'How can I contact him?'
  ];

  var WELCOME = "Hello! I'm Alex, Indrajit's AI assistant. I can answer questions about his education, experience, projects, technical skills, certifications, and portfolio. You can also say **\"Hey Alex\"** to talk to me!";
  var GREETING_REPLY = "Hi! How may I help you?";
  var GREETING_REPLY_REPEAT = "Hmm Hmm?";

  /* ── Voice support detection ────────────────────────────────── */
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var speechSynthesis = window.speechSynthesis;
  var HAS_VOICE = !!SpeechRecognition;
  var HAS_TTS = !!speechSynthesis;

  /* ── Voice State Machine ────────────────────────────────────── */
  // IDLE: passive wake-word listening (if panel open) or not listening
  // GREETING: Alex says greeting, then transitions to LISTENING
  // LISTENING: active STT capturing user question
  // PROCESSING: waiting for API response
  // SPEAKING: TTS reading response
  var VOICE_IDLE       = 'idle';
  var VOICE_GREETING   = 'greeting';
  var VOICE_LISTENING  = 'listening';
  var VOICE_PROCESSING = 'processing';
  var VOICE_SPEAKING   = 'speaking';

  /* ── State ──────────────────────────────────────────────────── */
  var isOpen      = false;
  var hasOpened   = false;
  var hasGreeted  = false;  // track if wake word greeting already played
  var isLoading   = false;
  var history     = [];
  var voiceState  = VOICE_IDLE;
  var isMuted     = false;
  var wakeWordRec = null; // SpeechRecognition for passive wake word
  var activeRec   = null; // SpeechRecognition for active listening
  var silenceTimer = null;
  var bestVoice   = null; // Cached best TTS voice
  var currentAbort = null;  // AbortController for in-flight API/TTS requests
  var currentTTSAbort = null; // AbortController for in-flight TTS fetch

  /* ── Refs ───────────────────────────────────────────────────── */
  var fab, panel, msgBody, chipsWrap, inputEl, sendBtn, micBtn, muteBtn, stateBadge;

  /* ── Helpers ────────────────────────────────────────────────── */
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

  /* ── Markdown ───────────────────────────────────────────────── */
  function md(raw) {
    var text = esc(raw);
    text = text.replace(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Headings
    text = text.replace(/^### (.+)$/gm, '<strong style="font-size:1.05em">$1</strong>');
    text = text.replace(/^## (.+)$/gm, '<strong style="font-size:1.1em">$1</strong>');
    text = text.replace(/^# (.+)$/gm, '<strong style="font-size:1.15em">$1</strong>');

    var lines = text.split('\n');
    var out = [];
    var inUl = false, inOl = false, inPre = false, inTable = false;

    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (ln.indexOf('<pre>') !== -1) inPre = true;
      if (ln.indexOf('</pre>') !== -1) { inPre = false; out.push(ln); continue; }
      if (inPre) { out.push(ln); continue; }

      // Table detection: lines starting and ending with |
      var isTableRow = /^\|(.+)\|\s*$/.test(ln.trim());
      var isSeparator = /^\|[\s\-:|]+\|\s*$/.test(ln.trim());

      if (isTableRow || isSeparator) {
        if (inUl) { out.push('</ul>'); inUl = false; }
        if (inOl) { out.push('</ol>'); inOl = false; }
        if (isSeparator) { continue; } // skip --- separator rows
        if (!inTable) { out.push('<table class="alex-table">'); inTable = true; }
        var cells = ln.trim().split('|').filter(function(c) { return c.trim() !== ''; });
        var tag = !inTable || out[out.length - 1] === '<table class="alex-table">' ? 'th' : 'td';
        // First row after table start = header
        if (out[out.length - 1] === '<table class="alex-table">') tag = 'th';
        out.push('<tr>' + cells.map(function(c) { return '<' + tag + '>' + c.trim() + '</' + tag + '>'; }).join('') + '</tr>');
        continue;
      } else if (inTable) {
        out.push('</table>');
        inTable = false;
      }

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
        out.push(ln.trim() === '' ? '' : ln);
      }
    }
    if (inUl) out.push('</ul>');
    if (inOl) out.push('</ol>');
    if (inTable) out.push('</table>');

    var result = out.join('\n');
    result = result.replace(/\n(?!<\/?(?:ul|ol|li|pre|code|table|tr|th|td))/g, '<br>');
    result = result.replace(/(<br>)+$/g, '');
    return result;
  }

  /* Strip markdown/HTML for TTS — plain text only */
  function stripForTTS(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[\-\*]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/#+\s*/g, '')
      .trim();
  }

  /* ── Voice Selection (best neural/natural voice) ────────────── */
  function pickBestVoice() {
    if (bestVoice) return bestVoice;
    if (!HAS_TTS) return null;
    var voices = speechSynthesis.getVoices();
    if (!voices.length) return null;

    // Priority list — most natural-sounding voices
    var prefs = [
      'microsoft aria',
      'microsoft jenny',
      'microsoft zira',
      'google uk english female',
      'google us english',
      'samantha', // macOS
      'karen',    // macOS Australian
      'moira',    // macOS Irish
      'fiona',    // macOS Scottish
    ];

    // 1. Check preferred voices
    for (var p = 0; p < prefs.length; p++) {
      for (var v = 0; v < voices.length; v++) {
        if (voices[v].name.toLowerCase().indexOf(prefs[p]) !== -1) {
          bestVoice = voices[v];
          return bestVoice;
        }
      }
    }

    // 2. Any voice with "Neural" or "Natural" in name
    for (var n = 0; n < voices.length; n++) {
      var nm = voices[n].name.toLowerCase();
      if ((nm.indexOf('neural') !== -1 || nm.indexOf('natural') !== -1) && voices[n].lang.indexOf('en') === 0) {
        bestVoice = voices[n];
        return bestVoice;
      }
    }

    // 3. Any English female voice
    for (var f = 0; f < voices.length; f++) {
      if (voices[f].lang.indexOf('en') === 0 && voices[f].name.toLowerCase().indexOf('female') !== -1) {
        bestVoice = voices[f];
        return bestVoice;
      }
    }

    // 4. Any English voice
    for (var e = 0; e < voices.length; e++) {
      if (voices[e].lang.indexOf('en') === 0) {
        bestVoice = voices[e];
        return bestVoice;
      }
    }

    // 5. Fallback: first voice
    bestVoice = voices[0];
    return bestVoice;
  }

  // Voices load async in some browsers
  if (HAS_TTS) {
    speechSynthesis.onvoiceschanged = function () { bestVoice = null; pickBestVoice(); };
    // Trigger initial load
    try { speechSynthesis.getVoices(); } catch (e) {}
  }

  /* ── TTS: Speak text aloud ──────────────────────────────────── */
  /* ── Audio playback state for ElevenLabs TTS ── */
  var currentAudio = null;

  function speak(text, onEnd) {
    if (isMuted) {
      if (onEnd) onEnd();
      return;
    }
    // Stop any currently playing audio
    stopSpeaking();

    var plain = stripForTTS(text);
    if (!plain) { if (onEnd) onEnd(); return; }

    setVoiceState(VOICE_SPEAKING);

    // Call our server-side Groq Orpheus TTS proxy
    console.log('[Alex TTS] Calling /api/tts (Groq Orpheus) with', plain.length, 'chars');
    currentTTSAbort = new AbortController();
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: plain }),
      signal: currentTTSAbort.signal
    })
    .then(function (res) {
      if (!res.ok) throw new Error('TTS failed: ' + res.status);
      return res.blob();
    })
    .then(function (blob) {
      console.log('[Alex TTS] Got audio blob:', blob.size, 'bytes');
      var url = URL.createObjectURL(blob);
      currentAudio = new Audio(url);
      currentAudio.onended = function () {
        URL.revokeObjectURL(url);
        currentAudio = null;
        setVoiceState(VOICE_IDLE);
        if (onEnd) onEnd();
      };
      currentAudio.onerror = function () {
        URL.revokeObjectURL(url);
        currentAudio = null;
        setVoiceState(VOICE_IDLE);
        // Fallback to browser TTS if ElevenLabs fails
        if (HAS_TTS) {
          var utter = new SpeechSynthesisUtterance(plain);
          var voice = pickBestVoice();
          if (voice) utter.voice = voice;
          utter.onend = function () { setVoiceState(VOICE_IDLE); if (onEnd) onEnd(); };
          speechSynthesis.speak(utter);
          setVoiceState(VOICE_SPEAKING);
        } else {
          if (onEnd) onEnd();
        }
      };
      currentAudio.play().catch(function () {
        // Autoplay blocked — fallback to browser TTS
        if (HAS_TTS) {
          var utter2 = new SpeechSynthesisUtterance(plain);
          var voice2 = pickBestVoice();
          if (voice2) utter2.voice = voice2;
          utter2.onend = function () { setVoiceState(VOICE_IDLE); if (onEnd) onEnd(); };
          speechSynthesis.speak(utter2);
        } else {
          setVoiceState(VOICE_IDLE);
          if (onEnd) onEnd();
        }
      });
    })
    .catch(function (err) {
      // If user interrupted (abort), do nothing
      if (err && err.name === 'AbortError') {
        console.log('[Alex TTS] Aborted by user interrupt');
        return;
      }
      console.warn('[Alex TTS] Groq TTS failed, falling back to browser TTS:', err);
      // Groq TTS unavailable — fallback to browser TTS
      if (HAS_TTS) {
        var utter3 = new SpeechSynthesisUtterance(plain);
        var voice3 = pickBestVoice();
        if (voice3) utter3.voice = voice3;
        utter3.onend = function () { setVoiceState(VOICE_IDLE); if (onEnd) onEnd(); };
        utter3.onerror = function () { setVoiceState(VOICE_IDLE); if (onEnd) onEnd(); };
        speechSynthesis.speak(utter3);
        setVoiceState(VOICE_SPEAKING);
      } else {
        setVoiceState(VOICE_IDLE);
        if (onEnd) onEnd();
      }
    });
  }

  function stopSpeaking() {
    // Abort in-flight TTS request
    if (currentTTSAbort) { currentTTSAbort.abort(); currentTTSAbort = null; }

    // Stop playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    // Also stop browser TTS fallback
    if (HAS_TTS) speechSynthesis.cancel();
  }

  /* ── Chime (synthesized beep for wake word) ─────────────────── */
  function playChime() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) { /* AudioContext not available */ }
  }

  /* ── Voice State Management ─────────────────────────────────── */

  /* ═══════════════════════════════════════════════════════════════
     SIRI ORB — Canvas-based animated voice orb
     Reacts to voiceState with smooth color/shape transitions.
     ═══════════════════════════════════════════════════════════════ */
  var orbAnimId = null;
  var orbTime = 0;
    // Orb removed — using CSS edge glow on .alex-panel instead


  function setVoiceState(state) {
    voiceState = state;

    // Edge glow: toggle state classes on panel
    if (panel) {
      panel.classList.remove('glow-listening', 'glow-processing', 'glow-speaking');
      if (state === VOICE_LISTENING || state === VOICE_GREETING) {
        panel.classList.add('glow-listening');
      } else if (state === VOICE_PROCESSING) {
        panel.classList.add('glow-processing');
      } else if (state === VOICE_SPEAKING) {
        panel.classList.add('glow-speaking');
      }
    }

    if (!stateBadge) return;

    // Update badge
    var labels = {};
    labels[VOICE_IDLE]       = '';
    labels[VOICE_GREETING]   = '✨ Greeting...';
    labels[VOICE_LISTENING]  = '🎤 Listening...';
    labels[VOICE_PROCESSING] = '🧠 Thinking...';
    labels[VOICE_SPEAKING]   = '🔊 Speaking...';

    stateBadge.textContent = labels[state] || '';
    stateBadge.classList.toggle('is-visible', state !== VOICE_IDLE);

    // Update mic button visual
    if (micBtn) {
      micBtn.classList.toggle('is-listening', state === VOICE_LISTENING);
    }
  }

  /* ── Wake Word Detection (passive, continuous) ──────────────── */
  function startWakeWordListening() {
    if (!HAS_VOICE || wakeWordRec) return;

    wakeWordRec = new SpeechRecognition();
    wakeWordRec.continuous = true;
    wakeWordRec.interimResults = true;
    wakeWordRec.lang = 'en-IN';          // Indian English
    wakeWordRec.maxAlternatives = 3;

    wakeWordRec.onresult = function (e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var transcript = e.results[i][0].transcript.toLowerCase().trim();
        // Check all alternatives too
        for (var a = 0; a < e.results[i].length; a++) {
          var alt = e.results[i][a].transcript.toLowerCase().trim();
          if (alt.indexOf('hey alex') !== -1 || alt.indexOf('hi alex') !== -1 ||
              alt.indexOf('hey alix') !== -1 || alt.indexOf('hay alex') !== -1 ||
              alt.indexOf('hey alec') !== -1 || alt.indexOf('he alex') !== -1) {
            handleWakeWord();
            return;
          }
        }
      }
    };

    wakeWordRec.onerror = function (e) {
      // 'no-speech' and 'aborted' are normal — just restart
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('[Alex Voice] Wake word error:', e.error);
      }
    };

    wakeWordRec.onend = function () {
      // Auto-restart if we're supposed to be listening for wake word
      wakeWordRec = null;
      if (isOpen && voiceState === VOICE_IDLE) {
        setTimeout(startWakeWordListening, 300);
      }
    };

    try {
      wakeWordRec.start();
    } catch (e) {
      console.warn('[Alex Voice] Could not start wake word listener:', e.message);
      wakeWordRec = null;
    }
  }

  function stopWakeWordListening() {
    if (wakeWordRec) {
      try { wakeWordRec.abort(); } catch (e) {}
      wakeWordRec = null;
    }
  }

  function handleWakeWord() {
    // Stop passive listening
    stopWakeWordListening();
    // Interrupt everything — stop speech, abort in-flight requests
    stopSpeaking();
    if (currentAbort) { currentAbort.abort(); currentAbort = null; }

    // Open panel if not open
    if (!isOpen) togglePanel();

    // Play chime
    playChime();

    // Set state
    setVoiceState(VOICE_GREETING);

    // First time: full greeting. Subsequent times: short acknowledgement
    var greetMsg = hasGreeted ? GREETING_REPLY_REPEAT : GREETING_REPLY;
    hasGreeted = true;

    addMsg(greetMsg, true);
    speak(greetMsg, function () {
      startActiveListening();
    });
  }

  /* ── Active Listening (captures user's question) ────────────── */
  function startActiveListening() {
    if (!HAS_VOICE) return;
    stopWakeWordListening();
    if (activeRec) return;

    setVoiceState(VOICE_LISTENING);

    activeRec = new SpeechRecognition();
    activeRec.continuous = true;       // keep listening for full sentences
    activeRec.interimResults = true;
    activeRec.lang = 'en-IN';          // Indian English for better accent recognition
    activeRec.maxAlternatives = 3;     // more alternatives = better accuracy

    var finalTranscript = '';
    var interimTranscript = '';

    // Show interim text in the input field
    activeRec.onresult = function (e) {
      finalTranscript = '';
      interimTranscript = '';
      for (var i = 0; i < e.results.length; i++) {
        // Pick the highest-confidence alternative
        var best = e.results[i][0];
        for (var a = 1; a < e.results[i].length; a++) {
          if (e.results[i][a].confidence > best.confidence) {
            best = e.results[i][a];
          }
        }
        if (e.results[i].isFinal) {
          finalTranscript += best.transcript;
        } else {
          interimTranscript += best.transcript;
        }
      }
      inputEl.value = finalTranscript + interimTranscript;
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';

      // Reset silence timer
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(function () {
        stopActiveListening();
      }, 5000);
    };

    activeRec.onerror = function (e) {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('[Alex Voice] Active listening error:', e.error);
      }
      stopActiveListening();
    };

    activeRec.onend = function () {
      activeRec = null;
      clearTimeout(silenceTimer);
      var text = (finalTranscript || inputEl.value || '').trim();
      if (text) {
        send(text, true);  // true = from voice
      } else {
        setVoiceState(VOICE_IDLE);
        if (isOpen) startWakeWordListening();
      }
    };

    // 8-second max silence fallback
    silenceTimer = setTimeout(function () {
      stopActiveListening();
    }, 8000);

    try {
      activeRec.start();
    } catch (e) {
      console.warn('[Alex Voice] Could not start active listener:', e.message);
      activeRec = null;
      setVoiceState(VOICE_IDLE);
      if (isOpen) startWakeWordListening();
    }
  }

  function stopActiveListening() {
    clearTimeout(silenceTimer);
    if (activeRec) {
      try { activeRec.stop(); } catch (e) {}
      // onend handler will fire and send the text
    }
  }

  /* ── DOM Builder ────────────────────────────────────────────── */
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

    // Header with mute toggle
    var header = document.createElement('div');
    header.className = 'alex-header';
    header.innerHTML =
      '<div class="alex-avatar">' + ICON_SPARKLE + '</div>' +
      '<div class="alex-header-info">' +
        '<div class="alex-header-title">Alex</div>' +
        '<div class="alex-header-subtitle">AI Portfolio Assistant</div>' +
      '</div>' +
      (HAS_TTS ? '<button class="alex-mute" aria-label="Toggle voice output" title="Toggle voice">' + ICON_VOLUME + '</button>' : '') +
      '<button class="alex-close" aria-label="Close chat">' + ICON_CLOSE + '</button>';

    // State badge
    stateBadge = document.createElement('div');
    stateBadge.className = 'alex-state-badge';
    stateBadge.textContent = '';

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
    inputEl.placeholder = HAS_VOICE ? 'Ask about Indrajit... or say "Hey Alex"' : 'Ask about Indrajit...';
    inputEl.rows = 1;

    // Mic button (only if voice is supported)
    if (HAS_VOICE) {
      micBtn = document.createElement('button');
      micBtn.className = 'alex-mic';
      micBtn.type = 'button';
      micBtn.setAttribute('aria-label', 'Voice input');
      micBtn.title = 'Click to speak';
      micBtn.innerHTML = ICON_MIC;
    }

    sendBtn = document.createElement('button');
    sendBtn.className = 'alex-send';
    sendBtn.type = 'button';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.innerHTML = ICON_SEND;

    footer.appendChild(inputEl);
    if (micBtn) footer.appendChild(micBtn);
    footer.appendChild(sendBtn);

    // Assemble panel
    // Orb container
    // Orb DOM removed — edge glow uses CSS pseudo-elements on panel

    panel.appendChild(header);
    // orbContainer removed
    panel.appendChild(stateBadge);
    panel.appendChild(msgBody);
    panel.appendChild(chipsWrap);
    panel.appendChild(footer);

    // Insert into page
    document.body.appendChild(fab);
    document.body.appendChild(panel);

    // Cache mute button ref
    muteBtn = panel.querySelector('.alex-mute');
  }

  /* ── Message Bubble ─────────────────────────────────────────── */
  function addMsg(text, isBot, skipSpeak) {
    var wrap = document.createElement('div');
    wrap.className = 'alex-msg ' + (isBot ? 'alex-msg--bot' : 'alex-msg--user');

    var bubble = document.createElement('div');
    bubble.className = 'alex-msg-bubble';
    bubble.innerHTML = isBot ? md(text) : esc(text).replace(/\n/g, '<br>');

    var ts = document.createElement('div');
    ts.className = 'alex-msg-time';
    ts.textContent = timeNow();

    // Replay button for bot messages (if TTS available)
    if (isBot && HAS_TTS) {
      var replay = document.createElement('button');
      replay.className = 'alex-replay';
      replay.type = 'button';
      replay.title = 'Listen to this message';
      replay.innerHTML = ICON_REPLAY;
      replay.addEventListener('click', function () {
        stopSpeaking();
        speak(text);
      });
      ts.appendChild(replay);
    }

    wrap.appendChild(bubble);
    wrap.appendChild(ts);
    msgBody.appendChild(wrap);
    scrollBottom();

    return { text: text, isBot: isBot };
  }

  /* ── Typing Indicator ───────────────────────────────────────── */
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

  /* ── API Call ───────────────────────────────────────────────── */
  function send(text, fromVoice) {
    // Stop any ongoing speech immediately when user sends a new message
    stopSpeaking();
    // Abort any in-flight chat API request
    if (currentAbort) { currentAbort.abort(); currentAbort = null; }
    setVoiceState(VOICE_IDLE);

    var msg = (text || '').trim();
    if (!msg || isLoading) return;

    // reset input
    inputEl.value = '';
    inputEl.style.height = 'auto';

    // hide chips after first message
    if (chipsWrap) chipsWrap.style.display = 'none';

    // user bubble
    addMsg(msg, false);

    // build payload
    var payload = { message: msg, history: history.slice() };

    // push to history
    history.push({ role: 'user', parts: [{ text: msg }] });
    if (history.length > 10) history = history.slice(-10);

    // UI: loading state
    isLoading = true;
    inputEl.disabled = true;
    sendBtn.disabled = true;
    if (micBtn) micBtn.disabled = true;
    showTyping();
    setVoiceState(VOICE_PROCESSING);

    currentAbort = new AbortController();
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: currentAbort.signal
    })
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(function (data) {
      hideTyping();
      var reply = data.reply || "I don't have that information.";
      addMsg(reply, true, false);
      history.push({ role: 'model', parts: [{ text: reply }] });
      if (history.length > 10) history = history.slice(-10);

      // Only speak if the question was asked via voice
      if (fromVoice) {
        speak(reply, function () {
          // After speaking, go back to wake word listening
          if (isOpen && HAS_VOICE) startWakeWordListening();
        });
      } else {
        setVoiceState(VOICE_IDLE);
        if (isOpen && HAS_VOICE) startWakeWordListening();
      }
    })
    .catch(function (err) {
      // If user interrupted (abort), don't show error
      if (err && err.name === 'AbortError') {
        hideTyping();
        setVoiceState(VOICE_IDLE);
        return;
      }
      hideTyping();
      var errMsg = "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
      addMsg(errMsg, true, true);
      setVoiceState(VOICE_IDLE);
      if (isOpen && HAS_VOICE) startWakeWordListening();
    })
    .finally(function () {
      isLoading = false;
      inputEl.disabled = false;
      sendBtn.disabled = false;
      if (micBtn) micBtn.disabled = false;
      inputEl.focus();
    });
  }

  /* ── Panel Toggle ───────────────────────────────────────────── */
  function togglePanel() {
    isOpen = !isOpen;
    panel.classList.toggle('is-open', isOpen);
    fab.setAttribute('aria-expanded', String(isOpen));
    panel.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      inputEl.focus();
      if (!hasOpened) {
        hasOpened = true;
        addMsg(WELCOME, true, true); // don't auto-speak welcome
      }
      // Start wake word listening
      if (HAS_VOICE && voiceState === VOICE_IDLE) {
        startWakeWordListening();
      }
    } else {
      fab.focus();
      // Stop everything
      stopWakeWordListening();
      stopActiveListening();
      stopSpeaking();
      setVoiceState(VOICE_IDLE);
    }
  }

  /* ── Event Binding ──────────────────────────────────────────── */
  function bindEvents() {
    fab.addEventListener('click', togglePanel);
    panel.querySelector('.alex-close').addEventListener('click', togglePanel);
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
    // Stop Alex speaking when user starts typing
    stopSpeaking(); setVoiceState(VOICE_IDLE);
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send(inputEl.value, false);
      }
    });

    // Send button
    sendBtn.addEventListener('click', function () {
      send(inputEl.value, false);
    });

    // Mic button
    if (micBtn) {
      micBtn.addEventListener('click', function () {
        if (voiceState === VOICE_LISTENING) {
          // Stop listening
          stopActiveListening();
        } else {
          // Stop anything else and start listening
          stopSpeaking();
          if (currentAbort) { currentAbort.abort(); currentAbort = null; }
          stopWakeWordListening();
          startActiveListening();
        }
      });
    }

    // Mute toggle
    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        isMuted = !isMuted;
        muteBtn.innerHTML = isMuted ? ICON_MUTE : ICON_VOLUME;
        muteBtn.title = isMuted ? 'Voice muted' : 'Voice enabled';
        muteBtn.classList.toggle('is-muted', isMuted);
        if (isMuted) stopSpeaking();
      });
    }

    // Chip clicks
    chipsWrap.addEventListener('click', function (e) {
      if (e.target.classList.contains('alex-chip')) {
        send(e.target.textContent, false);
      }
    });

    // Stop Lenis from interfering
    msgBody.addEventListener('wheel', function(e) { e.stopPropagation(); }, { passive: false });
    msgBody.addEventListener('touchmove', function(e) { e.stopPropagation(); }, { passive: false });
    panel.addEventListener('wheel', function(e) { e.stopPropagation(); }, { passive: false });
    panel.addEventListener('touchmove', function(e) { e.stopPropagation(); }, { passive: false });
  }

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    buildUI();
    bindEvents();
  }

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
