const CHAVE_USUARIOS = 'duotree_usuarios_v1';
const CHAVE_SESSAO = 'duotree_sessao_v1';
const CHAVE_TEMA = 'duotree_tema_v1';

const dentroDePages = window.location.pathname.includes('/pages/');
const PREFIXO_BASE = dentroDePages ? '../' : './';

let listaUsuarios = [];
let usuarioAtual = null;
const cacheJson = {};

function resolverCaminho(caminhoRelativo) {
  return PREFIXO_BASE + caminhoRelativo.replace(/^\//, '');
}

function resolverImagem(caminhoImagem) {
  if (!caminhoImagem) {
    return '';
  }
  if (caminhoImagem.startsWith('http://') || caminhoImagem.startsWith('https://')) {
    return caminhoImagem;
  }
  const limpo = caminhoImagem.replace(/^\.\.\//, '').replace(/^\.\//, '');
  return PREFIXO_BASE + limpo;
}

function escaparHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clonarObjeto(dado) {
  return JSON.parse(JSON.stringify(dado));
}

async function carregarDados(nomeArquivo) {
  if (cacheJson[nomeArquivo]) {
    return clonarObjeto(cacheJson[nomeArquivo]);
  }
  const resposta = await fetch(resolverCaminho('data/' + nomeArquivo));
  if (!resposta.ok) {
    throw new Error('Erro ao carregar data/' + nomeArquivo);
  }
  const dados = await resposta.json();
  cacheJson[nomeArquivo] = dados;
  return clonarObjeto(dados);
}

function aplicarTema(tema) {
  const escuro = tema === 'escuro';
  document.documentElement.classList.toggle('tema-escuro', escuro);
  if (document.body) {
    document.body.classList.toggle('tema-escuro', escuro);
  }
  localStorage.setItem(CHAVE_TEMA, escuro ? 'escuro' : 'claro');
  atualizarBotoesTema(escuro);
}

function obterTemaAtual() {
  return localStorage.getItem(CHAVE_TEMA) === 'escuro' ? 'escuro' : 'claro';
}

function alternarTema() {
  const proximo = obterTemaAtual() === 'escuro' ? 'claro' : 'escuro';
  aplicarTema(proximo);
}

function atualizarBotoesTema(escuro) {
  const botoes = document.querySelectorAll('[data-toggle-tema]');
  botoes.forEach(function (botao) {
    botao.textContent = escuro ? '☀️ Claro' : '🌙 Escuro';
    botao.setAttribute(
      'aria-label',
      escuro ? 'Ativar modo claro' : 'Ativar modo escuro'
    );
  });
}

function configurarBotoesTema() {
  aplicarTema(obterTemaAtual());
  const botoes = document.querySelectorAll('[data-toggle-tema]');
  botoes.forEach(function (botao) {
    if (botao.dataset.temaConfigurado === '1') {
      return;
    }
    botao.dataset.temaConfigurado = '1';
    botao.addEventListener('click', alternarTema);
  });
}

async function carregarUsuarios() {
  const padrao = await carregarDados('usuarios.json');
  const salvoTexto = localStorage.getItem(CHAVE_USUARIOS);

  if (!salvoTexto) {
    listaUsuarios = padrao;
    localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(listaUsuarios));
    return listaUsuarios;
  }

  try {
    const salvos = JSON.parse(salvoTexto);
    if (Array.isArray(salvos) && salvos.length > 0) {
      listaUsuarios = salvos;
    } else {
      listaUsuarios = padrao;
    }
  } catch (erro) {
    listaUsuarios = padrao;
  }

  return listaUsuarios;
}

function salvarUsuarios() {
  localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(listaUsuarios));
}

function obterUsuarioLogado() {
  const idSessao = localStorage.getItem(CHAVE_SESSAO);
  if (!idSessao) {
    return null;
  }
  return listaUsuarios.find(function (u) {
    return u.id === idSessao;
  }) || null;
}

function criarContaInicial(dados) {
  return {
    id: 'user-' + Date.now(),
    nome: dados.nome,
    email: dados.email.toLowerCase(),
    senha: dados.senha,
    titulo: 'Guardião das Sementes',
    avatar: dados.avatar || '../assets/images/perfil/dino-removebg-preview.png',
    personagemId: dados.personagemId || 'dino',
    bio: '',
    regiao: dados.regiao || '',
    folhas: 300,
    nivel: 1,
    xp: 0,
    xpProximoNivel: 200,
    arvoresPlantadas: 1,
    arvoreAtivaId: 'ipe-amarelo',
    arvoresCompradas: [
      {
        id: 'ipe-amarelo',
        nome: 'Ipê Amarelo',
        tipo: 'Mudas',
        estagio: 1,
        regas: 0,
        quantidade: 1,
        compradaEm: new Date().toISOString().slice(0, 10)
      }
    ],
    missoesConcluidas: [],
    progressoMissoes: {
      'conhecendo-arvores': { atual: 0, meta: 10 },
      'importancia-arvores': { atual: 0, meta: 1 },
      'plante-arvores': { atual: 0, meta: 5, registros: [] },
      'regue-sua-arvore': { atual: 0, meta: 1 }
    },
    plantiosPessoais: [],
    artigosLidos: [],
    conquistasDesbloqueadas: ['primeiro-broto'],
    amigos: [],
    notificacoes: [
      {
        id: 'notif-' + Date.now(),
        titulo: 'Bem-vindo ao DuoTree!',
        mensagem: 'Explore a Wiki, complete missões e regue sua primeira muda na Home.',
        lida: false,
        data: 'Agora'
      }
    ]
  };
}

async function fazerLogin(email, senha) {
  await carregarUsuarios();
  const emailLimpo = email.trim().toLowerCase();
  const encontrado = listaUsuarios.find(function (u) {
    return u.email.toLowerCase() === emailLimpo && u.senha === senha;
  });

  if (!encontrado) {
    return { ok: false, erro: 'E-mail ou senha incorretos.' };
  }

  localStorage.setItem(CHAVE_SESSAO, encontrado.id);
  usuarioAtual = encontrado;
  return { ok: true, usuario: encontrado };
}

async function cadastrarUsuario(dados) {
  await carregarUsuarios();
  const emailLimpo = dados.email.trim().toLowerCase();
  const existe = listaUsuarios.some(function (u) {
    return u.email.toLowerCase() === emailLimpo;
  });

  if (existe) {
    return { ok: false, erro: 'Já existe uma conta cadastrada com esse e-mail.' };
  }

  const novoUsuario = criarContaInicial(dados);
  listaUsuarios.push(novoUsuario);
  salvarUsuarios();
  localStorage.setItem(CHAVE_SESSAO, novoUsuario.id);
  usuarioAtual = novoUsuario;
  return { ok: true, usuario: novoUsuario };
}

function fazerLogout() {
  localStorage.removeItem(CHAVE_SESSAO);
  usuarioAtual = null;
  window.location.href = resolverCaminho('pages/login.html');
}

function sincronizarFolhas() {
  if (!usuarioAtual) {
    return;
  }
  const elementos = document.querySelectorAll('.qtdfolhas span, .pontos h2');
  elementos.forEach(function (el) {
    el.textContent = String(usuarioAtual.folhas);
  });
}

function destacarMenuRodape() {
  const arquivoAtual = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('footer a');
  links.forEach(function (link) {
    const destino = (link.getAttribute('href') || '').split('/').pop();
    if (destino === arquivoAtual) {
      link.classList.add('pagina-ativa');
    }
  });
}

async function iniciar(opcoes) {
  const exigirLogin = !opcoes || opcoes.exigirLogin !== false;
  configurarBotoesTema();
  await carregarUsuarios();
  usuarioAtual = obterUsuarioLogado();

  if (exigirLogin && !usuarioAtual) {
    window.location.href = resolverCaminho('pages/login.html');
    return null;
  }

  if (usuarioAtual) {
    if (!Array.isArray(usuarioAtual.plantiosPessoais)) {
      usuarioAtual.plantiosPessoais = [];
    }
    if (typeof usuarioAtual.avatar === 'string' && /\/(capivara|tucano|onca|arara)\.jpg$/.test(usuarioAtual.avatar)) {
      usuarioAtual.avatar = usuarioAtual.avatar.replace(/\.jpg$/, '.png');
      salvarEstado();
    }
    sincronizarFolhas();
  }

  destacarMenuRodape();
  return usuarioAtual;
}

function salvarEstado() {
  if (!usuarioAtual) {
    return;
  }
  const indice = listaUsuarios.findIndex(function (u) {
    return u.id === usuarioAtual.id;
  });
  if (indice >= 0) {
    listaUsuarios[indice] = usuarioAtual;
  }
  salvarUsuarios();
  sincronizarFolhas();
}

function adicionarNotificacao(titulo, mensagem) {
  if (!usuarioAtual) {
    return;
  }
  usuarioAtual.notificacoes.unshift({
    id: 'notif-' + Date.now(),
    titulo: titulo,
    mensagem: mensagem,
    lida: false,
    data: 'Agora'
  });
  if (usuarioAtual.notificacoes.length > 20) {
    usuarioAtual.notificacoes = usuarioAtual.notificacoes.slice(0, 20);
  }
  salvarEstado();
}

function marcarNotificacoesLidas() {
  if (!usuarioAtual) {
    return;
  }
  usuarioAtual.notificacoes.forEach(function (n) {
    n.lida = true;
  });
  salvarEstado();
}

function adicionarXp(quantidade) {
  if (!usuarioAtual || !quantidade) {
    return false;
  }
  let subiu = false;
  usuarioAtual.xp += quantidade;
  while (usuarioAtual.xp >= usuarioAtual.xpProximoNivel) {
    usuarioAtual.xp -= usuarioAtual.xpProximoNivel;
    usuarioAtual.nivel += 1;
    usuarioAtual.xpProximoNivel = Math.round(usuarioAtual.xpProximoNivel * 1.15);
    subiu = true;
  }
  if (subiu) {
    adicionarNotificacao(
      'Você subiu de nível!',
      'Parabéns! Agora você está no Nível ' + usuarioAtual.nivel + '.'
    );
    mostrarAviso('Subiu para o Nível ' + usuarioAtual.nivel + '!');
  }
  salvarEstado();
  return subiu;
}

function desbloquearConquista(id, nome, xpBonus) {
  if (!usuarioAtual) {
    return false;
  }
  const bonus = xpBonus || 50;
  if (usuarioAtual.conquistasDesbloqueadas.includes(id)) {
    return false;
  }
  usuarioAtual.conquistasDesbloqueadas.push(id);
  adicionarNotificacao('Conquista desbloqueada!', nome + ' (+' + bonus + ' XP)');
  mostrarAviso('Conquista desbloqueada: ' + nome + '!');
  adicionarXp(bonus);
  salvarEstado();
  return true;
}

function comprarEspecie(item) {
  if (!usuarioAtual) {
    return { ok: false, motivo: 'Faça login para adquirir espécies.' };
  }
  if (usuarioAtual.folhas < item.preco) {
    return {
      ok: false,
      motivo: 'Faltam ' + (item.preco - usuarioAtual.folhas) + ' folhas para adquirir ' + item.nome + '.'
    };
  }

  usuarioAtual.folhas -= item.preco;
  const existente = usuarioAtual.arvoresCompradas.find(function (a) {
    return a.id === item.id;
  });

  if (existente) {
    existente.quantidade = (existente.quantidade || 1) + 1;
  } else {
    usuarioAtual.arvoresCompradas.push({
      id: item.id,
      nome: item.nome,
      tipo: item.tipo,
      estagio: 1,
      regas: 0,
      quantidade: 1,
      compradaEm: new Date().toISOString().slice(0, 10)
    });
  }

  usuarioAtual.arvoresPlantadas += 1;
  usuarioAtual.arvoreAtivaId = item.id;

  adicionarXp(35);
  adicionarNotificacao('Nova espécie adquirida!', item.nome + ' foi adicionada à sua floresta.');
  if (usuarioAtual.arvoresCompradas.length >= 3) {
    desbloquearConquista('colecionador-nativo', 'Colecionador Nativo', 120);
  }
  salvarEstado();
  return { ok: true };
}

function regarArvoreAtiva() {
  if (!usuarioAtual) {
    return null;
  }
  if (!usuarioAtual.arvoresCompradas.length) {
    usuarioAtual.arvoresCompradas.push({
      id: 'ipe-amarelo',
      nome: 'Ipê Amarelo',
      tipo: 'Mudas',
      estagio: 1,
      regas: 0,
      quantidade: 1,
      compradaEm: new Date().toISOString().slice(0, 10)
    });
    usuarioAtual.arvoreAtivaId = 'ipe-amarelo';
  }

  const arvore = usuarioAtual.arvoresCompradas.find(function (a) {
    return a.id === usuarioAtual.arvoreAtivaId;
  }) || usuarioAtual.arvoresCompradas[0];

  arvore.regas = (arvore.regas || 0) + 1;
  if (arvore.regas >= 6) {
    arvore.estagio = 4;
  } else if (arvore.regas >= 4) {
    arvore.estagio = 3;
  } else if (arvore.regas >= 2) {
    arvore.estagio = 2;
  } else {
    arvore.estagio = 1;
  }

  let diariaConcluida = false;
  const diaria = usuarioAtual.progressoMissoes['regue-sua-arvore'] || { atual: 0, meta: 1 };
  if (!usuarioAtual.missoesConcluidas.includes('regue-sua-arvore') && diaria.atual < diaria.meta) {
    diaria.atual = 1;
    usuarioAtual.progressoMissoes['regue-sua-arvore'] = diaria;
    usuarioAtual.missoesConcluidas.push('regue-sua-arvore');
    usuarioAtual.folhas += 15;
    adicionarXp(60);
    diariaConcluida = true;
    adicionarNotificacao('Missão Diária concluída!', 'Você regou sua árvore e ganhou +15 folhas.');
  } else {
    adicionarXp(15);
  }

  desbloquearConquista('guardiao-floresta', 'Guardião da Floresta', 80);
  salvarEstado();
  return { arvore: arvore, diariaConcluida: diariaConcluida };
}

function concluirMissao(idMissao, folhas, xp) {
  if (!usuarioAtual || usuarioAtual.missoesConcluidas.includes(idMissao)) {
    return false;
  }
  usuarioAtual.missoesConcluidas.push(idMissao);
  usuarioAtual.folhas += folhas;
  adicionarXp(xp);
  adicionarNotificacao('Missão concluída!', 'Você recebeu +' + folhas + ' folhas e +' + xp + ' XP.');

  if (idMissao === 'conhecendo-arvores') {
    desbloquearConquista('mestre-quizzes', 'Mestre dos Quizzes', 150);
  }
  if (idMissao === 'biomas-do-brasil') {
    desbloquearConquista('especialista-biomas', 'Especialista em Biomas', 110);
  }
  if (idMissao === 'importancia-arvores') {
    desbloquearConquista('leitor-ods15', 'Leitor do ODS 15', 100);
  }
  if (idMissao === 'plante-arvores') {
    desbloquearConquista('maos-na-terra', 'Mãos na Terra', 200);
  }
  if (idMissao === 'observador-bairro') {
    desbloquearConquista('olhar-ecologico', 'Olhar Ecológico', 130);
  }

  salvarEstado();
  return true;
}

function mostrarAviso(mensagem, tipo) {
  let container = document.querySelector('.duotree-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'duotree-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'duotree-toast ' + (tipo || 'sucesso');
  toast.textContent = mensagem;
  container.appendChild(toast);

  requestAnimationFrame(function () {
    toast.classList.add('visivel');
  });

  setTimeout(function () {
    toast.classList.remove('visivel');
    setTimeout(function () {
      toast.remove();
    }, 220);
  }, 3200);
}

function fecharModal() {
  const existente = document.querySelector('.duotree-modal-backdrop');
  if (existente) {
    existente.remove();
  }
  document.body.classList.remove('modal-aberta');
}

function abrirModal(config) {
  fecharModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'duotree-modal-backdrop';
  backdrop.innerHTML =
    '<div class="duotree-modal" role="dialog" aria-modal="true">' +
      '<div class="duotree-modal-header">' +
        '<div>' +
          '<h2>' + escaparHtml(config.titulo) + '</h2>' +
          (config.subtitulo ? '<p class="duotree-modal-sub">' + escaparHtml(config.subtitulo) + '</p>' : '') +
        '</div>' +
        '<button type="button" class="duotree-modal-close" aria-label="Fechar">×</button>' +
      '</div>' +
      '<div class="duotree-modal-body">' + (config.html || '') + '</div>' +
    '</div>';

  backdrop.addEventListener('click', function (evento) {
    if (evento.target === backdrop) {
      fecharModal();
    }
  });

  backdrop.querySelector('.duotree-modal-close').addEventListener('click', fecharModal);
  document.body.appendChild(backdrop);
  document.body.classList.add('modal-aberta');

  if (typeof config.aoAbrir === 'function') {
    config.aoAbrir(backdrop.querySelector('.duotree-modal-body'), backdrop);
  }
}

document.addEventListener('keydown', function (evento) {
  if (evento.key === 'Escape') {
    fecharModal();
  }
});

function criarPaginacao(opcoes) {
  const totalItens = opcoes.totalItens || 0;
  const itensPorPagina = opcoes.itensPorPagina || 6;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  const paginaAtual = Math.min(Math.max(1, opcoes.paginaAtual || 1), totalPaginas);
  const aoMudarPagina = opcoes.aoMudarPagina;
  const rotulo = opcoes.rotulo || 'itens';

  const nav = document.createElement('nav');
  nav.className = 'duotree-paginacao';
  nav.setAttribute('aria-label', 'Navegação de páginas');

  if (totalItens === 0) {
    return nav;
  }

  const inicio = (paginaAtual - 1) * itensPorPagina + 1;
  const fim = Math.min(paginaAtual * itensPorPagina, totalItens);

  const info = document.createElement('div');
  info.className = 'duotree-paginacao-info';
  info.textContent = 'Mostrando ' + inicio + '–' + fim + ' de ' + totalItens + ' ' + rotulo + ' · Página ' + paginaAtual + ' de ' + totalPaginas;
  nav.appendChild(info);

  if (totalPaginas <= 1) {
    return nav;
  }

  const btnAnterior = document.createElement('button');
  btnAnterior.type = 'button';
  btnAnterior.className = 'duotree-pag-btn';
  btnAnterior.textContent = '← Anterior';
  btnAnterior.disabled = paginaAtual <= 1;
  btnAnterior.addEventListener('click', function () {
    if (paginaAtual > 1 && typeof aoMudarPagina === 'function') {
      aoMudarPagina(paginaAtual - 1);
    }
  });
  nav.appendChild(btnAnterior);

  for (let p = 1; p <= totalPaginas; p += 1) {
    const btnNum = document.createElement('button');
    btnNum.type = 'button';
    btnNum.className = 'duotree-pag-btn' + (p === paginaAtual ? ' ativo' : '');
    btnNum.textContent = String(p);
    btnNum.addEventListener('click', function () {
      if (p !== paginaAtual && typeof aoMudarPagina === 'function') {
        aoMudarPagina(p);
      }
    });
    nav.appendChild(btnNum);
  }

  const btnProxima = document.createElement('button');
  btnProxima.type = 'button';
  btnProxima.className = 'duotree-pag-btn';
  btnProxima.textContent = 'Próxima →';
  btnProxima.disabled = paginaAtual >= totalPaginas;
  btnProxima.addEventListener('click', function () {
    if (paginaAtual < totalPaginas && typeof aoMudarPagina === 'function') {
      aoMudarPagina(paginaAtual + 1);
    }
  });
  nav.appendChild(btnProxima);

  return nav;
}

window.DuoTree = {
  iniciar: iniciar,
  carregarDados: carregarDados,
  carregarUsuarios: carregarUsuarios,
  obterUsuarioLogado: obterUsuarioLogado,
  fazerLogin: fazerLogin,
  cadastrarUsuario: cadastrarUsuario,
  fazerLogout: fazerLogout,
  salvarEstado: salvarEstado,
  sincronizarFolhas: sincronizarFolhas,
  adicionarXp: adicionarXp,
  desbloquearConquista: desbloquearConquista,
  adicionarNotificacao: adicionarNotificacao,
  marcarNotificacoesLidas: marcarNotificacoesLidas,
  comprarEspecie: comprarEspecie,
  regarArvoreAtiva: regarArvoreAtiva,
  concluirMissao: concluirMissao,
  mostrarAviso: mostrarAviso,
  abrirModal: abrirModal,
  fecharModal: fecharModal,
  criarPaginacao: criarPaginacao,
  escaparHtml: escaparHtml,
  resolverCaminho: resolverCaminho,
  resolverImagem: resolverImagem,
  alternarTema: alternarTema
};
