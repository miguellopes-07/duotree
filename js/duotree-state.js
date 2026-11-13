(function () {
  const STORAGE_KEY = 'duotree_state_v1';
  const isInsidePages = window.location.pathname.includes('/pages/');
  const BASE_PREFIX = isInsidePages ? '../' : './';

  let stateCache = null;
  const dataCache = new Map();

  function resolvePath(relativeFromRoot) {
    return BASE_PREFIX + relativeFromRoot.replace(/^\//, '');
  }

  function resolveAssetPath(pathValue) {
    if (!pathValue) return '';
    if (pathValue.startsWith('http://') || pathValue.startsWith('https://')) {
      return pathValue;
    }
    const clean = pathValue.replace(/^\.\.\//, '').replace(/^\.\//, '');
    return BASE_PREFIX + clean;
  }

  async function fetchData(fileName) {
    if (dataCache.has(fileName)) {
      return structuredClone(dataCache.get(fileName));
    }
    const response = await fetch(resolvePath('data/' + fileName));
    if (!response.ok) {
      throw new Error('Não foi possível carregar data/' + fileName);
    }
    const json = await response.json();
    dataCache.set(fileName, json);
    return structuredClone(json);
  }

  function mergeWithDefaults(saved, defaults) {
    return {
      ...defaults,
      ...saved,
      progressoMissoes: {
        ...(defaults.progressoMissoes || {}),
        ...(saved.progressoMissoes || {})
      },
      arvoresCompradas: Array.isArray(saved.arvoresCompradas)
        ? saved.arvoresCompradas
        : defaults.arvoresCompradas,
      missoesConcluidas: Array.isArray(saved.missoesConcluidas)
        ? saved.missoesConcluidas
        : defaults.missoesConcluidas,
      artigosLidos: Array.isArray(saved.artigosLidos)
        ? saved.artigosLidos
        : defaults.artigosLidos,
      conquistasDesbloqueadas: Array.isArray(saved.conquistasDesbloqueadas)
        ? saved.conquistasDesbloqueadas
        : defaults.conquistasDesbloqueadas,
      amigos: Array.isArray(saved.amigos) ? saved.amigos : defaults.amigos,
      notificacoes: Array.isArray(saved.notificacoes)
        ? saved.notificacoes
        : defaults.notificacoes
    };
  }

  async function init() {
    const defaults = await fetchData('usuario.json');
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        stateCache = mergeWithDefaults(JSON.parse(raw), defaults);
      } else {
        stateCache = defaults;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateCache));
      }
    } catch {
      stateCache = defaults;
    }
    syncLeaves();
    highlightFooterNav();
    return stateCache;
  }

  function getState() {
    return stateCache;
  }

  function saveState() {
    if (!stateCache) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateCache));
    syncLeaves();
  }

  async function resetState() {
    localStorage.removeItem(STORAGE_KEY);
    dataCache.delete('usuario.json');
    return init();
  }

  function syncLeaves() {
    if (!stateCache) return;
    document.querySelectorAll('.qtdfolhas span, .pontos h2, [data-duotree-folhas]').forEach((el) => {
      el.textContent = String(stateCache.folhas);
    });
  }

  function addNotification(titulo, mensagem) {
    if (!stateCache) return;
    stateCache.notificacoes.unshift({
      id: 'notif-' + Date.now(),
      titulo,
      mensagem,
      lida: false,
      data: 'Agora'
    });
    if (stateCache.notificacoes.length > 20) {
      stateCache.notificacoes = stateCache.notificacoes.slice(0, 20);
    }
    saveState();
  }

  function markAllNotificationsRead() {
    if (!stateCache) return;
    stateCache.notificacoes.forEach((n) => {
      n.lida = true;
    });
    saveState();
  }

  function addXp(amount) {
    if (!stateCache || !amount) return false;
    let leveledUp = false;
    stateCache.xp += amount;
    while (stateCache.xp >= stateCache.xpProximoNivel) {
      stateCache.xp -= stateCache.xpProximoNivel;
      stateCache.nivel += 1;
      stateCache.xpProximoNivel = Math.round(stateCache.xpProximoNivel * 1.15);
      leveledUp = true;
    }
    if (leveledUp) {
      addNotification(
        'Você subiu de nível!',
        `Parabéns! Agora você está no Nível ${stateCache.nivel}.`
      );
      showToast(`Subiu para o Nível ${stateCache.nivel}!`);
    }
    saveState();
    return leveledUp;
  }

  function addLeaves(amount) {
    if (!stateCache) return;
    stateCache.folhas += amount;
    saveState();
  }

  function spendLeaves(amount) {
    if (!stateCache || stateCache.folhas < amount) return false;
    stateCache.folhas -= amount;
    saveState();
    return true;
  }

  function unlockAchievement(id, nome, xpBonus = 50) {
    if (!stateCache) return false;
    if (stateCache.conquistasDesbloqueadas.includes(id)) {
      return false;
    }
    stateCache.conquistasDesbloqueadas.push(id);
    addNotification('Conquista desbloqueada!', `${nome} (+${xpBonus} XP)`);
    showToast(`Conquista desbloqueada: ${nome}!`);
    addXp(xpBonus);
    saveState();
    return true;
  }

  function buySpecies(item) {
    if (!stateCache) return { ok: false, motivo: 'Estado não inicializado.' };
    if (stateCache.folhas < item.preco) {
      return {
        ok: false,
        motivo: `Você precisa de mais ${item.preco - stateCache.folhas} folhas para adquirir ${item.nome}.`
      };
    }

    stateCache.folhas -= item.preco;
    const existing = stateCache.arvoresCompradas.find((a) => a.id === item.id);
    if (existing) {
      existing.quantidade = (existing.quantidade || 1) + 1;
    } else {
      stateCache.arvoresCompradas.push({
        id: item.id,
        nome: item.nome,
        tipo: item.tipo,
        estagio: 1,
        regas: 0,
        quantidade: 1,
        compradaEm: new Date().toISOString().slice(0, 10)
      });
    }
    stateCache.arvoresPlantadas += 1;
    stateCache.arvoreAtivaId = item.id;

    addXp(35);
    addNotification('Nova espécie adquirida!', `${item.nome} foi adicionada à sua floresta.`);
    if (stateCache.arvoresCompradas.length >= 3) {
      unlockAchievement('colecionador-nativo', 'Colecionador Nativo', 120);
    }
    saveState();
    return { ok: true };
  }

  function waterActiveTree() {
    if (!stateCache) return null;
    if (!stateCache.arvoresCompradas.length) {
      stateCache.arvoresCompradas.push({
        id: 'ipe-amarelo',
        nome: 'Ipê Amarelo',
        tipo: 'Mudas',
        estagio: 1,
        regas: 0,
        compradaEm: new Date().toISOString().slice(0, 10)
      });
      stateCache.arvoreAtivaId = 'ipe-amarelo';
    }
    const tree =
      stateCache.arvoresCompradas.find((a) => a.id === stateCache.arvoreAtivaId) ||
      stateCache.arvoresCompradas[0];

    tree.regas = (tree.regas || 0) + 1;
    if (tree.regas >= 6) tree.estagio = 4;
    else if (tree.regas >= 4) tree.estagio = 3;
    else if (tree.regas >= 2) tree.estagio = 2;
    else tree.estagio = 1;

    let dailyCompletedNow = false;
    const daily = stateCache.progressoMissoes['regue-sua-arvore'] || { atual: 0, meta: 1 };
    if (!stateCache.missoesConcluidas.includes('regue-sua-arvore') && daily.atual < daily.meta) {
      daily.atual = 1;
      stateCache.progressoMissoes['regue-sua-arvore'] = daily;
      stateCache.missoesConcluidas.push('regue-sua-arvore');
      stateCache.folhas += 15;
      addXp(60);
      dailyCompletedNow = true;
      addNotification('Missão Diária concluída!', 'Você regou sua árvore e ganhou +15 folhas.');
    } else {
      addXp(15);
    }

    unlockAchievement('guardiao-floresta', 'Guardião da Floresta', 80);
    saveState();
    return { tree, dailyCompletedNow };
  }

  function completeMission(missionId, rewardLeaves, rewardXp) {
    if (!stateCache) return false;
    if (stateCache.missoesConcluidas.includes(missionId)) {
      return false;
    }
    stateCache.missoesConcluidas.push(missionId);
    stateCache.folhas += rewardLeaves;
    addXp(rewardXp);
    addNotification(
      'Missão concluída!',
      `Você recebeu +${rewardLeaves} folhas e +${rewardXp} XP.`
    );

    if (missionId === 'conhecendo-arvores') {
      unlockAchievement('mestre-quizzes', 'Mestre dos Quizzes', 150);
    }
    if (missionId === 'importancia-arvores') {
      unlockAchievement('leitor-ods15', 'Leitor do ODS 15', 100);
    }
    if (missionId === 'plante-arvores') {
      unlockAchievement('maos-na-terra', 'Mãos na Terra', 200);
    }

    saveState();
    return true;
  }

  function showToast(message, type = 'sucesso') {
    let container = document.querySelector('.duotree-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'duotree-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `duotree-toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visivel'));
    setTimeout(() => {
      toast.classList.remove('visivel');
      setTimeout(() => toast.remove(), 260);
    }, 3400);
  }

  function closeModal() {
    const existing = document.querySelector('.duotree-modal-backdrop');
    if (existing) existing.remove();
  }

  function openModal({ title, subtitle = '', html = '', onMount }) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'duotree-modal-backdrop';
    backdrop.innerHTML = `
      <div class="duotree-modal" role="dialog" aria-modal="true">
        <div class="duotree-modal-header">
          <div>
            <h2>${escapeHtml(title)}</h2>
            ${subtitle ? `<p class="duotree-modal-sub">${escapeHtml(subtitle)}</p>` : ''}
          </div>
          <button type="button" class="duotree-modal-close" aria-label="Fechar">×</button>
        </div>
        <div class="duotree-modal-body">${html}</div>
      </div>
    `;

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeModal();
    });
    backdrop.querySelector('.duotree-modal-close').addEventListener('click', closeModal);
    document.body.appendChild(backdrop);

    if (typeof onMount === 'function') {
      onMount(backdrop.querySelector('.duotree-modal-body'), backdrop);
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightFooterNav() {
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('footer a').forEach((link) => {
      const href = (link.getAttribute('href') || '').split('/').pop();
      if (href === currentFile) {
        link.classList.add('pagina-ativa');
      }
    });
  }

  window.DuoTree = {
    init,
    fetchData,
    getState,
    saveState,
    resetState,
    syncLeaves,
    addLeaves,
    spendLeaves,
    addXp,
    unlockAchievement,
    addNotification,
    markAllNotificationsRead,
    buySpecies,
    waterActiveTree,
    completeMission,
    showToast,
    openModal,
    closeModal,
    escapeHtml,
    resolvePath,
    resolveAssetPath
  };
})();
