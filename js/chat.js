// Chat interface

function initChat() {
  const input = document.getElementById('chat-input');
  const btn = document.getElementById('chat-send');

  addBotMessage(
    'Hello — I\'m your directorate intelligence assistant. Ask me anything about your teams, capacity, workload, tickets, or skills.\n\nTry one of the questions below, or type your own.',
    ['Give me a summary', 'Do we have capacity for a new programme?', 'Which teams are under pressure?', 'Who is over-allocated?']
  );

  btn.addEventListener('click', handleSend);
  input.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleSend(); });

  function handleSend() {
    var q = input.value.trim();
    if (!q) return;
    addUserMessage(q);
    input.value = '';

    var typing = addTypingIndicator();
    setTimeout(function() {
      typing.remove();
      var result = answerQuestion(q);
      addBotMessage(result.text, result.suggestions, result.table);
      var msgs = document.getElementById('chat-messages');
      msgs.scrollTop = msgs.scrollHeight;
    }, 300 + Math.random() * 400);
  }
}

function addUserMessage(text) {
  var msgs = document.getElementById('chat-messages');
  var div = document.createElement('div');
  div.className = 'chat-msg chat-msg--user';
  div.innerHTML = '<div class="msg-bubble msg-bubble--user">' + escapeHtml(text) + '</div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addBotMessage(text, suggestions, table) {
  var msgs = document.getElementById('chat-messages');
  var div = document.createElement('div');
  div.className = 'chat-msg chat-msg--bot';

  var html = '<div class="msg-bubble msg-bubble--bot">' + text.replace(/\n/g, '<br>');

  if (table && table.length > 0) {
    var keys = Object.keys(table[0]);
    html += '<div class="chat-table-wrap"><table class="chat-table"><thead><tr>';
    keys.forEach(function(k) { html += '<th>' + k + '</th>'; });
    html += '</tr></thead><tbody>';
    table.slice(0, 10).forEach(function(row) {
      html += '<tr>';
      keys.forEach(function(k) { html += '<td>' + row[k] + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    if (table.length > 10) html += '<div class="chat-table-more">Showing 10 of ' + table.length + ' rows</div>';
    html += '</div>';
  }

  html += '</div>';

  if (suggestions && suggestions.length > 0) {
    html += '<div class="suggestions">';
    suggestions.forEach(function(s) {
      html += '<button class="suggestion-chip" onclick="askSuggestion(this, \'' + escapeAttr(s) + '\')">' + s + '</button>';
    });
    html += '</div>';
  }

  div.innerHTML = html;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addTypingIndicator() {
  var msgs = document.getElementById('chat-messages');
  var div = document.createElement('div');
  div.className = 'chat-msg chat-msg--bot typing-indicator';
  div.innerHTML = '<div class="msg-bubble msg-bubble--bot"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function askSuggestion(btn, text) {
  document.getElementById('chat-input').value = text;
  document.getElementById('chat-send').click();
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s) {
  return s.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
