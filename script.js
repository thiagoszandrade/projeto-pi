const TOTAL_EQUIPAMENTOS = 140;
const ITENS = ['Positivo', 'Chrome', 'Técnico', 'Tablet'];

let bancoEstoque = JSON.parse(localStorage.getItem('bancoEstoque')) || [];

const form = document.getElementById('formMovimentacao');
const tabelaCorpo = document.getElementById('tabelaCorpo');

let chartBarras = null;



function getDadosFiltrados() {
    const inicio = document.getElementById('dataInicio').value;
    const fim    = document.getElementById('dataFim').value;

    return bancoEstoque.filter(m => {
        const partes = m.data.split(', ')[0].split('/');
        const dataISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
        if (inicio && dataISO < inicio) return false;
        if (fim    && dataISO > fim)    return false;
        return true;
    });
}



function aplicarFiltro() {
    atualizarDashboard();
    atualizarTabela();
}



function resetarFiltro() {
    document.getElementById('dataInicio').value = '';
    document.getElementById('dataFim').value    = '';
    atualizarDashboard();
    atualizarTabela();
}



function atualizarTabela() {
    const dados = getDadosFiltrados();
    tabelaCorpo.innerHTML = '';
    dados.forEach(m => {
        const linha = document.createElement('tr');
        const classeTipo = m.tipo === 'Entrada' ? 'entrada' : 'saida';
        linha.innerHTML = `
            <td>${m.responsavel}</td>
            <td>${m.item}</td>
            <td class="${classeTipo}">${m.tipo}</td>
            <td>${m.quantidade}</td>
            <td>${m.sala}</td>
            <td>${m.data}</td>
        `;
        tabelaCorpo.appendChild(linha);
    });
}



function atualizarDashboard() {
    const dados = getDadosFiltrados();

    let totalE = 0, totalS = 0;
    dados.forEach(m => {
        const q = parseInt(m.quantidade);
        if (m.tipo === 'Entrada') totalE += q;
        else totalS += q;
    });

    document.getElementById('totalEntradas').textContent = totalE;
    document.getElementById('totalSaidas').textContent   = totalS;

    const totalESaldo = bancoEstoque.reduce((acc, m) => acc + (m.tipo === 'Entrada' ? parseInt(m.quantidade) : -parseInt(m.quantidade)), 0);
    const emEstoque = TOTAL_EQUIPAMENTOS + totalESaldo;
    const estoqueEl = document.getElementById('emEstoque');
    estoqueEl.textContent = emEstoque;
    estoqueEl.style.color = emEstoque < 30 ? '#c20000' : emEstoque < 60 ? '#f5a623' : 'var(--cor-roxo)';

    const entradasPorItem = ITENS.map(it =>
        dados.filter(m => m.item === it && m.tipo === 'Entrada')
             .reduce((acc, m) => acc + parseInt(m.quantidade), 0)
    );
    const saidasPorItem = ITENS.map(it =>
        dados.filter(m => m.item === it && m.tipo === 'Saída')
             .reduce((acc, m) => acc + parseInt(m.quantidade), 0)
    );

    const ctx = document.getElementById('graficoBarras').getContext('2d');
    if (chartBarras) chartBarras.destroy();

    chartBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ITENS,
            datasets: [
                {
                    label: 'Entradas',
                    data: entradasPorItem,
                    backgroundColor: 'rgba(131, 245, 44, 0.75)',
                    borderColor: '#83f52c',
                    borderWidth: 1,
                    borderRadius: 5,
                },
                {
                    label: 'Saídas',
                    data: saidasPorItem,
                    backgroundColor: 'rgba(194, 0, 0, 0.75)',
                    borderColor: '#c20000',
                    borderWidth: 1,
                    borderRadius: 5,
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#fff', font: { size: 13 } }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} unidade(s)`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#ccc', font: { size: 13 } },
                    grid:  { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#aaa', stepSize: 1 },
                    grid:  { color: 'rgba(255,255,255,0.08)' },
                    title: { display: true, text: 'Quantidade', color: '#aaa' }
                }
            }
        }
    });
}



function exportarExcel() {
    const dados = getDadosFiltrados();
 
    if (dados.length === 0) {
        alert('Nenhum dado para exportar no período selecionado.');
        return;
    }
 
    const linhas = dados.map(m => ({
        'Responsável': m.responsavel,
        'Item':        m.item,
        'Tipo':        m.tipo,
        'Quantidade':  parseInt(m.quantidade),
        'Sala':        m.sala,
        'Data/Hora':   m.data
    }));
 
    const ws = XLSX.utils.json_to_sheet(linhas);
 
    ws['!cols'] = [
        { wch: 18 },
        { wch: 12 },
        { wch: 8  },
        { wch: 10 },
        { wch: 12 },
        { wch: 22 },
    ];
 
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');
 
    const inicio = document.getElementById('dataInicio').value;
    const fim    = document.getElementById('dataFim').value;
    const sufixo = inicio && fim ? `_${inicio}_a_${fim}` : '';
    const nomeArquivo = `estoque${sufixo}.xlsx`;
 
    XLSX.writeFile(wb, nomeArquivo);
}



form.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const responsavel = document.getElementById('nomeResponsavel').value;
    const item        = document.getElementById('nomeItem').value;
    const quantidade  = document.getElementById('qtdItem').value;
    const sala        = document.getElementById('selectSala').value;
    const tipo        = document.getElementById('tipoMovimentacao').value;
    
    let dataObjeto = new Date();
    let hora = dataObjeto.getHours();
    let minutos = dataObjeto.getMinutes();

    let minutosTotais = (hora * 60) + minutos;

    if (minutosTotais >= 420 && minutosTotais < 470) {
        dataObjeto.setHours(7, 0, 0);
    }

    else if (minutosTotais >= 470 && minutosTotais < 520) {
        dataObjeto.setHours(7, 50, 0);
    }

    else if (minutosTotais >= 520 && minutosTotais < 570) {
        dataObjeto.setHours(8, 40, 0);
    }

    else if (minutosTotais >= 570 && minutosTotais < 620) {
        dataObjeto.setHours(9, 30, 0);
    }

    else if (minutosTotais >= 620 && minutosTotais < 640) {
        dataObjeto.setHours(10, 20, 0);
    }

     else if (minutosTotais >= 640 && minutosTotais < 690) {
        dataObjeto.setHours(10, 40, 0);
    }
    else if (minutosTotais >= 690 && minutosTotais < 740) {
        dataObjeto.setHours(11, 30, 0);
    }
    
    const dataAtual = dataObjeto.toLocaleString('pt-BR');

    bancoEstoque.push({ responsavel, item, quantidade, sala, tipo, data: dataAtual });
    localStorage.setItem('bancoEstoque', JSON.stringify(bancoEstoque));

    atualizarTabela();
    atualizarDashboard();
    form.reset();
});



function limparBanco() {
    if (confirm('Tem certeza que deseja apagar todo o histórico?')) {
        localStorage.removeItem('bancoEstoque');
        bancoEstoque = [];
        atualizarTabela();
        atualizarDashboard();
    }
}



atualizarTabela();
atualizarDashboard();