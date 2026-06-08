module.exports = async function(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KI-Assistent</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0D1117; color: #fff; font-family: Inter, sans-serif; height: 100vh; display: flex; flex-direction: column; }
#messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.msg { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; }
.user { background: #6C63FF; align-self: flex-end; }
.assistant { background: #1A1F2E; align-self: flex-start; }
#input-area { padding: 12px; background: #1A1F2E; display: flex; gap: 8px; }
#input { flex: 1; background: #0D1117; border: 1px solid #2D3548; border-radius: 8px; padding: 10px; color: #fff; font-size: 14px; outline: none; }
#send { background: #6C63FF; border: none; border-radius: 8px; padding: 10px 16px; color: #fff; font-size: 14px; cursor: pointer; }
.typing { color: #8B9DC3; font-style: italic; font-size: 13px; }
</style>
</head>
<body>
<div id="messages">
  <div class="msg assistant">Hallo! Ich bin dein KI-Assistent. Wie kann ich dir helfen?</div>
</div>
<div id="input-area">
  <input id="input" type="text" placeholder="Frage stellen..." />
  <button id="send">Senden</button>
</div>
<script>
const params = new URLSearchParams(window.location.search);
const userId = params.get('userId') || '';
const messages = [];
let systemPrompt = 'Du bist ein hilfreicher KI-Assistent für deutsche Kleinunternehmer und Etsy-Verkäufer. Antworte auf Deutsch, kurz und klar.';

async function loadUserData() {
  if (!userId) return;
  try {
    const res = await fetch('/api/totals?userId=' + userId);
    const data = await res.json();
    if (data && data.length > 0) {
      const d = data[0];
      systemPrompt = 'Du bist ein hilfreicher KI-Assistent. Finanzdaten: Einnahmen: €' + (d.total_income||0).toFixed(2) + ', Ausgaben: €' + (d.total_expenses||0).toFixed(2) + ', Gewinn: €' + (d.profit||0).toFixed(2) + '. Antworte auf Deutsch.';
    }
  } catch(e) {}
}

async function sendMessage() {
  const input = document.getElementById('input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMessage('user', text);
  messages.push({ role: 'user', content: text });
  const typing = addMessage('assistant', '...', true);
  try {
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, system: systemPrompt }) });
    const data = await res.json();
    const reply = data.content[0].text;
    typing.remove();
    addMessage('assistant', reply);
    messages.push({ role: 'assistant', content: reply });
  } catch(e) { typing.remove(); addMessage('assistant', 'Fehler. Bitte erneut versuchen.'); }
}

function addMessage(role, text, isTyping = false) {
  const div = document.createElement('div');
  div.className = 'msg ' + role + (isTyping ? ' typing' : '');
  div.textContent = text;
  document.getElementById('messages').appendChild(div);
  div.scrollIntoView();
  return div;
}

document.getElementById('send').addEventListener('click', sendMessage);
document.getElementById('input').addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
loadUserData();
</script>
</body>
</html>`);
};
