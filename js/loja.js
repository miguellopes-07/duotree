let nomearvore = ''
let filtrotipo = ''
let regiao = ''

function filtroregiao() {
    caixa = document.querySelector('#idregiao');
    caixa.addEventListener('change', () => {
        regiao = caixa.value.trim().toLowerCase();
        filtro()
    });
}

function pesquisar() {
    var barrapesquisa = document.getElementsByClassName('barrapesquisawiki')[0];
    var input = barrapesquisa.children[0];
    input.addEventListener('input', () => {

        nomearvore = input.value.trim().toLowerCase();
        filtro()
    });
}

function ativarfiltro() {
    var tipos = document.getElementsByClassName('listfilterloja')[0];
    var opcoes = Array.from(tipos.children)
    opcoes.forEach(opcao => {
        opcao.addEventListener('click', () => {
            opcoes.forEach(opcao => {
                opcao.classList.remove('ativo');
            })
            opcao.classList.add('ativo')
            filtrotipo = opcao.textContent.trim().toLowerCase();
            filtro()
        })
    })

}

function filtro() {
    var cards = document.querySelectorAll('.listaarvore');
    console.log(regiao)
    if (filtrotipo == 'todas') {
        filtrotipo = ''
    }

    cards.forEach(card => {

        var titulo = card.children[1].children[0];
        const tituloDoCard = titulo.textContent.toLowerCase();

        var tipo = card.children[1].children[2];
        const tipoDoCard = tipo.textContent.toLowerCase();

        var local = card.children[1].children[3];
        const regiaoDoCard = local.textContent.toLowerCase();

        if (tituloDoCard.includes(nomearvore) && tipoDoCard.includes(filtrotipo) && regiaoDoCard.includes(regiao)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

filtroregiao()
pesquisar()
ativarfiltro()

