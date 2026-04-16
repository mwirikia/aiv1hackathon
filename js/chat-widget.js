// Floating chat widget — works on any page

(function() {
  // Inject HTML
  var html = '<button class="chat-widget-btn" id="chat-widget-toggle" aria-label="Open chat assistant" title="Ask a question">💬</button>';
  html += '<div class="chat-widget-panel" id="chat-widget-panel">';
  html += '<div class="chat-widget-panel__header">';
  html += '<span class="chat-widget-panel__title">Directorate Assistant</span>';
  html += '<button class="chat-widget-panel__close" id="chat-widget-close" aria-label="Close chat">✕</button>';
  html += '</div>';
  html += '<div class="chat-widget-messages" id="chat-widget-messages"></div>';
  html += '<div class="chat-widget-input-bar">';
  html += '<input id="chat-widget-input" type="text" placeholder="Ask about capacity, teams, tickets\u2026" autocomplete="off">';
  html += '<button id="chat-widget-send">Ask</button>';
  html += '</div></div>';

  var container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  var toggle = document.getElementById('chat-widget-toggle');
  var panel = document.getElementById('chat-widget-panel');
  var closeBtn = document.getElementById('chat-widget-close');
  var input = document.getElementById('chat-widget-input');
  var sendBtn = document.getElementById('chat-widget-send');
  var messages = document.getElementById('chat-widget-messages');
  var isOpen = false;
  var hasGreeted = false;

  toggle.addEventListener('click', function() {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('chat-widget-panel--open');
      toggle.textContent = '✕';
      toggle.setAttribute('aria-label', 'Close chat assistant');
      if (!hasGreeted) { greet(); hasGreeted = true; }
      input.focus();
    } else {
      closePanel();
    }
  });

  closeBtn.addEventListener('click', function() { closePanel(); });

  function closePanel() {
    isOpen = false;
    panel.classList.remove('chat-widget-panel--open');
    toggle.textContent = '💬';
    toggle.setAttribute('aria-label', 'Open chat assistant');
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleSend(); });

  function handleSend() {
    var q = input.value.trim();
    if (!q) return;
    addUser(q);
    input.value = '';
    var typing = addTyping();
    setTimeout(function() {
      typing.remove();
      var result = answerQuestion(q);
      addBot(result.text, result.suggestions, result.table);
    }, 250 + Math.random() * 350);
  }

  function greet() {
    addBot(
      'Hello — I can answer questions about your teams, capacity, workload, tickets, and skills. Try one of the suggestions below, or type your own.',
      ['Give me a summary', 'Do we have capacity?', 'Which teams are under pressure?', 'Show open tickets', 'Who is over-allocated?', 'Who could I redeploy?']
    );
  }

  function addUser(text) {
    var div = document.createElement('div');
    div.className = 'chat-widget-msg chat-widget-msg--user';
    div.innerHTML = '<div class="chat-widget-bubble chat-widget-bubble--user">' + escapeHtml(text) + '</div>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addBot(text, suggestions, table) {
    var div = document.createElement('div');
    div.className = 'chat-widget-msg chat-widget-msg--bot';
    var h = '<div class="chat-widget-bubble chat-widget-bubble--bot">' + text.replace(/\n/g, '<br>');

    if (table && table.length > 0) {
      var keys = Object.keys(table[0]);
      h += '<div class="chat-widget-table-wrap"><table class="chat-widget-table"><thead><tr>';
      keys.forEach(function(k) { h += '<th>' + k + '</th>'; });
      h += '</tr></thead><tbody>';
      var show = table.slice(0, 8);
      show.forEach(function(row) {
        h += '<tr>';
        keys.forEach(function(k) { h += '<td>' + row[k] + '</td>'; });
        h += '</tr>';
      });
      h += '</tbody></table>';
      if (table.length > 8) h += '<div class="chat-widget-table-more">Showing 8 of ' + table.length + ' rows</div>';
      h += '</div>';
    }
    h += '</div>';

    if (suggestions && suggestions.length > 0) {
      h += '<div class="chat-widget-suggestions">';
      suggestions.forEach(function(s) {
        h += '<button class="chat-widget-chip">' + s + '</button>';
      });
      h += '</div>';
    }

    div.innerHTML = h;

    // Wire up chips
    var chips = div.querySelectorAll('.chat-widget-chip');
    chips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        input.value = chip.textContent;
        handleSend();
      });
    });

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTyping() {
    var div = document.createElement('div');
    div.className = 'chat-widget-msg chat-widget-msg--bot chat-widget-typing';
    div.innerHTML = '<div class="chat-widget-bubble chat-widget-bubble--bot"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
