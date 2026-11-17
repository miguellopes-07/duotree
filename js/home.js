document.addEventListener('DOMContentLoaded', async function () {
  const usuario = await window.DuoTree.iniciar({ exigirLogin: true });
  if (!usuario) {
    return;
  }

  const dicas = [
    'Oi, ' + usuario.nome + '! Árvores nativas alimentam muito mais polinizadores locais.',
    'Regar sua árvore diariamente completa a Missão Diária e rende +15 folhas!',
    'Explore a Wiki para aprender curiosidades sobre Pequi, Jatobá, Oiti e Araucária.',
    'Na Loja, você pode filtrar espécies nativas recomendadas para a sua região!',
    'O ODS 15 protege a Vida Terrestre — cada muda plantada faz diferença!'
  ];

  const estagios = ['Semente', 'Broto', 'Árvore Jovem', 'Árvore Adulta'];
  const mainHome = document.querySelector('main');

  function obterArvoreAtiva() {
    return (
      usuario.arvoresCompradas.find(function (a) {
        return a.id === usuario.arvoreAtivaId;
      }) ||
      usuario.arvoresCompradas[0] || {
        id: 'ipe-amarelo',
        nome: 'Ipê Amarelo',
        estagio: 1,
        regas: 0
      }
    );
  }

  function atualizarBadgesNotificacao() {
    const naoLidas = usuario.notificacoes.filter(function (n) {
      return !n.lida;
    }).length;

    document.querySelectorAll('.mascote_notificacao, .mascote_notificacaocelular').forEach(function (bloco) {
      let badge = bloco.querySelector('.duotree-notif-badge');
      if (naoLidas > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'duotree-notif-badge';
          bloco.appendChild(badge);
        }
        badge.textContent = String(naoLidas);
      } else if (badge) {
        badge.remove();
      }
    });
  }

  function renderizarBarraArvore() {
    let hud = document.querySelector('.duotree-home-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.className = 'duotree-home-hud';
      mainHome.appendChild(hud);
    }

    const ativa = obterArvoreAtiva();
    const indiceEstagio = Math.min(Math.max((ativa.estagio || 1) - 1, 0), 3);
    const nomeEstagio = estagios[indiceEstagio];

    hud.innerHTML =
      '<span>🌳 ' + window.DuoTree.escaparHtml(ativa.nome) + ' · ' + nomeEstagio + ' (' + (ativa.regas || 0) + ' regas)</span>' +
      '<button type="button" class="duotree-btn" data-acao="regar">💧 Regar</button>' +
      '<button type="button" class="duotree-btn duotree-btn-sec" data-acao="floresta">Floresta (' + usuario.arvoresCompradas.length + ')</button>';

    hud.querySelector('[data-acao="regar"]').addEventListener('click', aoRegarArvore);
    hud.querySelector('[data-acao="floresta"]').addEventListener('click', abrirModalFloresta);
  }

  function aoRegarArvore() {
    const resultado = window.DuoTree.regarArvoreAtiva();
    if (!resultado) {
      return;
    }
    renderizarBarraArvore();
    atualizarBadgesNotificacao();
    if (resultado.diariaConcluida) {
      window.DuoTree.mostrarAviso('💧 ' + resultado.arvore.nome + ' regada! Missão Diária concluída (+15 folhas)!');
    } else {
      window.DuoTree.mostrarAviso('💧 Você regou ' + resultado.arvore.nome + '! (+15 XP)');
    }
  }

  function abrirModalNotificacoes() {
    const htmlLista = usuario.notificacoes.length
      ? usuario.notificacoes
          .map(function (n) {
            return (
              '<div class="duotree-notif-item ' + (n.lida ? 'lida' : '') + '">' +
                '<strong>' + window.DuoTree.escaparHtml(n.titulo) + '</strong>' +
                '<p style="margin:4px 0 2px;">' + window.DuoTree.escaparHtml(n.mensagem) + '</p>' +
                '<small>' + window.DuoTree.escaparHtml(n.data) + '</small>' +
              '</div>'
            );
          })
          .join('')
      : '<p class="duotree-empty">Lista vazia</p>';

    window.DuoTree.abrirModal({
      titulo: 'Notificações',
      subtitulo: 'Novidades de ' + usuario.nome,
      html:
        '<div>' + htmlLista + '</div>' +
        '<div class="duotree-modal-actions">' +
          '<button type="button" class="duotree-btn" id="btn-marcar-lidas">Marcar todas como lidas</button>' +
        '</div>',
      aoAbrir: function (corpo) {
        corpo.querySelector('#btn-marcar-lidas').addEventListener('click', function () {
          window.DuoTree.marcarNotificacoesLidas();
          atualizarBadgesNotificacao();
          window.DuoTree.fecharModal();
          window.DuoTree.mostrarAviso('Notificações marcadas como lidas.', 'info');
        });
      }
    });
  }

  function abrirModalFloresta() {
    const htmlItens = usuario.arvoresCompradas.length
      ? usuario.arvoresCompradas
          .map(function (arvore) {
            const ativa = arvore.id === usuario.arvoreAtivaId;
            const nomeEstagio = estagios[Math.min(Math.max((arvore.estagio || 1) - 1, 0), 3)];
            return (
              '<div class="duotree-list-item">' +
                '<div>' +
                  '<strong>' + window.DuoTree.escaparHtml(arvore.nome) + (ativa ? ' · Em destaque' : '') + '</strong>' +
                  '<div class="duotree-meta-linha" style="margin:4px 0 0;">Estágio: ' + nomeEstagio + ' · Regas: ' + (arvore.regas || 0) + ' · Qtd: ' + (arvore.quantidade || 1) + '</div>' +
                '</div>' +
                (ativa
                  ? '<button type="button" class="duotree-btn" data-regar-agora="1">💧 Regar</button>'
                  : '<button type="button" class="duotree-btn duotree-btn-sec" data-destacar="' + window.DuoTree.escaparHtml(arvore.id) + '">Destacar</button>') +
              '</div>'
            );
          })
          .join('')
      : '<div class="duotree-empty">Lista vazia</div>';

    window.DuoTree.abrirModal({
      titulo: 'Floresta de ' + usuario.nome,
      subtitulo: usuario.arvoresPlantadas + ' árvores cultivadas · Nível ' + usuario.nivel,
      html:
        '<p style="margin-top:0;">Escolha qual espécie cuidar hoje ou visite a Loja para desbloquear novas mudas nativas.</p>' +
        '<div>' + htmlItens + '</div>' +
        '<div class="duotree-modal-actions">' +
          '<a href="pages/loja.html" class="duotree-btn duotree-btn-sec">Ir para Loja</a>' +
          '<a href="pages/missoes.html" class="duotree-btn">Fazer Missões</a>' +
        '</div>',
      aoAbrir: function (corpo) {
        corpo.querySelectorAll('[data-destacar]').forEach(function (botao) {
          botao.addEventListener('click', function () {
            usuario.arvoreAtivaId = botao.getAttribute('data-destacar');
            window.DuoTree.salvarEstado();
            renderizarBarraArvore();
            abrirModalFloresta();
          });
        });

        const botaoRegar = corpo.querySelector('[data-regar-agora]');
        if (botaoRegar) {
          botaoRegar.addEventListener('click', function () {
            aoRegarArvore();
            abrirModalFloresta();
          });
        }
      }
    });
  }

  let tempoBalao = null;
  function mostrarDicaMascote() {
    const anterior = document.querySelector('.duotree-speech-bubble');
    if (anterior) {
      anterior.remove();
    }
    if (tempoBalao) {
      clearTimeout(tempoBalao);
    }

    const texto = dicas[Math.floor(Math.random() * dicas.length)];
    const balao = document.createElement('div');
    balao.className = 'duotree-speech-bubble';
    balao.innerHTML = '<strong>' + window.DuoTree.escaparHtml(usuario.nome) + ', dica verde:</strong><br>' + window.DuoTree.escaparHtml(texto);
    document.body.appendChild(balao);

    tempoBalao = setTimeout(function () {
      balao.remove();
    }, 4500);
  }

  document.querySelectorAll('.mascote_notificacao svg, .mascote_notificacaocelular svg').forEach(function (sino) {
    sino.addEventListener('click', abrirModalNotificacoes);
  });

  document.querySelectorAll('.mascote_notificacao img, .mascote_notificacaocelular img').forEach(function (mascote) {
    mascote.addEventListener('click', mostrarDicaMascote);
  });

  document.querySelectorAll('main .arvorepc, main .arvoretablet, main .arvorecelular').forEach(function (imgArvore) {
    imgArvore.addEventListener('click', abrirModalFloresta);
  });

  atualizarBadgesNotificacao();
  renderizarBarraArvore();
});
