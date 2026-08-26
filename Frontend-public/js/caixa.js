
//    SISTEMA DE CAIXA BARBEARIA - LÓGICA & ESTADO

// Catálogo Base de Itens do Sistema
const CATALOGO_PRODUTOS = [
  { id: 1, nome: 'Corte Masculino', preco: 40.00, categoria: 'servicos', icon: '✂️' },
  { id: 2, nome: 'Barba Completa', preco: 30.00, categoria: 'servicos', icon: '🪒' },
  { id: 3, nome: 'Corte + Barba', preco: 65.00, categoria: 'servicos', icon: '💈' },
  { id: 4, nome: 'Sobrancelha', preco: 15.00, categoria: 'servicos', icon: '👁️' },
  { id: 5, nome: 'Pigmentação Barba', preco: 25.00, categoria: 'servicos', icon: '🎨' },
  { id: 6, nome: 'Pomada Matte 150g', preco: 35.00, categoria: 'produtos', icon: '🧴' },
  { id: 7, nome: 'Óleo para Barba', preco: 28.00, categoria: 'produtos', icon: '💧' },
  { id: 8, nome: 'Shampoo Barba', preco: 32.00, categoria: 'produtos', icon: '🧼' },
  { id: 9, nome: 'Cerveja Long Neck', preco: 10.00, categoria: 'bebidas', icon: '🍺' },
  { id: 10, nome: 'Refrigerante Lata', preco: 6.00, categoria: 'bebidas', icon: '🥤' },
  { id: 11, nome: 'Água Mineral', preco: 4.00, categoria: 'bebidas', icon: '🍾' },
  { id: 12, nome: 'Whisky Dose', preco: 18.00, categoria: 'bebidas', icon: '🥃' }, 
];

// Estado da Aplicação
let cart = [];
let categoriaAtiva = 'todos';
let totalCalculado = 0;

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
  renderizarCatalogo();
  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);
});

// Renderização da Grade de Produtos
function renderizarCatalogo() {
  const grid = document.getElementById('grid-produtos');
  const termoBusca = document.getElementById('input-busca').value.toLowerCase();
  grid.innerHTML = '';

  const produtosFiltrados = CATALOGO_PRODUTOS.filter(item => {
    const atendeCategoria = categoriaAtiva === 'todos' || item.categoria === categoriaAtiva;
    const atendeBusca = item.nome.toLowerCase().includes(termoBusca);
    return atendeCategoria && atendeBusca;
  });

  if (produtosFiltrados.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">Nenhum item encontrado.</p>`;
    return;
  }

  produtosFiltrados.forEach(item => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => adicionarAoCarrinho(item.id);

    card.innerHTML = `
      <div class="product-icon">${item.icon}</div>
      <div class="product-title">${item.nome}</div>
      <div class="product-price">R$ ${item.preco.toFixed(2).replace('.', ',')}</div>
    `;
    grid.appendChild(card);
  });
}

// Filtro por Categoria
function filtrarCategoria(categoria) {
  categoriaAtiva = categoria;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderizarCatalogo();
}

// Filtro por Input de Pesquisa
function filtrarItens() {
  renderizarCatalogo();
}

// Adicionar Item ao Carrinho / Comanda
function adicionarAoCarrinho(idProduto) {
  const produto = CATALOGO_PRODUTOS.find(p => p.id === idProduto);
  const itemExistente = cart.find(item => item.id === idProduto);

  if (itemExistente) {
    itemExistente.qtd += 1;
  } else {
    cart.push({ ...produto, qtd: 1 });
  }

  renderizarCarrinho();
}

// Modificar Quantidade
function alterarQuantidade(idProduto, delta) {
  const item = cart.find(i => i.id === idProduto);
  if (item) {
    item.qtd += delta;
    if (item.qtd <= 0) {
      removerDoCarrinho(idProduto);
      return;
    }
  }
  renderizarCarrinho();
}

// Remover Item da Comanda
function removerDoCarrinho(idProduto) {
  cart = cart.filter(item => item.id !== idProduto);
  renderizarCarrinho();
}

// Renderização do Carrinho/Comanda
function renderizarCarrinho() {
  const tbody = document.getElementById('cart-tbody');
  tbody.innerHTML = '';
  totalCalculado = 0;

  if (cart.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-cart-msg">Comanda vazia</td>
      </tr>
    `;
  } else {
    cart.forEach(item => {
      const subtotalItem = item.preco * item.qtd;
      totalCalculado += subtotalItem;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.nome}</strong></td>
        <td>
          <div class="qty-controls">
            <button class="btn-qty" onclick="alterarQuantidade(${item.id}, -1)">-</button>
            <span>${item.qtd}</span>
            <button class="btn-qty" onclick="alterarQuantidade(${item.id}, 1)">+</button>
          </div>
        </td>
        <td>R$ ${subtotalItem.toFixed(2).replace('.', ',')}</td>
        <td>
          <button class="btn-remove" onclick="removerDoCarrinho(${item.id})">&times;</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.getElementById('subtotal-val').innerText = `R$ ${totalCalculado.toFixed(2).replace('.', ',')}`;
  document.getElementById('total-val').innerText = `R$ ${totalCalculado.toFixed(2).replace('.', ',')}`;
  
  calcularCalculosValores();
}

// Controle dos Campos de Pagamento (Dinheiro x Cartão x PIX)
function alternarCamposPagamento() {
  const forma = document.getElementById('forma-pagamento').value;
  const grupoDinheiro = document.getElementById('grupo-dinheiro');
  const linhaTroco = document.getElementById('linha-troco');

  if (forma === 'dinheiro') {
    grupoDinheiro.style.display = 'flex';
    linhaTroco.style.display = 'flex';
  } else {
    grupoDinheiro.style.display = 'none';
    linhaTroco.style.display = 'none';
  }
}

// Cálculo em tempo real do Troco
function calcularCalculosValores() {
  const forma = document.getElementById('forma-pagamento').value;
  if (forma !== 'dinheiro') return;

  const recebidoInput = parseFloat(document.getElementById('valor-recebido').value) || 0;
  const spanTroco = document.getElementById('troco-val');

  if (totalCalculado > 0 && recebidoInput > 0) {
    const troco = recebidoInput - totalCalculado;
    if (troco >= 0) {
      spanTroco.innerText = `R$ ${troco.toFixed(2).replace('.', ',')}`;
      spanTroco.className = 'troco-valido';
    } else {
      spanTroco.innerText = 'Insuficiente';
      spanTroco.className = 'troco-insuficiente';
    }
  } else {
    spanTroco.innerText = 'R$ 0,00';
    spanTroco.className = 'troco-valido';
  }
}

// Botões Atalho de Dinheiro
function aplicarAtalhoDinheiro(valor) {
  document.getElementById('valor-recebido').value = valor;
  calcularCalculosValores();
}

function aplicarValorExato() {
  document.getElementById('valor-recebido').value = totalCalculado.toFixed(2);
  calcularCalculosValores();
}

// Limpar Toda a Comanda
function limparComanda() {
  if (cart.length === 0) return;
  if (confirm("Deseja realmente cancelar a comanda atual?")) {
    cart = [];
    document.getElementById('valor-recebido').value = '';
    document.getElementById('cliente-nome').value = '';
    renderizarCarrinho();
  }
}

// Processamento e Finalização da Venda
function finalizarVenda() {
  if (cart.length === 0) {
    alert("Adicione itens à comanda antes de finalizar!");
    return;
  }

  const forma = document.getElementById('forma-pagamento').value;
  const recebido = parseFloat(document.getElementById('valor-recebido').value) || 0;

  if (forma === 'dinheiro' && recebido < totalCalculado) {
    alert("O valor recebido em dinheiro é inferior ao total da comanda!");
    return;
  }

  // Montagem do Recibo Modal
  const cliente = document.getElementById('cliente-nome').value || "Cliente Não Informado";
  const reciboConteudo = document.getElementById('recibo-conteudo');

  let itensHTML = cart.map(i => `
    <div class="receipt-line">
      <span>${i.qtd}x ${i.nome}</span>
      <span>R$ ${(i.preco * i.qtd).toFixed(2)}</span>
    </div>
  `).join('');

  const trocoValor = (forma === 'dinheiro' && recebido > totalCalculado) ? (recebido - totalCalculado).toFixed(2) : "0.00";

  reciboConteudo.innerHTML = `
    <p><strong>Cliente:</strong> ${cliente}</p>
    <p><strong>Pagamento:</strong> ${forma.toUpperCase()}</p>
    <br>
    ${itensHTML}
    <br>
    <div class="receipt-line"><strong>TOTAL:</strong> <strong>R$ ${totalCalculado.toFixed(2)}</strong></div>
    ${forma === 'dinheiro' ? `<div class="receipt-line"><span>Troco:</span> <span>R$ ${trocoValor}</span></div>` : ''}
  `;

  document.getElementById('modal-recibo').classList.add('active');
}

function fecharModal() {
  document.getElementById('modal-recibo').classList.remove('active');
  cart = [];
  document.getElementById('valor-recebido').value = '';
  document.getElementById('cliente-nome').value = '';
  renderizarCarrinho();
}

// Atualizador de Data e Hora na Topbar
function atualizarRelogio() {
  const agora = new Date();
  const opcoes = { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' };
  document.getElementById('data-hora-atual').innerText = agora.toLocaleDateString('pt-BR', opcoes);
}