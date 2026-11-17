document.addEventListener('DOMContentLoaded', async function () {
  const usuarioLogado = await window.DuoTree.iniciar({ exigirLogin: false });
  if (usuarioLogado) {
    window.location.href = '../index.html';
    return;
  }

  const form = document.querySelector('#form-login');
  const inputEmail = document.querySelector('#login-email');
  const inputSenha = document.querySelector('#login-senha');
  const caixaErro = document.querySelector('#login-erro');
  const btnDemo = document.querySelector('#btn-preencher-demo');

  const contasIniciais = await window.DuoTree.carregarDados('usuarios.json');
  const contaDemo = contasIniciais[0];

  if (btnDemo && contaDemo) {
    btnDemo.addEventListener('click', function () {
      inputEmail.value = contaDemo.email;
      inputSenha.value = contaDemo.senha;
      caixaErro.classList.remove('visivel');
    });
  }

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    caixaErro.classList.remove('visivel');

    const resultado = await window.DuoTree.fazerLogin(
      inputEmail.value,
      inputSenha.value
    );

    if (!resultado.ok) {
      caixaErro.textContent = resultado.erro;
      caixaErro.classList.add('visivel');
      return;
    }

    window.location.href = '../index.html';
  });
});
