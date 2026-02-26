/**
 * app.js — Utilitários compartilhados
 * Agregador de Pautas · Radix Intelligence
 */

// ── Toast ─────────────────────────────────────────────────────────────────────
// Uso: showToast('mensagem')  ou  showToast('erro', '#ff4d6d')
// Requer um elemento <div id="toast"></div> na página.
(function () {
  let _toastTimer = null;

  window.showToast = function (msg, color) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.borderColor = color || 'var(--cyan, #00ffcc)';
    t.style.color       = color || 'var(--cyan, #00ffcc)';
    t.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3000);
  };
})();

// ── Suppress onerror global do template (fix seguro) ─────────────────────────
// O custom.js pode gerar "position() is undefined" em páginas sem âncoras.
// O guard já foi adicionado ao custom.js, mas mantemos este fallback silencioso
// APENAS para erros conhecidos do vendor, nunca para erros da aplicação.
window.addEventListener('error', function (e) {
  if (e.message && e.message.includes('position() is undefined')) {
    e.preventDefault(); // silencia silenciosamente sem esconder outros erros
  }
});
