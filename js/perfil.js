document.addEventListener('DOMContentLoaded', async function () {
  const usuario = await window.DuoTree.iniciar({ exigirLogin: true });
  if (!usuario) {
    return;
  }

  const catalogo = await window.DuoTree.carregarDados('perfil.json');

  const nivelHeading = document.querySelector('.nivel-xp h1');
  const xpBar = document.querySelector('.xp-preenchido');
  const nomeUsuarioEl = document.querySelector('.card-perfil h2');
  const subtituloPerfilEl = document.querySelector('.perfil-subtitulo');
  const avatarImg = document.querySelector('.card-perfil .dino');
  const statsItems = document.querySelectorAll('.estatisticas li h3');
  const bioInput = document.querySelector('.bio-input');
  const contadorEl = document.querySelector('.contador');
  const btnEditar = document.querySelector('.botao-editar');
  const btnAmigo = document.querySelector('.botao-amigo');
  const btnSair = document.querySelector('#btn-sair-conta');
  const linkVerTodas = document.querySelector('.titulo-conquistas a');
  const gradeConquistas = document.querySelector('.grade-conquistas');
  const listaPlantiosEl = document.querySelector('#lista-plantios-perfil');
  const btnNovoPlantio = document.querySelector('#btn-novo-plantio');

  function renderizarPerfil() {
    if (nivelHeading) {
      nivelHeading.textContent = 'Nível ' + usuario.nivel;
    }
    if (xpBar) {
      const pct = Math.min(100, Math.round((usuario.xp / usuario.xpProximoNivel) * 100));
      xpBar.style.width = Math.max(pct, 22) + '%';
      xpBar.textContent = 'XP ' + usuario.xp + '/' + usuario.xpProximoNivel;
    }
    if (nomeUsuarioEl) {
      nomeUsuarioEl.textContent = usuario.nome;
    }
    if (subtituloPerfilEl) {
      const regiaoTexto = usuario.regiao ? ' · Região ' + usuario.regiao : '';
      subtituloPerfilEl.textContent = (usuario.titulo || 'Guardião das Sementes') + regiaoTexto;
    }
    if (avatarImg && usuario.avatar) {
      avatarImg.src = window.DuoTree.resolverImagem(usuario.avatar);
    }

    if (statsItems.length >= 4) {
      statsItems[0].innerHTML = '<i class="fa-solid fa-leaf"></i> ' + usuario.folhas;
      statsItems[1].textContent = String(usuario.missoesConcluidas.length);
      statsItems[2].textContent = String(usuario.conquistasDesbloqueadas.length);
      statsItems[3].textContent = String(usuario.arvoresPlantadas);
    }

    if (bioInput && contadorEl) {
      bioInput.value = usuario.bio || '';
      contadorEl.textContent = bioInput.value.length + '/120';
    }

    renderizarConquistas();
    renderizarPlantios();
  }

  function renderizarConquistas() {
    if (!gradeConquistas || !Array.isArray(catalogo.conquistas)) {
      return;
    }
    const principais = catalogo.conquistas.slice(0, 4);
    gradeConquistas.innerHTML = '';
    principais.forEach(function (c) {
      const desbloqueada = usuario.conquistasDesbloqueadas.includes(c.id);
      const li = document.createElement('li');
      li.className = 'item-conquista' + (desbloqueada ? '' : ' bloqueada');
      li.innerHTML =
        '<img src="' + window.DuoTree.escaparHtml(window.DuoTree.resolverImagem(c.imagem)) + '" alt="' + window.DuoTree.escaparHtml(c.nome) + '">' +
        '<span>' + window.DuoTree.escaparHtml(c.nome) + '</span>';
      gradeConquistas.appendChild(li);
    });
  }

  function renderizarPlantios() {
    if (!listaPlantiosEl) {
      return;
    }
    const lista = usuario.plantiosPessoais || [];
    if (!lista.length) {
      listaPlantiosEl.innerHTML = '<li class="duotree-empty" style="margin:0;">Lista vazia</li>';
      return;
    }

    listaPlantiosEl.innerHTML = '';
    lista.forEach(function (item) {
      const li = document.createElement('li');
      li.className = 'item-plantio-perfil';
      li.innerHTML =
        '<div>' +
          '<strong>🌱 ' + window.DuoTree.escaparHtml(item.especie) + '</strong>' +
          '<div style="font-size:0.86rem;">' + window.DuoTree.escaparHtml(item.local) + ' · ' + window.DuoTree.escaparHtml(item.data) + '</div>' +
        '</div>' +
        '<button type="button" class="btn-remover-item">Remover</button>';

      li.querySelector('.btn-remover-item').addEventListener('click', function () {
        usuario.plantiosPessoais = usuario.plantiosPessoais.filter(function (p) {
          return p.id !== item.id;
        });
        window.DuoTree.salvarEstado();
        renderizarPerfil();
        window.DuoTree.mostrarAviso('Registro removido da lista.', 'info');
      });

      listaPlantiosEl.appendChild(li);
    });
  }

  function abrirModalNovoPlantio() {
    window.DuoTree.abrirModal({
      titulo: 'Registrar novo plantio',
      subtitulo: 'Adicione uma árvore plantada ao seu diário',
      html:
        '<form id="form-novo-plantio-perfil">' +
          '<div class="duotree-form-group">' +
            '<label for="plantio-especie">Nome da espécie</label>' +
            '<input id="plantio-especie" type="text" placeholder="Ex.: Ipê Amarelo, Oiti, Pau-brasil" required>' +
          '</div>' +
          '<div class="duotree-form-group">' +
            '<label for="plantio-local">Local do plantio</label>' +
            '<input id="plantio-local" type="text" placeholder="Ex.: Parque da cidade, escola, quintal" required>' +
          '</div>' +
          '<div class="duotree-modal-actions">' +
            '<button type="button" class="duotree-btn duotree-btn-sec" id="btn-cancelar-plantio">Cancelar</button>' +
            '<button type="submit" class="duotree-btn">Salvar na lista</button>' +
          '</div>' +
        '</form>',
      aoAbrir: function (corpo) {
        corpo.querySelector('#btn-cancelar-plantio').addEventListener('click', window.DuoTree.fecharModal);
        corpo.querySelector('#form-novo-plantio-perfil').addEventListener('submit', function (evento) {
          evento.preventDefault();
          const especie = corpo.querySelector('#plantio-especie').value.trim();
          const local = corpo.querySelector('#plantio-local').value.trim();
          if (!especie || !local) {
            return;
          }

          usuario.plantiosPessoais.unshift({
            id: 'plantio-' + Date.now(),
            especie: especie,
            local: local,
            data: new Date().toLocaleDateString('pt-BR')
          });
          usuario.arvoresPlantadas += 1;
          window.DuoTree.adicionarXp(25);
          window.DuoTree.salvarEstado();
          window.DuoTree.fecharModal();
          renderizarPerfil();
          window.DuoTree.mostrarAviso('🌱 Plantio adicionado ao seu diário (+25 XP)!');
        });
      }
    });
  }

  if (bioInput && contadorEl) {
    bioInput.addEventListener('input', function () {
      usuario.bio = bioInput.value.slice(0, 120);
      contadorEl.textContent = usuario.bio.length + '/120';
      window.DuoTree.salvarEstado();
    });
  }

  function abrirModalEditar() {
    const regioes = ['', 'Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
    let avatarSelecionado = usuario.avatar;

    window.DuoTree.abrirModal({
      titulo: 'Editar Perfil',
      subtitulo: 'Personalize seu nome, personagem e região',
      html:
        '<form id="form-editar-perfil">' +
          '<div class="duotree-form-group">' +
            '<label for="edit-nome">Nome do personagem</label>' +
            '<input id="edit-nome" type="text" maxlength="24" value="' + window.DuoTree.escaparHtml(usuario.nome) + '" required>' +
          '</div>' +
          '<div class="duotree-form-group">' +
            '<label for="edit-titulo">Título</label>' +
            '<select id="edit-titulo">' +
              catalogo.titulos
                .map(function (t) {
                  return '<option value="' + window.DuoTree.escaparHtml(t) + '" ' + (usuario.titulo === t ? 'selected' : '') + '>' + window.DuoTree.escaparHtml(t) + '</option>';
                })
                .join('') +
            '</select>' +
          '</div>' +
          '<div class="duotree-form-group">' +
            '<label>Escolha seu personagem</label>' +
            '<div class="duotree-grid-avatares" id="grid-avatares-perfil">' +
              catalogo.avatares
                .map(function (av) {
                  const ativo = usuario.avatar === av.imagem ? ' selecionado' : '';
                  return (
                    '<button type="button" class="duotree-opcao-avatar' + ativo + '" data-avatar="' + window.DuoTree.escaparHtml(av.imagem) + '">' +
                      '<img src="' + window.DuoTree.escaparHtml(window.DuoTree.resolverImagem(av.imagem)) + '" alt="' + window.DuoTree.escaparHtml(av.nome) + '">' +
                      '<span>' + window.DuoTree.escaparHtml(av.nome) + '</span>' +
                    '</button>'
                  );
                })
                .join('') +
            '</div>' +
          '</div>' +
          '<div class="duotree-form-group">' +
            '<label for="edit-regiao">Sua região no Brasil</label>' +
            '<select id="edit-regiao">' +
              regioes
                .map(function (r) {
                  return '<option value="' + r + '" ' + (usuario.regiao === r ? 'selected' : '') + '>' + (r || 'Todas as regiões') + '</option>';
                })
                .join('') +
            '</select>' +
          '</div>' +
          '<div class="duotree-modal-actions">' +
            '<button type="button" class="duotree-btn duotree-btn-sec" id="btn-fechar-edit">Cancelar</button>' +
            '<button type="submit" class="duotree-btn">Salvar alterações</button>' +
          '</div>' +
        '</form>',
      aoAbrir: function (corpo) {
        const botoesAvatar = corpo.querySelectorAll('.duotree-opcao-avatar');
        botoesAvatar.forEach(function (btn) {
          btn.addEventListener('click', function () {
            avatarSelecionado = btn.getAttribute('data-avatar');
            botoesAvatar.forEach(function (b) {
              b.classList.remove('selecionado');
            });
            btn.classList.add('selecionado');
          });
        });

        corpo.querySelector('#btn-fechar-edit').addEventListener('click', window.DuoTree.fecharModal);
        corpo.querySelector('#form-editar-perfil').addEventListener('submit', function (evento) {
          evento.preventDefault();
          usuario.nome = corpo.querySelector('#edit-nome').value.trim() || usuario.nome;
          usuario.titulo = corpo.querySelector('#edit-titulo').value;
          usuario.avatar = avatarSelecionado || usuario.avatar;
          usuario.regiao = corpo.querySelector('#edit-regiao').value;
          window.DuoTree.salvarEstado();
          renderizarPerfil();
          window.DuoTree.fecharModal();
          window.DuoTree.mostrarAviso('Perfil atualizado com sucesso!');
        });
      }
    });
  }

  function abrirModalAmigos() {
    const htmlAmigos = usuario.amigos.length
      ? usuario.amigos
          .map(function (a, indice) {
            return (
              '<div class="duotree-list-item">' +
                '<div>' +
                  '<strong>🌿 ' + window.DuoTree.escaparHtml(a.nome) + '</strong>' +
                  '<div class="duotree-meta-linha" style="margin:4px 0 0;">Nível ' + a.nivel + ' · ' + a.folhas + ' folhas</div>' +
                '</div>' +
                '<button type="button" class="btn-remover-item" data-remover-amigo="' + indice + '">Remover</button>' +
              '</div>'
            );
          })
          .join('')
      : '<div class="duotree-empty">Lista vazia</div>';

    window.DuoTree.abrirModal({
      titulo: 'Amigos no DuoTree',
      subtitulo: usuario.amigos.length + ' conexões verdes',
      html:
        '<form id="form-add-amigo" style="margin-bottom:14px;">' +
          '<div class="duotree-form-group">' +
            '<label for="novo-amigo">Adicionar amigo pelo nome</label>' +
            '<input id="novo-amigo" type="text" placeholder="Ex.: Guardiao_MataAtlantica" required>' +
          '</div>' +
          '<button type="submit" class="duotree-btn">Adicionar amigo</button>' +
        '</form>' +
        '<div>' + htmlAmigos + '</div>',
      aoAbrir: function (corpo) {
        corpo.querySelector('#form-add-amigo').addEventListener('submit', function (evento) {
          evento.preventDefault();
          const nome = corpo.querySelector('#novo-amigo').value.trim();
          if (!nome) {
            return;
          }
          const duplicado = usuario.amigos.some(function (a) {
            return a.nome.toLowerCase() === nome.toLowerCase();
          });
          if (duplicado) {
            window.DuoTree.mostrarAviso('Esse amigo já está na sua lista.', 'aviso');
            return;
          }
          usuario.amigos.unshift({
            nome: nome,
            nivel: Math.floor(Math.random() * 40) + 15,
            folhas: Math.floor(Math.random() * 800) + 250
          });
          window.DuoTree.salvarEstado();
          window.DuoTree.mostrarAviso(nome + ' adicionado aos seus amigos!');
          abrirModalAmigos();
        });

        corpo.querySelectorAll('[data-remover-amigo]').forEach(function (botao) {
          botao.addEventListener('click', function () {
            const idx = Number(botao.getAttribute('data-remover-amigo'));
            usuario.amigos.splice(idx, 1);
            window.DuoTree.salvarEstado();
            abrirModalAmigos();
          });
        });
      }
    });
  }

  function abrirModalConquistas() {
    const htmlLista = catalogo.conquistas
      .map(function (c) {
        const desbloqueada = usuario.conquistasDesbloqueadas.includes(c.id);
        return (
          '<div class="duotree-list-item ' + (desbloqueada ? '' : 'bloqueado') + '">' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
              (c.imagem
                ? '<img src="' + window.DuoTree.escaparHtml(window.DuoTree.resolverImagem(c.imagem)) + '" alt="' + window.DuoTree.escaparHtml(c.nome) + '" style="width:46px;height:46px;object-fit:contain;flex-shrink:0;">'
                : '') +
              '<div>' +
                '<strong>' + (desbloqueada ? '🏆 ' : '🔒 ') + window.DuoTree.escaparHtml(c.nome) + '</strong>' +
                '<div style="font-size:0.86rem;">' + window.DuoTree.escaparHtml(c.descricao) + '</div>' +
                '<div class="duotree-meta-linha" style="margin:4px 0 0;">Critério: ' + window.DuoTree.escaparHtml(c.criterio) + ' · ' + (desbloqueada ? 'Desbloqueada' : '+' + c.xpBonus + ' XP') + '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      })
      .join('');

    window.DuoTree.abrirModal({
      titulo: 'Todas as Conquistas',
      subtitulo: usuario.conquistasDesbloqueadas.length + ' de ' + catalogo.conquistas.length + ' desbloqueadas',
      html: '<div>' + htmlLista + '</div>'
    });
  }

  if (btnEditar) {
    btnEditar.addEventListener('click', abrirModalEditar);
  }
  if (btnAmigo) {
    btnAmigo.addEventListener('click', abrirModalAmigos);
  }
  if (btnNovoPlantio) {
    btnNovoPlantio.addEventListener('click', abrirModalNovoPlantio);
  }
  if (btnSair) {
    btnSair.addEventListener('click', function () {
      window.DuoTree.fazerLogout();
    });
  }
  if (linkVerTodas) {
    linkVerTodas.addEventListener('click', function (evento) {
      evento.preventDefault();
      abrirModalConquistas();
    });
  }
  if (gradeConquistas) {
    gradeConquistas.addEventListener('click', abrirModalConquistas);
  }

  renderizarPerfil();
});
