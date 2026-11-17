document.addEventListener('DOMContentLoaded', async function () {
  const usuario = await window.DuoTree.iniciar({ exigirLogin: true });
  if (!usuario) {
    return;
  }

  const dados = await window.DuoTree.carregarDados('missoes.json');
  const linksFiltro = Array.from(document.querySelectorAll('.navquest a'));
  const listas = document.querySelectorAll('main .listaquest');
  const listaDisponiveis = listas[0];
  const listaConcluidas = listas[1];
  const pagDisponiveisEl = document.querySelector('#paginacao-disponiveis');
  const pagConcluidasEl = document.querySelector('#paginacao-concluidas');

  const MISSOES_POR_PAGINA = 4;
  let paginaDisponiveis = 1;
  let paginaConcluidas = 1;
  let filtroTipo = 'todas';

  linksFiltro.forEach(function (link, idx) {
    if (idx === 0) {
      link.classList.add('ativo');
    }
    link.addEventListener('click', function (evento) {
      evento.preventDefault();
      linksFiltro.forEach(function (a) {
        a.classList.remove('ativo');
      });
      link.classList.add('ativo');
      filtroTipo = link.textContent.trim().toLowerCase();
      paginaDisponiveis = 1;
      paginaConcluidas = 1;
      renderizarMissoes();
    });
  });

  function obterProgresso(missao) {
    if (usuario.missoesConcluidas.includes(missao.id)) {
      return { atual: missao.meta, meta: missao.meta, registros: [] };
    }
    if (missao.acaoDiaria === 'wiki') {
      const lidos = Array.isArray(usuario.artigosLidos) ? usuario.artigosLidos.length : 0;
      return { atual: Math.min(lidos, missao.meta), meta: missao.meta, registros: [] };
    }
    if (missao.regraDesafio === 'arvores') {
      const especies = Array.isArray(usuario.arvoresCompradas) ? usuario.arvoresCompradas.length : 0;
      return { atual: Math.min(especies, missao.meta), meta: missao.meta, registros: [] };
    }
    if (missao.regraDesafio === 'plantios') {
      const totalPlantios = Array.isArray(usuario.plantiosPessoais) ? usuario.plantiosPessoais.length : 0;
      return { atual: Math.min(totalPlantios, missao.meta), meta: missao.meta, registros: [] };
    }
    const salvo = usuario.progressoMissoes[missao.id];
    if (salvo) {
      return {
        atual: Math.min(salvo.atual || 0, missao.meta),
        meta: missao.meta,
        registros: salvo.registros || []
      };
    }
    return { atual: 0, meta: missao.meta, registros: [] };
  }

  function abrirMissaoQuiz(missao) {
    const perguntas = (dados.quizzes[missao.quizId] || []).slice(0, missao.meta);
    let indice = 0;
    let acertos = 0;

    function mostrarPergunta() {
      const questao = perguntas[indice];
      if (!questao) {
        return;
      }

      window.DuoTree.abrirModal({
        titulo: missao.titulo,
        subtitulo: 'Pergunta ' + (indice + 1) + ' de ' + perguntas.length,
        html:
          '<p style="font-weight:800;font-size:1.04rem;">' + window.DuoTree.escaparHtml(questao.pergunta) + '</p>' +
          '<div class="duotree-quiz-opcoes">' +
            questao.alternativas
              .map(function (alt, i) {
                return '<button type="button" class="duotree-quiz-opcao" data-opt="' + i + '">' + window.DuoTree.escaparHtml(alt) + '</button>';
              })
              .join('') +
          '</div>' +
          '<div id="quiz-feedback" style="font-size:0.92rem;font-weight:700;min-height:24px;"></div>' +
          '<div class="duotree-modal-actions">' +
            '<button type="button" class="duotree-btn" id="btn-quiz-next" style="display:none;">' +
              (indice + 1 < perguntas.length ? 'Próxima pergunta' : 'Concluir Quiz') +
            '</button>' +
          '</div>',
        aoAbrir: function (corpo) {
          const botoes = corpo.querySelectorAll('.duotree-quiz-opcao');
          const feedback = corpo.querySelector('#quiz-feedback');
          const btnProximo = corpo.querySelector('#btn-quiz-next');

          botoes.forEach(function (btn) {
            btn.addEventListener('click', function () {
              const escolha = Number(btn.getAttribute('data-opt'));
              botoes.forEach(function (b) {
                b.disabled = true;
              });

              if (escolha === questao.correta) {
                btn.classList.add('correta');
                acertos += 1;
                feedback.style.color = '#2c731f';
                feedback.textContent = '✅ Correto! ' + questao.explicacao;
              } else {
                btn.classList.add('errada');
                botoes[questao.correta].classList.add('correta');
                feedback.style.color = '#8b2620';
                feedback.textContent = '💡 ' + questao.explicacao;
              }

              usuario.progressoMissoes[missao.id] = {
                atual: indice + 1,
                meta: perguntas.length
              };
              window.DuoTree.salvarEstado();
              renderizarMissoes();
              btnProximo.style.display = 'inline-flex';
            });
          });

          btnProximo.addEventListener('click', function () {
            if (indice + 1 < perguntas.length) {
              indice += 1;
              mostrarPergunta();
            } else {
              window.DuoTree.concluirMissao(missao.id, missao.recompensaFolhas, missao.recompensaXp);
              window.DuoTree.fecharModal();
              renderizarMissoes();
              window.DuoTree.mostrarAviso('🎉 Quiz concluído (' + acertos + '/' + perguntas.length + ')! +' + missao.recompensaFolhas + ' folhas!');
            }
          });
        }
      });
    }

    mostrarPergunta();
  }

  function abrirMissaoLeitura(missao) {
    const artigo = dados.leituras[missao.leituraId];
    if (!artigo) {
      return;
    }

    window.DuoTree.abrirModal({
      titulo: artigo.titulo,
      subtitulo: artigo.subtitulo,
      html:
        artigo.paragrafos
          .map(function (p) {
            return '<p>' + window.DuoTree.escaparHtml(p) + '</p>';
          })
          .join('') +
        '<hr style="margin:16px 0;height:2px;">' +
        '<p style="font-weight:800;">' + window.DuoTree.escaparHtml(artigo.pergunta) + '</p>' +
        '<div class="duotree-quiz-opcoes">' +
          artigo.alternativas
            .map(function (alt, i) {
              return '<button type="button" class="duotree-quiz-opcao" data-read-opt="' + i + '">' + window.DuoTree.escaparHtml(alt) + '</button>';
            })
            .join('') +
        '</div>' +
        '<div id="read-feedback" style="font-weight:700;"></div>',
      aoAbrir: function (corpo) {
        const botoes = corpo.querySelectorAll('.duotree-quiz-opcao');
        const feedback = corpo.querySelector('#read-feedback');

        botoes.forEach(function (btn) {
          btn.addEventListener('click', function () {
            const escolha = Number(btn.getAttribute('data-read-opt'));
            if (escolha === artigo.correta) {
              btn.classList.add('correta');
              botoes.forEach(function (b) {
                b.disabled = true;
              });
              usuario.progressoMissoes[missao.id] = { atual: 1, meta: 1 };
              window.DuoTree.concluirMissao(missao.id, missao.recompensaFolhas, missao.recompensaXp);
              renderizarMissoes();
              feedback.style.color = '#2c731f';
              feedback.textContent = '✅ Missão concluída! +' + missao.recompensaFolhas + ' folhas e +' + missao.recompensaXp + ' XP.';
              window.DuoTree.mostrarAviso('📖 Leitura concluída! +' + missao.recompensaFolhas + ' folhas!');
            } else {
              btn.classList.add('errada');
              feedback.style.color = '#8b2620';
              feedback.textContent = 'Leia o texto novamente e tente outra opção.';
            }
          });
        });
      }
    });
  }

  function abrirMissaoPratica(missao) {
    const progresso = obterProgresso(missao);
    const registros = progresso.registros || [];
    const modoObservacao = missao.acaoPratica === 'observacao';
    const textoIntro = modoObservacao
      ? 'Observe árvores perto de casa, da escola ou da praça e registre cada identificação:'
      : 'Registre cada plantio realizado para acompanhar sua meta ecológica:';
    const labelEspecie = modoObservacao ? 'Árvore observada' : 'Espécie plantada';
    const placeholderEspecie = modoObservacao ? 'Ex.: Quaresmeira, Oiti, Pitangueira...' : 'Ex.: Ipê Amarelo, Jabuticabeira...';
    const labelLocal = modoObservacao ? 'Onde você observou' : 'Local do plantio';
    const textoBotao = modoObservacao ? 'Registrar observação (+1)' : 'Registrar plantio (+1)';
    const iconeItem = modoObservacao ? '🔎' : '🌱';

    window.DuoTree.abrirModal({
      titulo: missao.titulo,
      subtitulo: 'Progresso atual: ' + progresso.atual + ' / ' + missao.meta,
      html:
        '<p>' + textoIntro + '</p>' +
        '<form id="form-plantio">' +
          '<div class="duotree-form-group">' +
            '<label for="especie-plantio">' + labelEspecie + '</label>' +
            '<input id="especie-plantio" type="text" placeholder="' + placeholderEspecie + '" required>' +
          '</div>' +
          '<div class="duotree-form-group">' +
            '<label for="local-plantio">' + labelLocal + '</label>' +
            '<input id="local-plantio" type="text" placeholder="Ex.: Quintal, praça do bairro, escola..." required>' +
          '</div>' +
          '<button type="submit" class="duotree-btn">' + textoBotao + '</button>' +
        '</form>' +
        '<div style="margin-top:14px;">' +
          (registros.length
            ? registros
                .map(function (r, i) {
                  return (
                    '<div class="duotree-list-item">' +
                      '<span>' + iconeItem + ' #' + (i + 1) + ' <strong>' + window.DuoTree.escaparHtml(r.especie) + '</strong> — ' + window.DuoTree.escaparHtml(r.local) + ' (' + window.DuoTree.escaparHtml(r.data) + ')</span>' +
                      '<button type="button" class="btn-remover-item" data-remover-registro="' + i + '">Remover</button>' +
                    '</div>'
                  );
                })
                .join('')
            : '<div class="duotree-empty">Lista vazia</div>') +
        '</div>',
      aoAbrir: function (corpo) {
        corpo.querySelector('#form-plantio').addEventListener('submit', function (evento) {
          evento.preventDefault();
          const especie = corpo.querySelector('#especie-plantio').value.trim();
          const local = corpo.querySelector('#local-plantio').value.trim();
          if (!especie || !local) {
            return;
          }

          registros.push({
            especie: especie,
            local: local,
            data: new Date().toLocaleDateString('pt-BR')
          });

          const atual = Math.min(registros.length, missao.meta);
          usuario.progressoMissoes[missao.id] = {
            atual: atual,
            meta: missao.meta,
            registros: registros
          };

          if (!modoObservacao) {
            usuario.plantiosPessoais.unshift({
              id: 'plantio-' + Date.now(),
              especie: especie,
              local: local,
              data: new Date().toLocaleDateString('pt-BR')
            });
            usuario.arvoresPlantadas += 1;
          }
          window.DuoTree.salvarEstado();

          if (atual >= missao.meta) {
            window.DuoTree.concluirMissao(missao.id, missao.recompensaFolhas, missao.recompensaXp);
            window.DuoTree.fecharModal();
            renderizarMissoes();
            window.DuoTree.mostrarAviso('🌳 Missão prática concluída! +' + missao.recompensaFolhas + ' folhas!');
          } else {
            window.DuoTree.mostrarAviso(iconeItem + ' Registro salvo (' + atual + '/' + missao.meta + ')!');
            renderizarMissoes();
            abrirMissaoPratica(missao);
          }
        });

        corpo.querySelectorAll('[data-remover-registro]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const idxRemover = Number(btn.getAttribute('data-remover-registro'));
            registros.splice(idxRemover, 1);
            usuario.progressoMissoes[missao.id] = {
              atual: registros.length,
              meta: missao.meta,
              registros: registros
            };
            window.DuoTree.salvarEstado();
            renderizarMissoes();
            abrirMissaoPratica(missao);
          });
        });
      }
    });
  }

  function abrirMissaoDiaria(missao) {
    if (missao.acaoDiaria === 'wiki') {
      const progresso = obterProgresso(missao);
      const pronto = progresso.atual >= missao.meta;
      window.DuoTree.abrirModal({
        titulo: missao.titulo,
        subtitulo: 'Progresso: ' + progresso.atual + ' / ' + missao.meta + ' fichas lidas',
        html:
          '<p>' + window.DuoTree.escaparHtml(missao.descricao) + '</p>' +
          '<p>' +
            (pronto
              ? 'Você já completou a leitura de ' + missao.meta + ' fichas na Wiki! Clique abaixo para resgatar suas folhas.'
              : 'Abra a Wiki, clique em pelo menos ' + missao.meta + ' árvores diferentes e volte aqui para resgatar <strong>+' + missao.recompensaFolhas + ' folhas</strong>.') +
          '</p>' +
          '<div class="duotree-modal-actions">' +
            '<a href="wiki.html" class="duotree-btn duotree-btn-sec">Ir para a Wiki</a>' +
            (pronto ? '<button type="button" class="duotree-btn" id="btn-resgatar-wiki">Resgatar +' + missao.recompensaFolhas + ' folhas</button>' : '') +
          '</div>',
        aoAbrir: function (corpo) {
          const btnResgatar = corpo.querySelector('#btn-resgatar-wiki');
          if (btnResgatar) {
            btnResgatar.addEventListener('click', function () {
              window.DuoTree.concluirMissao(missao.id, missao.recompensaFolhas, missao.recompensaXp);
              window.DuoTree.fecharModal();
              renderizarMissoes();
              window.DuoTree.mostrarAviso('📚 Missão Diária concluída! +' + missao.recompensaFolhas + ' folhas!');
            });
          }
        }
      });
      return;
    }

    window.DuoTree.abrirModal({
      titulo: missao.titulo,
      subtitulo: 'Missão Diária',
      html:
        '<p>' + window.DuoTree.escaparHtml(missao.descricao) + '</p>' +
        '<p>Você pode regar sua árvore agora para concluir esta missão e receber <strong>+' + missao.recompensaFolhas + ' folhas</strong>.</p>' +
        '<div class="duotree-modal-actions">' +
          '<a href="../index.html" class="duotree-btn duotree-btn-sec">Ir para Home</a>' +
          '<button type="button" class="duotree-btn" id="btn-regar-missao">💧 Regar agora</button>' +
        '</div>',
      aoAbrir: function (corpo) {
        corpo.querySelector('#btn-regar-missao').addEventListener('click', function () {
          window.DuoTree.regarArvoreAtiva();
          window.DuoTree.fecharModal();
          renderizarMissoes();
          window.DuoTree.mostrarAviso('💧 Missão Diária concluída! +' + missao.recompensaFolhas + ' folhas!');
        });
      }
    });
  }

  function abrirMissaoDesafio(missao) {
    const progresso = obterProgresso(missao);
    const pronto = progresso.atual >= missao.meta;
    const destinoHref = missao.regraDesafio === 'arvores' ? 'loja.html' : 'perfil.html';
    const destinoTexto = missao.regraDesafio === 'arvores' ? 'Explorar Loja' : 'Ir para Perfil';

    window.DuoTree.abrirModal({
      titulo: missao.titulo,
      subtitulo: 'Desafio · Progresso ' + progresso.atual + ' / ' + missao.meta,
      html:
        '<p>' + window.DuoTree.escaparHtml(missao.descricao) + '</p>' +
        '<p>' +
          (pronto
            ? 'Desafio atingido! Resgate sua recompensa de <strong>+' + missao.recompensaFolhas + ' folhas</strong> e <strong>+' + missao.recompensaXp + ' XP</strong>.'
            : 'Continue avançando no DuoTree para completar este desafio e desbloquear a recompensa.') +
        '</p>' +
        '<div class="duotree-modal-actions">' +
          '<a href="' + destinoHref + '" class="duotree-btn duotree-btn-sec">' + destinoTexto + '</a>' +
          (pronto ? '<button type="button" class="duotree-btn" id="btn-resgatar-desafio">Resgatar recompensa</button>' : '') +
        '</div>',
      aoAbrir: function (corpo) {
        const btnResgatar = corpo.querySelector('#btn-resgatar-desafio');
        if (btnResgatar) {
          btnResgatar.addEventListener('click', function () {
            window.DuoTree.concluirMissao(missao.id, missao.recompensaFolhas, missao.recompensaXp);
            window.DuoTree.fecharModal();
            renderizarMissoes();
            window.DuoTree.mostrarAviso('🏆 Desafio concluído! +' + missao.recompensaFolhas + ' folhas!');
          });
        }
      }
    });
  }

  function abrirMissao(missao, concluida) {
    if (concluida) {
      window.DuoTree.abrirModal({
        titulo: missao.titulo,
        subtitulo: missao.tipo + ' · Concluída',
        html:
          '<p>' + window.DuoTree.escaparHtml(missao.descricao) + '</p>' +
          '<p><strong>Recompensa recebida:</strong> +' + missao.recompensaFolhas + ' folhas e +' + missao.recompensaXp + ' XP.</p>' +
          '<div class="duotree-modal-actions">' +
            '<button type="button" class="duotree-btn" id="btn-ok-concluida">Fechar</button>' +
          '</div>',
        aoAbrir: function (corpo) {
          corpo.querySelector('#btn-ok-concluida').addEventListener('click', window.DuoTree.fecharModal);
        }
      });
      return;
    }

    if (missao.tipo === 'Quiz') {
      abrirMissaoQuiz(missao);
    } else if (missao.tipo === 'Leitura') {
      abrirMissaoLeitura(missao);
    } else if (missao.tipo === 'Prática') {
      abrirMissaoPratica(missao);
    } else if (missao.tipo === 'Diária') {
      abrirMissaoDiaria(missao);
    } else if (missao.tipo === 'Desafio') {
      abrirMissaoDesafio(missao);
    }
  }

  function criarCardMissao(missao, concluida) {
    const progresso = obterProgresso(missao);
    const li = document.createElement('li');
    li.innerHTML =
      '<div class="imgquest"><img src="' + window.DuoTree.escaparHtml(window.DuoTree.resolverImagem(missao.imagem)) + '" alt="' + window.DuoTree.escaparHtml(missao.titulo) + '"></div>' +
      '<div class="textoquest">' +
        '<h5>' + window.DuoTree.escaparHtml(missao.tipo) + '</h5>' +
        '<h6>' + window.DuoTree.escaparHtml(missao.titulo) + '</h6>' +
        '<p>' + window.DuoTree.escaparHtml(missao.descricao) + '</p>' +
        '<div class="' + (concluida ? 'feito' : 'recompensa') + '">' +
          '<div class="premio">' +
            '<h4>+' + missao.recompensaFolhas + '</h4>' +
            '<img src="../assets/images/loja/folha.png" alt="Folhas">' +
          '</div>' +
          (concluida
            ? '<h4>✅</h4>'
            : '<div><span class="progresso">' + progresso.atual + ' / ' + progresso.meta + '</span></div>') +
        '</div>' +
      '</div>';

    li.addEventListener('click', function () {
      abrirMissao(missao, concluida);
    });
    return li;
  }

  function renderizarMissoes() {
    if (!listaDisponiveis || !listaConcluidas) {
      return;
    }

    const filtradas = dados.missoes.filter(function (m) {
      return filtroTipo === 'todas' || m.tipo.toLowerCase() === filtroTipo;
    });

    const disponiveis = filtradas.filter(function (m) {
      return !usuario.missoesConcluidas.includes(m.id);
    });

    const concluidas = filtradas.filter(function (m) {
      return usuario.missoesConcluidas.includes(m.id);
    });

    listaDisponiveis.innerHTML = '';
    if (pagDisponiveisEl) {
      pagDisponiveisEl.innerHTML = '';
    }
    if (!disponiveis.length) {
      listaDisponiveis.innerHTML = '<div class="duotree-empty">Lista vazia — todas as missões desta categoria foram concluídas!</div>';
    } else {
      const totalPagDisp = Math.max(1, Math.ceil(disponiveis.length / MISSOES_POR_PAGINA));
      if (paginaDisponiveis > totalPagDisp) {
        paginaDisponiveis = totalPagDisp;
      }
      const inicioDisp = (paginaDisponiveis - 1) * MISSOES_POR_PAGINA;
      const loteDisp = disponiveis.slice(inicioDisp, inicioDisp + MISSOES_POR_PAGINA);
      loteDisp.forEach(function (m) {
        listaDisponiveis.appendChild(criarCardMissao(m, false));
      });
      if (pagDisponiveisEl) {
        pagDisponiveisEl.appendChild(
          window.DuoTree.criarPaginacao({
            totalItens: disponiveis.length,
            itensPorPagina: MISSOES_POR_PAGINA,
            paginaAtual: paginaDisponiveis,
            rotulo: 'missões',
            aoMudarPagina: function (novaPagina) {
              paginaDisponiveis = novaPagina;
              renderizarMissoes();
              listaDisponiveis.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          })
        );
      }
    }

    listaConcluidas.innerHTML = '';
    if (pagConcluidasEl) {
      pagConcluidasEl.innerHTML = '';
    }
    if (!concluidas.length) {
      listaConcluidas.innerHTML = '<div class="duotree-empty">Lista vazia — nenhuma missão concluída nesta categoria ainda.</div>';
    } else {
      const totalPagConc = Math.max(1, Math.ceil(concluidas.length / MISSOES_POR_PAGINA));
      if (paginaConcluidas > totalPagConc) {
        paginaConcluidas = totalPagConc;
      }
      const inicioConc = (paginaConcluidas - 1) * MISSOES_POR_PAGINA;
      const loteConc = concluidas.slice(inicioConc, inicioConc + MISSOES_POR_PAGINA);
      loteConc.forEach(function (m) {
        listaConcluidas.appendChild(criarCardMissao(m, true));
      });
      if (pagConcluidasEl) {
        pagConcluidasEl.appendChild(
          window.DuoTree.criarPaginacao({
            totalItens: concluidas.length,
            itensPorPagina: MISSOES_POR_PAGINA,
            paginaAtual: paginaConcluidas,
            rotulo: 'missões',
            aoMudarPagina: function (novaPagina) {
              paginaConcluidas = novaPagina;
              renderizarMissoes();
              listaConcluidas.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          })
        );
      }
    }
  }

  renderizarMissoes();
});
