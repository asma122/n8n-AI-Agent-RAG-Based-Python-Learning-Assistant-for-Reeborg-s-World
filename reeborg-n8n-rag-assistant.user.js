// ==UserScript==
// @name         Tuteur Python IA - Reeborg's World
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Widget de chat connecté au tuteur IA n8n pour Reeborg's World
// @match        http://localhost:8700/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  console.log('[Tuteur Python] Script chargé, en attente d\'injection du widget...');

  const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/reeborg-tutor';

  function injectWidget() {
    if (document.querySelector('#tutor-messages')) {
      console.log('[Tuteur Python] Widget déjà présent, on ne le recrée pas.');
      return;
    }

  // --- Création de l'interface du widget ---
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; width: 320px; height: 420px;
    background: #fff; border: 2px solid #333; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 999999;
    display: flex; flex-direction: column; font-family: sans-serif;
  `;

  container.innerHTML = `
    <div style="background:#2d6cdf;color:#fff;padding:8px;font-weight:bold;border-radius:6px 6px 0 0;">
      🐍 Tuteur Python
    </div>
    <div id="tutor-messages" style="flex:1;overflow-y:auto;padding:8px;font-size:13px;"></div>
    <div style="display:flex;border-top:1px solid #ccc;">
      <input id="tutor-input" type="text" placeholder="Pose ta question..."
        style="flex:1;border:none;padding:8px;font-size:13px;outline:none;" />
      <button id="tutor-send" style="border:none;background:#2d6cdf;color:#fff;padding:0 12px;cursor:pointer;">
        Envoyer
      </button>
    </div>
  `;

  document.body.appendChild(container);

  const messagesEl = container.querySelector('#tutor-messages');
  const inputEl = container.querySelector('#tutor-input');
  const sendBtn = container.querySelector('#tutor-send');

  function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.style.cssText = `margin:6px 0; ${sender === 'user' ? 'text-align:right;' : ''}`;
    msg.innerHTML = `<span style="display:inline-block;padding:6px 10px;border-radius:10px;
      background:${sender === 'user' ? '#2d6cdf' : '#eee'};
      color:${sender === 'user' ? '#fff' : '#000'};max-width:85%;">${text}</span>`;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    inputEl.value = '';
    addMessage('...', 'bot');
    const loadingMsg = messagesEl.lastChild;

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();
      loadingMsg.remove();
      addMessage(data.output || 'Pas de réponse.', 'bot');
    } catch (err) {
      loadingMsg.remove();
      addMessage('Erreur de connexion au tuteur. (' + err.message + ')', 'bot');
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  console.log('[Tuteur Python] Widget injecté avec succès.');
  }

  // Première tentative après un court délai (laisse le jeu finir de charger)
  setTimeout(injectWidget, 1500);

  // Filet de sécurité : revérifie régulièrement si le widget a disparu
  // (utile si le jeu réécrit le DOM après coup) et le réinjecte si besoin
  setInterval(injectWidget, 3000);
})();