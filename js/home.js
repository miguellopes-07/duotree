document.addEventListener('DOMContentLoaded', async () => {
  const state = await window.DuoTree.init();

  const tips = [
    'Sabia que árvores nativas alimentam até 10x mais polinizadores locais do que exóticas?',
    'Regar sua árvore diariamente ajuda a completar a Missão Diária e render +15 folhas!',
    'Explore a Wiki para descobrir curiosidades sobre Pequi, Jatobá, Oiti e Araucária.',
    'Na Loja, você pode filtrar espécies nativas recomendadas exatamente para a sua região!',
    'O ODS 15 da ONU protege a Vida Terrestre — cada muda plantada faz diferença!'
  ];

  const STAGE_NAMES = ['Semente', 'Broto', 'Árvore Jovem', 'Árvore Adulta'];

  function getActiveTree() {
    return (
      state.arvoresCompradas.find((a) => a.id === state.arvoreAtivaId) ||
      state.arvoresCompradas[0] || {
        id: 'ipe-amarelo',
        nome: 'Ipê Amarelo',
        estagio: 1,
        regas: 0
      }
    );
  }

  function renderNotifBadges() {
    const unreadCount = state.notificacoes.filter((n) => !n.lida).length;
    document.querySelectorAll('.mascote_notificacao, .mascote_notificacaocelular').forEach((wrap) => {
      let badge = wrap.querySelector('.duotree-notif-badge');
      if (unreadCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'duotree-notif-badge';
          wrap.appendChild(badge);
        }
        badge.textContent = String(unreadCount);
      } else if (badge) {
        badge.remove();
      }
    });
  }

  function renderHud() {
    let hud = document.querySelector('.duotree-home-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.className = 'duotree-home-hud';
      document.body.appendChild(hud);
    }
    const active = getActiveTree();
    const stageLabel = STAGE_NAMES[Math.min(Math.max((active.estagio || 1) - 1, 0), 3)];
    hud.innerHTML = `
      <span>🌳 ${window.DuoTree.escapeHtml(active.nome)} • ${stageLabel} (${active.regas || 0} regas)</span>
      <button type="button" class="duotree-btn" data-action="water">💧 Regar</button>
      <button type="button" class="duotree-btn duotree-btn-sec" data-action="forest">Floresta (${state.arvoresCompradas.length})</button>
    `;

    hud.querySelector('[data-action="water"]').addEventListener('click', handleWaterTree);
    hud.querySelector('[data-action="forest"]').addEventListener('click', openForestModal);
  }

  function handleWaterTree() {
    const result = window.DuoTree.waterActiveTree();
    if (!result) return;
    renderHud();
    renderNotifBadges();
    if (result.dailyCompletedNow) {
      window.DuoTree.showToast(`💧 ${result.tree.nome} regada! Missão Diária concluída (+15 folhas)!`);
    } else {
      window.DuoTree.showToast(`💧 Você regou ${result.tree.nome}! (+15 XP)`);
    }
  }

  function openNotificationsModal() {
    const listHtml = state.notificacoes.length
      ? state.notificacoes
          .map(
            (n) => `
          <div class="duotree-notif-item ${n.lida ? 'lida' : ''}">
            <strong>${window.DuoTree.escapeHtml(n.titulo)}</strong>
            <p style="margin:4px 0 2px;">${window.DuoTree.escapeHtml(n.mensagem)}</p>
            <small style="color:#666;">${window.DuoTree.escapeHtml(n.data)}</small>
          </div>
        `
          )
          .join('')
      : '<p>Nenhuma notificação no momento.</p>';

    window.DuoTree.openModal({
      title: 'Notificações',
      subtitle: 'Novidades da sua floresta e missões',
      html: `
        <div>${listHtml}</div>
        <div class="duotree-modal-actions">
          <button type="button" class="duotree-btn" id="btn-marcar-lidas">Marcar todas como lidas</button>
        </div>
      `,
      onMount: (body) => {
        body.querySelector('#btn-marcar-lidas').addEventListener('click', () => {
          window.DuoTree.markAllNotificationsRead();
          renderNotifBadges();
          window.DuoTree.closeModal();
          window.DuoTree.showToast('Notificações marcadas como lidas.', 'info');
        });
      }
    });
  }

  function openForestModal() {
    const itemsHtml = state.arvoresCompradas
      .map((tree) => {
        const isActive = tree.id === state.arvoreAtivaId;
        const stageLabel = STAGE_NAMES[Math.min(Math.max((tree.estagio || 1) - 1, 0), 3)];
        return `
          <div class="duotree-list-item">
            <div>
              <strong>${window.DuoTree.escapeHtml(tree.nome)}</strong>
              ${isActive ? '<span class="duotree-badge">Em destaque</span>' : ''}
              <div style="font-size:0.85rem;color:#4c7b47;">
                Estágio: ${stageLabel} • Regas: ${tree.regas || 0} • Quantidade: ${tree.quantidade || 1}
              </div>
            </div>
            ${
              isActive
                ? '<button type="button" class="duotree-btn" data-water-now="1">💧 Regar</button>'
                : `<button type="button" class="duotree-btn duotree-btn-sec" data-select-tree="${window.DuoTree.escapeHtml(tree.id)}">Destacar</button>`
            }
          </div>
        `;
      })
      .join('');

    window.DuoTree.openModal({
      title: 'Minha Floresta',
      subtitle: `${state.arvoresPlantadas} árvores cultivadas • Nível ${state.nivel}`,
      html: `
        <p style="margin-top:0;">Escolha qual espécie cuidar hoje ou visite a Loja para desbloquear novas mudas nativas.</p>
        <div>${itemsHtml}</div>
        <div class="duotree-modal-actions">
          <a href="pages/loja.html" class="duotree-btn duotree-btn-sec" style="text-decoration:none;">Ir para Loja</a>
          <a href="pages/missoes.html" class="duotree-btn" style="text-decoration:none;">Fazer Missões</a>
        </div>
      `,
      onMount: (body) => {
        body.querySelectorAll('[data-select-tree]').forEach((btn) => {
          btn.addEventListener('click', () => {
            state.arvoreAtivaId = btn.getAttribute('data-select-tree');
            window.DuoTree.saveState();
            renderHud();
            openForestModal();
          });
        });
        const waterBtn = body.querySelector('[data-water-now]');
        if (waterBtn) {
          waterBtn.addEventListener('click', () => {
            handleWaterTree();
            openForestModal();
          });
        }
      }
    });
  }

  let bubbleTimeout = null;
  function showMascotTip() {
    const existing = document.querySelector('.duotree-speech-bubble');
    if (existing) existing.remove();
    if (bubbleTimeout) clearTimeout(bubbleTimeout);

    const tip = tips[Math.floor(Math.random() * tips.length)];
    const bubble = document.createElement('div');
    bubble.className = 'duotree-speech-bubble';
    bubble.innerHTML = `<strong>Dinozinho diz:</strong><br>${window.DuoTree.escapeHtml(tip)}`;
    document.body.appendChild(bubble);

    bubbleTimeout = setTimeout(() => {
      bubble.remove();
    }, 4500);
  }

  document.querySelectorAll('.mascote_notificacao svg, .mascote_notificacaocelular svg').forEach((bell) => {
    bell.setAttribute('title', 'Ver notificações');
    bell.addEventListener('click', openNotificationsModal);
  });

  document.querySelectorAll('.mascote_notificacao img, .mascote_notificacaocelular img').forEach((mascot) => {
    mascot.setAttribute('title', 'Clique para ouvir uma dica do mascote');
    mascot.addEventListener('click', showMascotTip);
  });

  document.querySelectorAll('main .arvorepc, main .arvoretablet, main .arvorecelular').forEach((treeImg) => {
    treeImg.setAttribute('title', 'Clique para abrir sua Floresta');
    treeImg.addEventListener('click', openForestModal);
  });

  renderNotifBadges();
  renderHud();
});
