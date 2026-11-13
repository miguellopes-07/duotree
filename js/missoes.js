document.addEventListener('DOMContentLoaded', async () => {
  const state = await window.DuoTree.init();
  const data = await window.DuoTree.fetchData('missoes.json');

  const navLinks = Array.from(document.querySelectorAll('.navquest a'));
  const listas = document.querySelectorAll('main .listaquest');
  const listaDisponiveis = listas[0];
  const listaConcluidas = listas[1];

  let filtroTipo = 'todas';

  navLinks.forEach((link, idx) => {
    if (idx === 0) link.classList.add('ativo');
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navLinks.forEach((a) => a.classList.remove('ativo'));
      link.classList.add('ativo');
      filtroTipo = link.textContent.trim().toLowerCase();
      renderMissions();
    });
  });

  function getProgress(mission) {
    if (state.missoesConcluidas.includes(mission.id)) {
      return { atual: mission.meta, meta: mission.meta };
    }
    const saved = state.progressoMissoes[mission.id];
    if (saved) {
      return { atual: saved.atual || 0, meta: mission.meta, registros: saved.registros || [] };
    }
    return { atual: 0, meta: mission.meta, registros: [] };
  }

  function openQuizMission(mission) {
    const perguntas = (data.quizzes[mission.quizId] || []).slice(0, mission.meta);
    let idx = 0;
    let acertos = 0;

    function renderQuestion() {
      const q = perguntas[idx];
      if (!q) return;

      window.DuoTree.openModal({
        title: mission.titulo,
        subtitle: `Pergunta ${idx + 1} de ${perguntas.length}`,
        html: `
          <p style="font-weight:800;font-size:1.05rem;">${window.DuoTree.escapeHtml(q.pergunta)}</p>
          <div class="duotree-quiz-opcoes">
            ${q.alternativas
              .map(
                (alt, i) =>
                  `<button type="button" class="duotree-quiz-opcao" data-opt="${i}">${window.DuoTree.escapeHtml(alt)}</button>`
              )
              .join('')}
          </div>
          <div id="quiz-feedback" style="font-size:0.92rem;font-weight:700;min-height:24px;"></div>
          <div class="duotree-modal-actions">
            <button type="button" class="duotree-btn" id="btn-quiz-next" style="display:none;">
              ${idx + 1 < perguntas.length ? 'Próxima pergunta' : 'Concluir Quiz'}
            </button>
          </div>
        `,
        onMount: (body) => {
          const botoes = body.querySelectorAll('.duotree-quiz-opcao');
          const feedback = body.querySelector('#quiz-feedback');
          const nextBtn = body.querySelector('#btn-quiz-next');

          botoes.forEach((btn) => {
            btn.addEventListener('click', () => {
              const escolha = Number(btn.getAttribute('data-opt'));
              botoes.forEach((b) => {
                b.disabled = true;
              });

              if (escolha === q.correta) {
                btn.classList.add('correta');
                acertos += 1;
                feedback.style.color = '#2c731f';
                feedback.textContent = '✅ Correto! ' + q.explicacao;
              } else {
                btn.classList.add('errada');
                botoes[q.correta].classList.add('correta');
                feedback.style.color = '#8b2620';
                feedback.textContent = '💡 ' + q.explicacao;
              }

              state.progressoMissoes[mission.id] = {
                atual: idx + 1,
                meta: perguntas.length
              };
              window.DuoTree.saveState();
              renderMissions();

              nextBtn.style.display = 'inline-block';
            });
          });

          nextBtn.addEventListener('click', () => {
            if (idx + 1 < perguntas.length) {
              idx += 1;
              renderQuestion();
            } else {
              window.DuoTree.completeMission(
                mission.id,
                mission.recompensaFolhas,
                mission.recompensaXp
              );
              window.DuoTree.closeModal();
              renderMissions();
              window.DuoTree.showToast(
                `🎉 Quiz concluído (${acertos}/${perguntas.length} acertos)! +${mission.recompensaFolhas} folhas!`
              );
            }
          });
        }
      });
    }

    renderQuestion();
  }

  function openReadingMission(mission) {
    const artigo = data.leituras[mission.leituraId];
    if (!artigo) return;

    window.DuoTree.openModal({
      title: artigo.titulo,
      subtitle: artigo.subtitulo,
      html: `
        ${artigo.paragrafos.map((p) => `<p>${window.DuoTree.escapeHtml(p)}</p>`).join('')}
        <hr style="margin:16px 0;height:2px;">
        <p style="font-weight:800;">${window.DuoTree.escapeHtml(artigo.pergunta)}</p>
        <div class="duotree-quiz-opcoes">
          ${artigo.alternativas
            .map(
              (alt, i) =>
                `<button type="button" class="duotree-quiz-opcao" data-read-opt="${i}">${window.DuoTree.escapeHtml(alt)}</button>`
            )
            .join('')}
        </div>
        <div id="read-feedback" style="font-weight:700;"></div>
      `,
      onMount: (body) => {
        const botoes = body.querySelectorAll('.duotree-quiz-opcao');
        const feedback = body.querySelector('#read-feedback');

        botoes.forEach((btn) => {
          btn.addEventListener('click', () => {
            const escolha = Number(btn.getAttribute('data-read-opt'));
            if (escolha === artigo.correta) {
              btn.classList.add('correta');
              botoes.forEach((b) => (b.disabled = true));
              state.progressoMissoes[mission.id] = { atual: 1, meta: 1 };
              window.DuoTree.completeMission(
                mission.id,
                mission.recompensaFolhas,
                mission.recompensaXp
              );
              renderMissions();
              feedback.style.color = '#2c731f';
              feedback.textContent = `✅ Missão concluída! +${mission.recompensaFolhas} folhas e +${mission.recompensaXp} XP.`;
              window.DuoTree.showToast(`📖 Leitura concluída! +${mission.recompensaFolhas} folhas!`);
            } else {
              btn.classList.add('errada');
              feedback.style.color = '#8b2620';
              feedback.textContent = 'Leia novamente o trecho final do artigo e tente outra opção.';
            }
          });
        });
      }
    });
  }

  function openPracticeMission(mission) {
    const progress = getProgress(mission);
    const registros = progress.registros || [];

    window.DuoTree.openModal({
      title: mission.titulo,
      subtitle: `Progresso atual: ${progress.atual} / ${mission.meta}`,
      html: `
        <p>Registre cada plantio realizado para acompanhar sua meta ecológica:</p>
        <form id="form-plantio">
          <div class="duotree-form-group">
            <label for="especie-plantio">Espécie plantada</label>
            <input id="especie-plantio" type="text" placeholder="Ex.: Ipê Amarelo, Jabuticabeira..." required>
          </div>
          <div class="duotree-form-group">
            <label for="local-plantio">Local do plantio</label>
            <input id="local-plantio" type="text" placeholder="Ex.: Quintal, praça do bairro, escola..." required>
          </div>
          <button type="submit" class="duotree-btn">Registrar plantio (+1)</button>
        </form>
        <div style="margin-top:14px;">
          ${
            registros.length
              ? registros
                  .map(
                    (r, i) =>
                      `<div class="duotree-list-item"><span>🌱 #${i + 1} <strong>${window.DuoTree.escapeHtml(r.especie)}</strong> — ${window.DuoTree.escapeHtml(r.local)}</span><small>${window.DuoTree.escapeHtml(r.data)}</small></div>`
                  )
                  .join('')
              : '<p style="font-size:0.9rem;color:#666;">Nenhum plantio registrado ainda.</p>'
          }
        </div>
      `,
      onMount: (body) => {
        body.querySelector('#form-plantio').addEventListener('submit', (event) => {
          event.preventDefault();
          const especie = body.querySelector('#especie-plantio').value.trim();
          const local = body.querySelector('#local-plantio').value.trim();
          if (!especie || !local) return;

          const atual = Math.min((progress.atual || 0) + 1, mission.meta);
          registros.push({
            especie,
            local,
            data: new Date().toLocaleDateString('pt-BR')
          });

          state.progressoMissoes[mission.id] = {
            atual,
            meta: mission.meta,
            registros
          };
          state.arvoresPlantadas += 1;
          window.DuoTree.saveState();

          if (atual >= mission.meta) {
            window.DuoTree.completeMission(
              mission.id,
              mission.recompensaFolhas,
              mission.recompensaXp
            );
            window.DuoTree.closeModal();
            renderMissions();
            window.DuoTree.showToast(`🌳 Meta de plantio concluída! +${mission.recompensaFolhas} folhas!`);
          } else {
            window.DuoTree.showToast(`🌱 Plantio registrado (${atual}/${mission.meta})!`);
            renderMissions();
            openPracticeMission(mission);
          }
        });
      }
    });
  }

  function openDailyMission(mission) {
    window.DuoTree.openModal({
      title: mission.titulo,
      subtitle: 'Missão Diária',
      html: `
        <p>${window.DuoTree.escapeHtml(mission.descricao)}</p>
        <p>Você pode regar sua árvore agora mesmo para completar esta missão e receber <strong>+${mission.recompensaFolhas} folhas</strong>.</p>
        <div class="duotree-modal-actions">
          <a href="../index.html" class="duotree-btn duotree-btn-sec" style="text-decoration:none;">Ir para Home</a>
          <button type="button" class="duotree-btn" id="btn-regar-missao">💧 Regar agora</button>
        </div>
      `,
      onMount: (body) => {
        body.querySelector('#btn-regar-missao').addEventListener('click', () => {
          window.DuoTree.waterActiveTree();
          window.DuoTree.closeModal();
          renderMissions();
          window.DuoTree.showToast(`💧 Missão Diária concluída! +${mission.recompensaFolhas} folhas!`);
        });
      }
    });
  }

  function handleMissionClick(mission, done) {
    if (done) {
      window.DuoTree.showToast(`✅ "${mission.titulo}" já foi concluída!`, 'info');
      return;
    }
    if (mission.tipo === 'Quiz') return openQuizMission(mission);
    if (mission.tipo === 'Leitura') return openReadingMission(mission);
    if (mission.tipo === 'Prática') return openPracticeMission(mission);
    if (mission.tipo === 'Diária') return openDailyMission(mission);
  }

  function buildMissionLi(mission, done) {
    const progress = getProgress(mission);
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="imgquest"><img src="${window.DuoTree.escapeHtml(window.DuoTree.resolveAssetPath(mission.imagem))}" alt="${window.DuoTree.escapeHtml(mission.titulo)}"></div>
      <div class="textoquest">
        <h5>${window.DuoTree.escapeHtml(mission.tipo)}</h5>
        <h6>${window.DuoTree.escapeHtml(mission.titulo)}</h6>
        <p>${window.DuoTree.escapeHtml(mission.descricao)}</p>
        <div class="${done ? 'feito' : 'recompensa'}">
          <div class="premio">
            <h4>+${mission.recompensaFolhas}</h4>
            <img src="../assets/images/loja/folha.png" alt="Folhas">
          </div>
          ${
            done
              ? '<h4>✅</h4>'
              : `<div><span class="progresso">${progress.atual} / ${progress.meta}</span></div>`
          }
        </div>
      </div>
    `;
    li.addEventListener('click', () => handleMissionClick(mission, done));
    return li;
  }

  function renderMissions() {
    if (!listaDisponiveis || !listaConcluidas) return;

    const filtradas = data.missoes.filter(
      (m) => filtroTipo === 'todas' || m.tipo.toLowerCase() === filtroTipo
    );

    const disponiveis = filtradas.filter((m) => !state.missoesConcluidas.includes(m.id));
    const concluidas = filtradas.filter((m) => state.missoesConcluidas.includes(m.id));

    listaDisponiveis.innerHTML = '';
    if (!disponiveis.length) {
      listaDisponiveis.innerHTML =
        '<div class="duotree-empty">Todas as missões desta categoria foram concluídas! 🎉</div>';
    } else {
      disponiveis.forEach((m) => listaDisponiveis.appendChild(buildMissionLi(m, false)));
    }

    listaConcluidas.innerHTML = '';
    if (!concluidas.length) {
      listaConcluidas.innerHTML =
        '<div class="duotree-empty">Nenhuma missão concluída nesta categoria ainda.</div>';
    } else {
      concluidas.forEach((m) => listaConcluidas.appendChild(buildMissionLi(m, true)));
    }
  }

  renderMissions();
});
