document.addEventListener('DOMContentLoaded', async function () {
  const usuario = await window.DuoTree.iniciar({ exigirLogin: true });
  if (!usuario) {
    return;
  }

  const arvores = await window.DuoTree.carregarDados('wiki.json');
  const mainWiki = document.querySelector('.mainwiki');
  const paginacaoEl = document.querySelector('#paginacao-wiki');
  const formBusca = document.querySelector('.barrapesquisawiki');
  const inputBusca = formBusca ? formBusca.querySelector('input') : null;
  const listaFiltros = document.querySelector('.listfilterwiki');

  const ITENS_POR_PAGINA = 6;
  const categorias = ['Todas', 'Nativas', 'Frutíferas', 'Medicinais', 'Ornamentais'];
  let paginaAtual = 1;
  let categoriaAtiva = 'Todas';
  let termoBusca = '';

  if (listaFiltros) {
    listaFiltros.innerHTML = categorias
      .map(function (cat, idx) {
        return '<li class="' + (idx === 0 ? 'ativo' : '') + '" data-cat="' + cat + '">' + cat + '</li>';
      })
      .join('');

    listaFiltros.querySelectorAll('li').forEach(function (li) {
      li.addEventListener('click', function () {
        listaFiltros.querySelectorAll('li').forEach(function (item) {
          item.classList.remove('ativo');
        });
        li.classList.add('ativo');
        categoriaAtiva = li.getAttribute('data-cat') || 'Todas';
        paginaAtual = 1;
        renderizarWiki();
      });
    });
  }

  function abrirDetalhesArvore(arvore) {
    const jaLido = usuario.artigosLidos.includes(arvore.id);

    window.DuoTree.abrirModal({
      titulo: arvore.nome,
      subtitulo: arvore.nomeCientifico,
      html:
        '<img class="duotree-modal-img" src="' + window.DuoTree.escaparHtml(window.DuoTree.resolverImagem(arvore.imagem)) + '" alt="' + window.DuoTree.escaparHtml(arvore.nome) + '">' +
        '<div class="duotree-meta-linha">' +
          window.DuoTree.escaparHtml(arvore.categorias.join(' · ')) + ' · ' + window.DuoTree.escaparHtml(arvore.bioma) +
        '</div>' +
        '<p><strong>Porte:</strong> ' + window.DuoTree.escaparHtml(arvore.porte) + '</p>' +
        '<p><strong>Regiões:</strong> ' + window.DuoTree.escaparHtml(arvore.regioes.join(', ')) + '</p>' +
        '<p>' + window.DuoTree.escaparHtml(arvore.descricaoCompleta) + '</p>' +
        '<p><strong>Curiosidade:</strong> ' + window.DuoTree.escaparHtml(arvore.curiosidade) + '</p>' +
        '<p><strong>Como plantar e cuidar:</strong> ' + window.DuoTree.escaparHtml(arvore.comoPlantar) + '</p>' +
        '<div class="duotree-modal-actions">' +
          '<button type="button" class="duotree-btn duotree-btn-sec" id="btn-fechar-wiki">Fechar</button>' +
          '<button type="button" class="duotree-btn" id="btn-marcar-lido" ' + (jaLido ? 'disabled' : '') + '>' +
            (jaLido ? '✅ Ficha já lida' : 'Marcar como lida (+10 XP)') +
          '</button>' +
        '</div>',
      aoAbrir: function (corpo) {
        corpo.querySelector('#btn-fechar-wiki').addEventListener('click', window.DuoTree.fecharModal);
        corpo.querySelector('#btn-marcar-lido').addEventListener('click', function (evento) {
          if (!usuario.artigosLidos.includes(arvore.id)) {
            usuario.artigosLidos.push(arvore.id);
            window.DuoTree.adicionarXp(10);
            window.DuoTree.desbloquearConquista('explorador-biomas', 'Explorador dos Biomas', 60);
            window.DuoTree.salvarEstado();
            evento.target.textContent = '✅ Ficha já lida';
            evento.target.disabled = true;
            window.DuoTree.mostrarAviso('📖 Você leu a ficha de ' + arvore.nome + ' (+10 XP)!');
          }
        });
      }
    });
  }

  function renderizarWiki() {
    if (!mainWiki) {
      return;
    }

    const filtradas = arvores.filter(function (arvore) {
      const bateCategoria =
        categoriaAtiva === 'Todas' ||
        arvore.categorias.some(function (c) {
          return c.toLowerCase() === categoriaAtiva.toLowerCase();
        });

      const bateBusca =
        !termoBusca ||
        arvore.nome.toLowerCase().includes(termoBusca) ||
        arvore.nomeCientifico.toLowerCase().includes(termoBusca) ||
        arvore.bioma.toLowerCase().includes(termoBusca) ||
        arvore.resumo.toLowerCase().includes(termoBusca);

      return bateCategoria && bateBusca;
    });

    if (!filtradas.length) {
      if (paginacaoEl) {
        paginacaoEl.innerHTML = '';
      }
      mainWiki.innerHTML =
        '<div class="duotree-empty">' +
          'Lista vazia — nenhuma árvore encontrada.<br><br>' +
          '<button type="button" class="duotree-btn" id="btn-reset-wiki">Mostrar todas</button>' +
        '</div>';

      mainWiki.querySelector('#btn-reset-wiki').addEventListener('click', function () {
        termoBusca = '';
        categoriaAtiva = 'Todas';
        paginaAtual = 1;
        if (inputBusca) {
          inputBusca.value = '';
        }
        if (listaFiltros) {
          listaFiltros.querySelectorAll('li').forEach(function (el, i) {
            el.classList.toggle('ativo', i === 0);
          });
        }
        renderizarWiki();
      });
      return;
    }

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
    if (paginaAtual > totalPaginas) {
      paginaAtual = totalPaginas;
    }

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const itensPagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

    mainWiki.innerHTML = '';
    itensPagina.forEach(function (arvore) {
      const card = document.createElement('div');
      card.className = 'containerArvoresWiki';
      card.innerHTML =
        '<img src="' + window.DuoTree.escaparHtml(window.DuoTree.resolverImagem(arvore.imagem)) + '" alt="' + window.DuoTree.escaparHtml(arvore.nome) + '">' +
        '<div>' +
          '<h3>' + window.DuoTree.escaparHtml(arvore.nome) + '</h3>' +
          '<h4>' + window.DuoTree.escaparHtml(arvore.nomeCientifico) + '</h4>' +
          '<p>' + window.DuoTree.escaparHtml(arvore.resumo) + '</p>' +
        '</div>';

      card.addEventListener('click', function () {
        abrirDetalhesArvore(arvore);
      });
      mainWiki.appendChild(card);
    });

    if (paginacaoEl) {
      paginacaoEl.innerHTML = '';
      paginacaoEl.appendChild(
        window.DuoTree.criarPaginacao({
          totalItens: filtradas.length,
          itensPorPagina: ITENS_POR_PAGINA,
          paginaAtual: paginaAtual,
          rotulo: 'fichas',
          aoMudarPagina: function (novaPagina) {
            paginaAtual = novaPagina;
            renderizarWiki();
            mainWiki.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        })
      );
    }
  }

  if (formBusca && inputBusca) {
    formBusca.addEventListener('submit', function (evento) {
      evento.preventDefault();
      termoBusca = inputBusca.value.trim().toLowerCase();
      paginaAtual = 1;
      renderizarWiki();
    });

    inputBusca.addEventListener('input', function () {
      termoBusca = inputBusca.value.trim().toLowerCase();
      paginaAtual = 1;
      renderizarWiki();
    });
  }

  renderizarWiki();
});
