document.addEventListener('DOMContentLoaded', async () => {
  const state = await window.DuoTree.init();
  const arvores = await window.DuoTree.fetchData('wiki.json');

  const mainWiki = document.querySelector('.mainwiki');
  const searchForm = document.querySelector('.barrapesquisawiki');
  const searchInput = searchForm ? searchForm.querySelector('input') : null;
  const filterList = document.querySelector('.listfilterwiki');

  const categorias = ['Todas', 'Nativas', 'Frutíferas', 'Medicinais', 'Ornamentais'];
  let categoriaAtiva = 'Todas';
  let termoBusca = '';

  if (filterList) {
    filterList.innerHTML = categorias
      .map(
        (cat, idx) =>
          `<li class="${idx === 0 ? 'ativo' : ''}" data-cat="${cat}">${cat}</li>`
      )
      .join('');

    filterList.querySelectorAll('li').forEach((li) => {
      li.addEventListener('click', () => {
        filterList.querySelectorAll('li').forEach((el) => el.classList.remove('ativo'));
        li.classList.add('ativo');
        categoriaAtiva = li.getAttribute('data-cat') || 'Todas';
        renderWiki();
      });
    });
  }

  function openTreeModal(tree) {
    const jaLido = state.artigosLidos.includes(tree.id);

    window.DuoTree.openModal({
      title: tree.nome,
      subtitle: tree.nomeCientifico,
      html: `
        <img class="duotree-modal-img" src="${window.DuoTree.escapeHtml(window.DuoTree.resolveAssetPath(tree.imagem))}" alt="${window.DuoTree.escapeHtml(tree.nome)}">
        <div>
          ${tree.categorias
            .map((c) => `<span class="duotree-badge">${window.DuoTree.escapeHtml(c)}</span>`)
            .join('')}
          <span class="duotree-badge">${window.DuoTree.escapeHtml(tree.bioma)}</span>
        </div>
        <p><strong>Porte:</strong> ${window.DuoTree.escapeHtml(tree.porte)}</p>
        <p><strong>Regiões:</strong> ${window.DuoTree.escapeHtml(tree.regioes.join(', '))}</p>
        <p>${window.DuoTree.escapeHtml(tree.descricaoCompleta)}</p>
        <p><strong>Curiosidade:</strong> ${window.DuoTree.escapeHtml(tree.curiosidade)}</p>
        <p><strong>Como plantar e cuidar:</strong> ${window.DuoTree.escapeHtml(tree.comoPlantar)}</p>
        <div class="duotree-modal-actions">
          <button type="button" class="duotree-btn duotree-btn-sec" id="btn-fechar-wiki">Fechar</button>
          <button type="button" class="duotree-btn" id="btn-marcar-lido" ${jaLido ? 'disabled' : ''}>
            ${jaLido ? '✅ Ficha já lida' : 'Marcar como lida (+10 XP)'}
          </button>
        </div>
      `,
      onMount: (body) => {
        body.querySelector('#btn-fechar-wiki').addEventListener('click', window.DuoTree.closeModal);
        body.querySelector('#btn-marcar-lido').addEventListener('click', (e) => {
          if (!state.artigosLidos.includes(tree.id)) {
            state.artigosLidos.push(tree.id);
            window.DuoTree.addXp(10);
            window.DuoTree.unlockAchievement('explorador-biomas', 'Explorador dos Biomas', 60);
            window.DuoTree.saveState();
            e.target.textContent = '✅ Ficha já lida';
            e.target.disabled = true;
            window.DuoTree.showToast(`📖 Você leu a ficha de ${tree.nome} (+10 XP)!`);
          }
        });
      }
    });
  }

  function renderWiki() {
    if (!mainWiki) return;

    const filtradas = arvores.filter((tree) => {
      const matchCat =
        categoriaAtiva === 'Todas' ||
        tree.categorias.some((c) => c.toLowerCase() === categoriaAtiva.toLowerCase());

      const matchBusca =
        !termoBusca ||
        tree.nome.toLowerCase().includes(termoBusca) ||
        tree.nomeCientifico.toLowerCase().includes(termoBusca) ||
        tree.bioma.toLowerCase().includes(termoBusca) ||
        tree.resumo.toLowerCase().includes(termoBusca);

      return matchCat && matchBusca;
    });

    if (!filtradas.length) {
      mainWiki.innerHTML = `
        <div class="duotree-empty">
          Nenhuma árvore encontrada para essa busca ou categoria.<br><br>
          <button type="button" class="duotree-btn" id="btn-reset-wiki">Mostrar todas</button>
        </div>
      `;
      mainWiki.querySelector('#btn-reset-wiki').addEventListener('click', () => {
        termoBusca = '';
        categoriaAtiva = 'Todas';
        if (searchInput) searchInput.value = '';
        if (filterList) {
          filterList.querySelectorAll('li').forEach((el, i) => el.classList.toggle('ativo', i === 0));
        }
        renderWiki();
      });
      return;
    }

    mainWiki.innerHTML = '';
    filtradas.forEach((tree) => {
      const card = document.createElement('div');
      card.className = 'containerArvoresWiki';
      card.innerHTML = `
        <img src="${window.DuoTree.escapeHtml(window.DuoTree.resolveAssetPath(tree.imagem))}" alt="${window.DuoTree.escapeHtml(tree.nome)}">
        <div>
          <h3>${window.DuoTree.escapeHtml(tree.nome)}</h3>
          <h4>${window.DuoTree.escapeHtml(tree.nomeCientifico)}</h4>
          <p>${window.DuoTree.escapeHtml(tree.resumo)}</p>
        </div>
      `;
      card.addEventListener('click', () => openTreeModal(tree));
      mainWiki.appendChild(card);
    });
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      termoBusca = searchInput.value.trim().toLowerCase();
      renderWiki();
    });
    searchInput.addEventListener('input', () => {
      termoBusca = searchInput.value.trim().toLowerCase();
      renderWiki();
    });
  }

  renderWiki();
});
