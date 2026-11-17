document.addEventListener('DOMContentLoaded', async function () {
  const usuarioLogado = await window.DuoTree.iniciar({ exigirLogin: false });
  if (usuarioLogado) {
    window.location.href = '../index.html';
    return;
  }

  const catalogo = await window.DuoTree.carregarDados('perfil.json');
  const containerPersonagens = document.querySelector('#seletor-personagens');
  const form = document.querySelector('#form-cadastro');
  const inputNome = document.querySelector('#cadastro-nome');
  const inputEmail = document.querySelector('#cadastro-email');
  const inputSenha = document.querySelector('#cadastro-senha');
  const inputConfirmar = document.querySelector('#cadastro-confirmar');
  const selectRegiao = document.querySelector('#cadastro-regiao');
  const caixaErro = document.querySelector('#cadastro-erro');

  let personagemEscolhido = catalogo.avatares[0];

  function renderizarPersonagens() {
    containerPersonagens.innerHTML = '';
    catalogo.avatares.forEach(function (personagem) {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'opcao-personagem' + (personagem.id === personagemEscolhido.id ? ' selecionado' : '');
      botao.innerHTML =
        '<img src="' + window.DuoTree.escaparHtml(window.DuoTree.resolverImagem(personagem.imagem)) + '" alt="' + window.DuoTree.escaparHtml(personagem.nome) + '">' +
        '<span>' + window.DuoTree.escaparHtml(personagem.nome) + '</span>';

      botao.addEventListener('click', function () {
        personagemEscolhido = personagem;
        renderizarPersonagens();
      });

      containerPersonagens.appendChild(botao);
    });
  }

  renderizarPersonagens();

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    caixaErro.classList.remove('visivel');

    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim();
    const senha = inputSenha.value;
    const confirmar = inputConfirmar.value;
    const regiao = selectRegiao.value;

    if (nome.length < 2) {
      caixaErro.textContent = 'Digite um nome de personagem com pelo menos 2 caracteres.';
      caixaErro.classList.add('visivel');
      return;
    }

    if (senha.length < 4) {
      caixaErro.textContent = 'A senha deve ter pelo menos 4 caracteres.';
      caixaErro.classList.add('visivel');
      return;
    }

    if (senha !== confirmar) {
      caixaErro.textContent = 'As senhas não coincidem.';
      caixaErro.classList.add('visivel');
      return;
    }

    const resultado = await window.DuoTree.cadastrarUsuario({
      nome: nome,
      email: email,
      senha: senha,
      regiao: regiao,
      avatar: personagemEscolhido.imagem,
      personagemId: personagemEscolhido.id
    });

    if (!resultado.ok) {
      caixaErro.textContent = resultado.erro;
      caixaErro.classList.add('visivel');
      return;
    }

    window.location.href = '../index.html';
  });
});
