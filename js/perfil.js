document.addEventListener('DOMContentLoaded', async () => {
  let state = await window.DuoTree.init();
  const catalogo = await window.DuoTree.fetchData('perfil.json');

  const nivelHeading = document.querySelector('.nivel-xp h1');
  const xpBar = document.querySelector('.xp-preenchido');
  const userNameEl = document.querySelector('.card-perfil h2');
  const avatarImg = document.querySelector('.card-perfil .dino');
  const statsItems = document.querySelectorAll('.estatisticas li h3');
  const bioInput = document.querySelector('.coluna-direita input');
  const contadorEl = document.querySelector('.contador');
  const btnEditar = document.querySelector('.botao-editar');
  const btnAmigo = document.querySelector('.botao-amigo');
  const linkVerTodas = document.querySelector('.titulo-conquistas a');
  const conquistasImg = document.querySelector('.conquistas');
  const nomesConquistas = document.querySelector('.nomes-conquistas');

  function renderProfile() {
    if (nivelHeading) {
      nivelHeading.textContent = `Nível ${state.nivel}`;
    }
    if (xpBar) {
      const pct = Math.min(100, Math.round((state.xp / state.xpProximoNivel) * 100));
      xpBar.style.width = `${Math.max(pct, 18)}%`;
      xpBar.textContent = `XP ${state.xp}/${state.xpProximoNivel}`;
    }
    if (userNameEl) {
      userNameEl.textContent = state.nome;
    }
    if (avatarImg && state.avatar) {
      avatarImg.src = window.DuoTree.resolveAssetPath(state.avatar);
    }

    if (statsItems.length >= 4) {
      statsItems[0].innerHTML = `<i class="fa-solid fa-leaf"></i> ${state.folhas}`;
      statsItems[1].textContent = String(state.missoesConcluidas.length);
      statsItems[2].textContent = String(state.conquistasDesbloqueadas.length);
      statsItems[3].textContent = String(state.arvoresPlantadas);
    }

    if (bioInput && contadorEl) {
      bioInput.value = state.bio || '';
      contadorEl.textContent = `${bioInput.value.length}/120`;
    }
  }

  if (bioInput && contadorEl) {
    bioInput.addEventListener('input', () => {
      state.bio = bioInput.value.slice(0, 120);
      contadorEl.textContent = `${state.bio.length}/120`;
      window.DuoTree.saveState();
    });
  }

  function openEditModal() {
    const regioes = ['', 'Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
    window.DuoTree.openModal({
      title: 'Editar Perfil',
      subtitle: 'Personalize seu nome, avatar e região',
      html: `
        <form id="form-editar-perfil">
          <div class="duotree-form-group">
            <label for="edit-nome">Nome de usuário</label>
            <input id="edit-nome" type="text" maxlength="24" value="${window.DuoTree.escapeHtml(state.nome)}" required>
          </div>
          <div class="duotree-form-group">
            <label for="edit-titulo">Título</label>
            <select id="edit-titulo">
              ${catalogo.titulos
                .map(
                  (t) =>
                    `<option value="${window.DuoTree.escapeHtml(t)}" ${state.titulo === t ? 'selected' : ''}>${window.DuoTree.escapeHtml(t)}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="duotree-form-group">
            <label for="edit-avatar">Avatar</label>
            <select id="edit-avatar">
              ${catalogo.avatares
                .map(
                  (av) =>
                    `<option value="${window.DuoTree.escapeHtml(av.imagem)}" ${state.avatar === av.imagem ? 'selected' : ''}>${window.DuoTree.escapeHtml(av.nome)}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="duotree-form-group">
            <label for="edit-regiao">Sua região no Brasil</label>
            <select id="edit-regiao">
              ${regioes
                .map(
                  (r) =>
                    `<option value="${r}" ${state.regiao === r ? 'selected' : ''}>${r || 'Todas as regiões'}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="duotree-modal-actions" style="justify-content:space-between;">
            <button type="button" class="duotree-btn duotree-btn-sec" id="btn-resetar-progresso">Restaurar dados iniciais</button>
            <button type="submit" class="duotree-btn">Salvar alterações</button>
          </div>
        </form>
      `,
      onMount: (body) => {
        body.querySelector('#form-editar-perfil').addEventListener('submit', (e) => {
          e.preventDefault();
          state.nome = body.querySelector('#edit-nome').value.trim() || state.nome;
          state.titulo = body.querySelector('#edit-titulo').value;
          state.avatar = body.querySelector('#edit-avatar').value;
          state.regiao = body.querySelector('#edit-regiao').value;
          window.DuoTree.saveState();
          renderProfile();
          window.DuoTree.closeModal();
          window.DuoTree.showToast('Perfil atualizado com sucesso!');
        });

        body.querySelector('#btn-resetar-progresso').addEventListener('click', async () => {
          state = await window.DuoTree.resetState();
          renderProfile();
          window.DuoTree.closeModal();
          window.DuoTree.showToast('Progresso restaurado para os dados iniciais.', 'info');
        });
      }
    });
  }

  function openFriendsModal() {
    const friendsHtml = state.amigos.length
      ? state.amigos
          .map(
            (a) => `
          <div class="duotree-list-item">
            <div>
              <strong>🌿 ${window.DuoTree.escapeHtml(a.nome)}</strong>
              <div style="font-size:0.85rem;color:#4c7b47;">Nível ${a.nivel} • ${a.folhas} folhas</div>
            </div>
            <span class="duotree-badge">Amigo</span>
          </div>
        `
          )
          .join('')
      : '<p>Você ainda não adicionou amigos.</p>';

    window.DuoTree.openModal({
      title: 'Amigos no DuoTree',
      subtitle: `${state.amigos.length} conexões verdes`,
      html: `
        <form id="form-add-amigo" style="margin-bottom:14px;">
          <div class="duotree-form-group">
            <label for="novo-amigo">Adicionar amigo pelo nome de usuário</label>
            <input id="novo-amigo" type="text" placeholder="Ex.: Guardiao_MataAtlantica" required>
          </div>
          <button type="submit" class="duotree-btn">Adicionar amigo</button>
        </form>
        <div>${friendsHtml}</div>
      `,
      onMount: (body) => {
        body.querySelector('#form-add-amigo').addEventListener('submit', (e) => {
          e.preventDefault();
          const nome = body.querySelector('#novo-amigo').value.trim();
          if (!nome) return;
          if (state.amigos.some((a) => a.nome.toLowerCase() === nome.toLowerCase())) {
            window.DuoTree.showToast('Esse amigo já está na sua lista.', 'aviso');
            return;
          }
          state.amigos.unshift({
            nome,
            nivel: Math.floor(Math.random() * 40) + 20,
            folhas: Math.floor(Math.random() * 900) + 300
          });
          window.DuoTree.saveState();
          window.DuoTree.showToast(`${nome} adicionado aos seus amigos!`);
          openFriendsModal();
        });
      }
    });
  }

  function openAchievementsModal() {
    const listHtml = catalogo.conquistas
      .map((c) => {
        const unlocked = state.conquistasDesbloqueadas.includes(c.id);
        return `
          <div class="duotree-list-item ${unlocked ? '' : 'bloqueado'}">
            <div>
              <strong>${unlocked ? '🏆' : '🔒'} ${window.DuoTree.escapeHtml(c.nome)}</strong>
              <div style="font-size:0.86rem;">${window.DuoTree.escapeHtml(c.descricao)}</div>
              <small style="color:#4c7b47;">Como desbloquear: ${window.DuoTree.escapeHtml(c.criterio)}</small>
            </div>
            <span class="duotree-badge">${unlocked ? 'Desbloqueada' : `+${c.xpBonus} XP`}</span>
          </div>
        `;
      })
      .join('');

    window.DuoTree.openModal({
      title: 'Todas as Conquistas',
      subtitle: `${state.conquistasDesbloqueadas.length} de ${catalogo.conquistas.length} desbloqueadas`,
      html: `<div>${listHtml}</div>`
    });
  }

  if (btnEditar) btnEditar.addEventListener('click', openEditModal);
  if (btnAmigo) btnAmigo.addEventListener('click', openFriendsModal);
  if (linkVerTodas) {
    linkVerTodas.addEventListener('click', (e) => {
      e.preventDefault();
      openAchievementsModal();
    });
  }
  if (conquistasImg) {
    conquistasImg.style.cursor = 'pointer';
    conquistasImg.addEventListener('click', openAchievementsModal);
  }
  if (nomesConquistas) {
    nomesConquistas.style.cursor = 'pointer';
    nomesConquistas.addEventListener('click', openAchievementsModal);
  }

  renderProfile();
});
