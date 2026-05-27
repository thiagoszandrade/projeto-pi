let bancoEstoque = JSON.parse(localStorage.getItem('bancoEstoque')) || [];

const form = document.getElementById('formMovimentacao');
const tabelaCorpo = document.getElementById('tabelaCorpo');

function atualizarTabela() {
    tabelaCorpo.innerHTML = "";

    bancoEstoque.forEach(movimentacao => {
        const linha = document.createElement('tr');
        
        const classeTipo = movimentacao.tipo === 'Entrada' ? 'entrada' : 'saida';

        linha.innerHTML = `
            <td>${movimentacao.responsavel}</td>
            <td>${movimentacao.item}</td>
            <td class="${classeTipo}">${movimentacao.tipo}</td>
            <td>${movimentacao.quantidade}</td>
            <td>${movimentacao.data}</td>
        `;
        tabelaCorpo.appendChild(linha);
    });
}

form.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const responsavel = document.getElementById ('nomeResponsavel').value;
    const item = document.getElementById('nomeItem').value;
    const quantidade = document.getElementById('qtdItem').value;
    const tipo = document.getElementById('tipoMovimentacao').value;
    const dataAtual = new Date().toLocaleString('pt-BR');

    const novaMovimentacao = {
        responsavel: responsavel,
        item: item,
        quantidade: quantidade,
        tipo: tipo,
        data: dataAtual
    };

    bancoEstoque.push(novaMovimentacao);

    localStorage.setItem('bancoEstoque', JSON.stringify(bancoEstoque));

    atualizarTabela();
    form.reset();
});

function limparBanco() {
    if (confirm("Tem certeza que deseja apagar todo o histórico?")) {
        localStorage.removeItem('bancoEstoque');
        bancoEstoque = [];
        atualizarTabela();
    }
}

atualizarTabela();