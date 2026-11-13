document.addEventListener('DOMContentLoaded', async () => {
  await window.DuoTree.init();
  const sobreData = await window.DuoTree.fetchData('sobre.json');

  const bolas = document.querySelectorAll('.caixa-bolas .bola');
  const caixaBolas = document.querySelector('.caixa-bolas');
  const listaEquipe = document.querySelector('.lista-equipe');
  const btnJornada = document.querySelector('.final button');

  if (caixaBolas && bolas.length) {
    const infoBox = document.createElement('div');
    infoBox.className = 'sobre-card-dinamico';
    infoBox.innerHTML = `
      <strong>Toque em um dos 4 pilares acima</strong> para descobrir como o DuoTree aplica esse valor na prática.
    `;
    caixaBolas.insertAdjacentElement('afterend', infoBox);

    bolas.forEach((bola) => {
      bola.addEventListener('click', () => {
        const titulo = (bola.querySelector('h4')?.textContent || '').trim();
        const texto = sobreData.pilares[titulo];
        if (texto) {
          infoBox.innerHTML = `<strong>${window.DuoTree.escapeHtml(titulo)}:</strong> ${window.DuoTree.escapeHtml(texto)}`;
        }
      });
    });
  }

  if (listaEquipe && Array.isArray(sobreData.equipe)) {
    listaEquipe.innerHTML = sobreData.equipe
      .map(
        (membro) =>
          `<li><strong>${window.DuoTree.escapeHtml(membro.nome)}</strong> — <small>${window.DuoTree.escapeHtml(membro.papel)}</small></li>`
      )
      .join('');
  }

  if (btnJornada) {
    btnJornada.addEventListener('click', () => {
      window.location.href = 'missoes.html';
    });
  }
});
