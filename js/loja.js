document.addEventListener('DOMContentLoaded', async () => {
  const state = await window.DuoTree.init();
  const especies = await window.DuoTree.fetchData('loja.json');

  const sectionCards = document.querySelector('main > section');
  const selectRegiao = document.querySelector('#idregiao');
  const searchForm = document.querySelector('.barrapesquisawiki');
  const searchInput = searchForm ? searchForm.querySelector('input') : null;
  const filterTabs = Array.from(document.querySelectorAll('.listfilterloja > li'));

  let filtroNome = '';
  let filtroTipo = 'todas';
  let filtroRegiao = (state.regiao || '').toLowerCase();

  if (selectRegiao && state.regiao) {
    selectRegiao.value = state.regiao;
  }

  function isOwned(id) {
    return state.arvoresCompradas.some((a) => a.id === id);
  }

  function getOwnedCount(id) {
    const found = state.arvoresCompradas.find((a) => a.id === id);
    return found ? found.quantidade || 1 : 0;
  }

  function openSpeciesModal(item) {
    const ownedCount = getOwnedCount(item.id);
    const podeComprar = state.folhas >= item.preco;

    window.DuoTree.openModal({
      title: item.nome,
      subtitle: item.nomeCientifico,
      html: `
        <img class="duotree-modal-img" src="${window.DuoTree.escapeHtml(window.DuoTree.resolveAssetPath(item.imagem))}" alt="${window.DuoTree.escapeHtml(item.nome)}">
        <div>
          <span class="duotree-badge">${window.DuoTree.escapeHtml(item.tipo)}</span>
          <span class="duotree-badge">${window.DuoTree.escapeHtml(item.bioma)}</span>
          ${ownedCount > 0 ? `<span class="duotree-badge">Na sua floresta (${ownedCount}x)</span>` : ''}
        </div>
        <p><strong>${window.DuoTree.escapeHtml(item.regiaoTexto)}</strong></p>
        <p>${window.DuoTree.escapeHtml(item.descricao)}</p>
        <p><strong>Benefício ecológico:</strong> ${window.DuoTree.escapeHtml(item.beneficio)}</p>
        <div class="duotree-modal-actions">
          <button type="button" class="duotree-btn duotree-btn-sec" id="btn-fechar-loja">Fechar</button>
          <button type="button" class="duotree-btn" id="btn-comprar-arvore" ${podeComprar ? '' : 'disabled'}>
            ${podeComprar ? `Adquirir por ${item.preco} 🍃` : `Faltam ${item.preco - state.folhas} 🍃`}
          </button>
        </div>
      `,
      onMount: (body) => {
        body.querySelector('#btn-fechar-loja').addEventListener('click', window.DuoTree.closeModal);
        body.querySelector('#btn-comprar-arvore').addEventListener('click', () => {
          const result = window.DuoTree.buySpecies(item);
          if (!result.ok) {
            window.DuoTree.showToast(result.motivo, 'aviso');
            return;
          }
          window.DuoTree.closeModal();
          renderCards();
          window.DuoTree.showToast(`🌱 Você adquiriu ${item.nome} (+35 XP)!`);
        });
      }
    });
  }

  function renderCards() {
    if (!sectionCards) return;

    const filtrados = especies.filter((item) => {
      const matchNome =
        item.nome.toLowerCase().includes(filtroNome) ||
        item.nomeCientifico.toLowerCase().includes(filtroNome) ||
        item.bioma.toLowerCase().includes(filtroNome);

      const matchTipo =
        filtroTipo === 'todas' || item.tipo.toLowerCase() === filtroTipo;

      const matchRegiao =
        !filtroRegiao ||
        item.regioes.some((reg) => reg.toLowerCase() === filtroRegiao) ||
        item.regiaoTexto.toLowerCase().includes(filtroRegiao);

      return matchNome && matchTipo && matchRegiao;
    });

    if (!filtrados.length) {
      sectionCards.innerHTML = `
        <div class="duotree-empty">
          Nenhuma espécie encontrada com esses filtros.<br><br>
          <button type="button" class="duotree-btn" id="btn-limpar-filtros-loja">Limpar filtros</button>
        </div>
      `;
      sectionCards
        .querySelector('#btn-limpar-filtros-loja')
        .addEventListener('click', () => {
          filtroNome = '';
          filtroTipo = 'todas';
          filtroRegiao = '';
          if (searchInput) searchInput.value = '';
          if (selectRegiao) selectRegiao.value = '';
          filterTabs.forEach((li, idx) => li.classList.toggle('ativo', idx === 0));
          renderCards();
        });
      return;
    }

    sectionCards.innerHTML = '';
    filtrados.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'listaarvore';
      const owned = isOwned(item.id);
      card.innerHTML = `
        <div class="imgarvore"><img src="${window.DuoTree.escapeHtml(window.DuoTree.resolveAssetPath(item.imagem))}" alt="${window.DuoTree.escapeHtml(item.nome)}"></div>
        <div class="textoarvore">
          <h3>${window.DuoTree.escapeHtml(item.nome)}${owned ? '<span class="duotree-owned-tag">Na floresta</span>' : ''}</h3>
          <h6>${window.DuoTree.escapeHtml(item.nomeCientifico)}</h6>
          <h5>${window.DuoTree.escapeHtml(item.tipo)}</h5>
          <p class="regiao">${window.DuoTree.escapeHtml(item.regiaoTexto)}</p>
          <div class="custo">
            <h4>${item.preco}</h4>
            <img src="../assets/images/loja/folha.png" alt="Folhas">
          </div>
        </div>
      `;
      card.addEventListener('click', () => openSpeciesModal(item));
      sectionCards.appendChild(card);
    });
  }

  if (selectRegiao) {
    selectRegiao.addEventListener('change', () => {
      state.regiao = selectRegiao.value;
      window.DuoTree.saveState();
      filtroRegiao = selectRegiao.value.trim().toLowerCase();
      renderCards();
    });
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      filtroNome = searchInput.value.trim().toLowerCase();
      renderCards();
    });
    searchInput.addEventListener('input', () => {
      filtroNome = searchInput.value.trim().toLowerCase();
      renderCards();
    });
  }

  filterTabs.forEach((opcao) => {
    opcao.addEventListener('click', () => {
      filterTabs.forEach((li) => li.classList.remove('ativo'));
      opcao.classList.add('ativo');
      filtroTipo = opcao.textContent.trim().toLowerCase();
      renderCards();
    });
  });

  renderCards();
});
