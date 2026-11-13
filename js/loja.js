let arvores = [];
let nomearvore = '';
let filtrotipo = '';
let regiao = '';

const container = document.querySelector('#listaarvores');


function formatarRegioes(lista) {
    if (lista.length === 1) return lista[0];
    return lista.slice(0, -1).join(', ') + ' e ' + lista[lista.length - 1];
}

function caminhoImagem(imagem) {
    if (!imagem) return '../assets/images/loja/folha.png'; 
    if (imagem.startsWith('http')) return imagem;          
    return `../assets/images/loja/${imagem}`;             
}

function criarCard(a) {
    return `
    <div class="listaarvore">
        <div class="imgarvore"><img src="${caminhoImagem(a.imagem)}" alt="${a.nome}"></div>
        <div class="textoarvore">
            <h3>${a.nome}</h3>
            <h6>${a.cientifico}</h6>
            <h5>${a.tipo}</h5>
            <p class="regiao">Região: ${formatarRegioes(a.regioes)}</p>
            <div class="custo">
                <h4>${a.custo}</h4>
                <img src="../assets/images/loja/folha.png" alt="">
            </div>
        </div>
    </div>`;
}

function filtro() {
    const filtradas = arvores.filter(a =>
        a.nome.toLowerCase().includes(nomearvore) &&
        (filtrotipo === '' || a.tipo.toLowerCase() === filtrotipo) &&
        (regiao === '' || a.regioes.some(r => r.toLowerCase() === regiao))
    );

    container.innerHTML = filtradas.length
        ? filtradas.map(criarCard).join('')
        : '<p>Nenhuma árvore encontrada.</p>';
}

function filtroregiao() {
    const caixa = document.querySelector('#idregiao');
    caixa.addEventListener('change', () => {
        regiao = caixa.value.trim().toLowerCase();
        filtro();
    });
}

function pesquisar() {
    const input = document.querySelector('.barrapesquisawiki input');
    input.addEventListener('input', () => {
        nomearvore = input.value.trim().toLowerCase();
        filtro();
    });
}

function ativarfiltro() {
    const opcoes = Array.from(document.querySelectorAll('.listfilterloja li'));
    opcoes.forEach(opcao => {
        opcao.addEventListener('click', () => {
            opcoes.forEach(o => o.classList.remove('ativo'));
            opcao.classList.add('ativo');
            const valor = opcao.textContent.trim().toLowerCase();
            filtrotipo = valor === 'todas' ? '' : valor;
            filtro();
        });
    });
}

async function iniciar() {
    const resposta = await fetch('../data/arvores.json');
    arvores = await resposta.json();
    filtroregiao();
    pesquisar();
    ativarfiltro();
    filtro();
}

iniciar();