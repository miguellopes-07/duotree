document.addEventListener('DOMContentLoaded', async function () {
  const usuario = await window.DuoTree.iniciar({ exigirLogin: true });
  if (!usuario) {
    return;
  }

  const especies = await window.DuoTree.carregarDados('loja.json');
  const secaoCards = document.querySelector('main > section');
  const paginacaoEl = document.querySelector('#paginacao-loja');
  const selectRegiao = document.querySelector('#idregiao');
  const formBusca = document.querySelector('.barrapesquisawiki');
  const inputBusca = formBusca ? formBusca.querySelector('input') : null;
  const abasFiltro = Array.from(document.querySelectorAll('.listfilterloja > li'));

  const ITENS_POR_PAGINA = 6;
  let paginaAtual = 1;
  let filtroNome = '';
  let filtroTipo = 'todas';
  let filtroRegiao = (usuario.regiao || '').toLowerCase();

  if (selectRegiao && usuario.regiao) {
    selectRegiao.value = usuario.regiao;
  }

  function possuiEspecie(id) {
    return usuario.arvoresCompradas.some(function (a) {
      return a.id === id;
    });
  }

  function quantidadePossuida(id) {
    const item = usuario.arvoresCompradas.find(function (a) {
      return a.id === id;
    });
    return item ? item.quantidade || 1 : 0;
  }

  function abrirDetalhesEspecie(item) {
    const qtd = quantidadePossuida(item.id);
    const podeComprar = usuario.folhas >= item.preco;

    window.DuoTree.abrirModal({
      titulo: item.nome,
      subtitulo: item.nomeCientifico,
      html:
        '<img class="duotree-modal-img" src="' + window.DuoTree.escaparHtml(window.DuoTree.resolverImagem(item.imagem)) + '" alt="' + window.DuoTree.escaparHtml(item.nome) + '">' +
        '<div class="duotree-meta-linha">' +
          window.DuoTree.escaparHtml(item.tipo) + ' · ' + window.DuoTree.escaparHtml(item.bioma) +
          (qtd > 0 ? ' · Na sua floresta (' + qtd + 'x)' : '') +
        '</div>' +
        '<p><strong>' + window.DuoTree.escaparHtml(item.regiaoTexto) + '</strong></p>' +
        '<p>' + window.DuoTree.escaparHtml(item.descricao) + '</p>' +
        '<p><strong>Benefício ecológico:</strong> ' + window.DuoTree.escaparHtml(item.beneficio) + '</p>' +
        '<div class="duotree-modal-actions">' +
          '<button type="button" class="duotree-btn duotree-btn-sec" id="btn-fechar-loja">Fechar</button>' +
          '<button type="button" class="duotree-btn" id="btn-comprar-arvore" ' + (podeComprar ? '' : 'disabled') + '>' +
            (podeComprar ? 'Adquirir por ' + item.preco + ' 🍃' : 'Faltam ' + (item.preco - usuario.folhas) + ' 🍃') +
          '</button>' +
        '</div>',
      aoAbrir: function (corpo) {
        corpo.querySelector('#btn-fechar-loja').addEventListener('click', window.DuoTree.fecharModal);
        corpo.querySelector('#btn-comprar-arvore').addEventListener('click', function () {
          const resultado = window.DuoTree.comprarEspecie(item);
          if (!resultado.ok) {
            window.DuoTree.mostrarAviso(resultado.motivo, 'aviso');
            return;
          }
          window.DuoTree.fecharModal();
          renderizarCards();
          window.DuoTree.mostrarAviso('🌱 Você adquiriu ' + item.nome + ' (+35 XP)!');
        });
      }
    });
  }

  function renderizarCards() {
    if (!secaoCards) {
      return;
    }

    const filtrados = especies.filter(function (item) {
      const bateNome =
        item.nome.toLowerCase().includes(filtroNome) ||
        item.nomeCientifico.toLowerCase().includes(filtroNome) ||
        item.bioma.toLowerCase().includes(filtroNome);

      const bateTipo = filtroTipo === 'todas' || item.tipo.toLowerCase() === filtroTipo;

      const bateRegiao =
        !filtroRegiao ||
        item.regioes.some(function (r) {
          return r.toLowerCase() === filtroRegiao;
        }) ||
        item.regiaoTexto.toLowerCase().includes(filtroRegiao);

      return bateNome && bateTipo && bateRegiao;
    });

    if (!filtrados.length) {
      if (paginacaoEl) {
        paginacaoEl.innerHTML = '';
      }
      secaoCards.innerHTML =
        '<div class="duotree-empty">' +
          'Lista vazia — nenhuma espécie encontrada para esse filtro.<br><br>' +
          '<button type="button" class="duotree-btn" id="btn-limpar-filtros-loja">Limpar filtros</button>' +
        '</div>';

      secaoCards.querySelector('#btn-limpar-filtros-loja').addEventListener('click', function () {
        filtroNome = '';
        filtroTipo = 'todas';
        filtroRegiao = '';
        paginaAtual = 1;
        if (inputBusca) {
          inputBusca.value = '';
        }
        if (selectRegiao) {
          selectRegiao.value = '';
        }
        abasFiltro.forEach(function (li, i) {
          li.classList.toggle('ativo', i === 0);
        });
        renderizarCards();
      });
      return;
    }

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));
    if (paginaAtual > totalPaginas) {
      paginaAtual = totalPaginas;
    }

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const itensPagina = filtrados.slice(inicio, inicio + ITENS_POR_PAGINA);

    secaoCards.innerHTML = '';
    itensPagina.forEach(function (item) {
      const card = document.createElement('div');
      card.className = 'listaarvore';
      const jaPossui = possuiEspecie(item.id);

      card.innerHTML =
        '<div class="imgarvore"><img src="' + window.DuoTree.escaparHtml(window.DuoTree.resolverImagem(item.imagem)) + '" alt="' + window.DuoTree.escaparHtml(item.nome) + '"></div>' +
        '<div class="textoarvore">' +
          '<h3>' + window.DuoTree.escaparHtml(item.nome) + (jaPossui ? '<span class="duotree-owned-tag">· Na floresta</span>' : '') + '</h3>' +
          '<h6>' + window.DuoTree.escaparHtml(item.nomeCientifico) + '</h6>' +
          '<h5>' + window.DuoTree.escaparHtml(item.tipo) + '</h5>' +
          '<p class="regiao">' + window.DuoTree.escaparHtml(item.regiaoTexto) + '</p>' +
          '<div class="custo">' +
            '<h4>' + item.preco + '</h4>' +
            '<img src="../assets/images/loja/folha.png" alt="Folhas">' +
          '</div>' +
        '</div>';

      card.addEventListener('click', function () {
        abrirDetalhesEspecie(item);
      });
      secaoCards.appendChild(card);
    });

    if (paginacaoEl) {
      paginacaoEl.innerHTML = '';
      paginacaoEl.appendChild(
        window.DuoTree.criarPaginacao({
          totalItens: filtrados.length,
          itensPorPagina: ITENS_POR_PAGINA,
          paginaAtual: paginaAtual,
          rotulo: 'espécies',
          aoMudarPagina: function (novaPagina) {
            paginaAtual = novaPagina;
            renderizarCards();
            secaoCards.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        })
      );
    }
  }

  if (selectRegiao) {
    selectRegiao.addEventListener('change', function () {
      usuario.regiao = selectRegiao.value;
      window.DuoTree.salvarEstado();
      filtroRegiao = selectRegiao.value.trim().toLowerCase();
      paginaAtual = 1;
      renderizarCards();
    });
  }

  if (formBusca && inputBusca) {
    formBusca.addEventListener('submit', function (evento) {
      evento.preventDefault();
      filtroNome = inputBusca.value.trim().toLowerCase();
      paginaAtual = 1;
      renderizarCards();
    });

    inputBusca.addEventListener('input', function () {
      filtroNome = inputBusca.value.trim().toLowerCase();
      paginaAtual = 1;
      renderizarCards();
    });
  }

  abasFiltro.forEach(function (opcao) {
    opcao.addEventListener('click', function () {
      abasFiltro.forEach(function (li) {
        li.classList.remove('ativo');
      });
      opcao.classList.add('ativo');
      filtroTipo = opcao.textContent.trim().toLowerCase();
      paginaAtual = 1;
      renderizarCards();
    });
  });

  renderizarCards();
});
