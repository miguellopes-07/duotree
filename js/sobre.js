document.addEventListener('DOMContentLoaded', async function () {
  const usuario = await window.DuoTree.iniciar({ exigirLogin: false });
  const sobreData = await window.DuoTree.carregarDados('sobre.json');

  const bolas = document.querySelectorAll('.caixa-bolas .bola');
  const caixaBolas = document.querySelector('.caixa-bolas');
  const listaEquipe = document.querySelector('.lista-equipe');
  const btnJornada = document.querySelector('.final .btn-jornada');
  const linkEntrar = document.querySelector('#sobre-link-entrar');
  const linkCadastrar = document.querySelector('#sobre-link-cadastrar');

  if (usuario) {
    if (linkEntrar) {
      linkEntrar.textContent = 'Ir para Home';
      linkEntrar.href = '../index.html';
    }
    if (linkCadastrar) {
      linkCadastrar.style.display = 'none';
    }
  }

  if (caixaBolas && bolas.length) {
    const caixaInfo = document.createElement('div');
    caixaInfo.className = 'sobre-card-dinamico';
    caixaInfo.innerHTML = '<strong>Toque em um dos 4 pilares acima</strong> para descobrir como o DuoTree aplica esse valor na prática.';
    caixaBolas.insertAdjacentElement('afterend', caixaInfo);

    bolas.forEach(function (bola) {
      bola.addEventListener('click', function () {
        const titulo = (bola.querySelector('h4') ? bola.querySelector('h4').textContent : '').trim();
        const texto = sobreData.pilares[titulo];
        if (texto) {
          caixaInfo.innerHTML = '<strong>' + window.DuoTree.escaparHtml(titulo) + ':</strong> ' + window.DuoTree.escaparHtml(texto);
        }
      });
    });
  }

  if (listaEquipe && Array.isArray(sobreData.equipe)) {
    listaEquipe.innerHTML = sobreData.equipe
      .map(function (membro) {
        const fotoUrl = window.DuoTree.resolverImagem(membro.foto || '../assets/images/perfil/dino-removebg-preview.png');
        return (
          '<li class="card-equipe">' +
            '<img class="foto-equipe" src="' + window.DuoTree.escaparHtml(fotoUrl) + '" alt="' + window.DuoTree.escaparHtml(membro.nome) + '">' +
            '<h4>' + window.DuoTree.escaparHtml(membro.nome) + '</h4>' +
            '<p>' + window.DuoTree.escaparHtml(membro.papel) + '</p>' +
          '</li>'
        );
      })
      .join('');
  }

  if (btnJornada) {
    btnJornada.addEventListener('click', function () {
      window.location.href = usuario ? '../index.html' : 'login.html';
    });
  }
});
