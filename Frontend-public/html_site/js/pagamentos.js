const FORMAS_PAGAMENTO = [
  {
    codigo: "PIX",
    nome: "Pix",
    icone: "⚡",
    descricao:
      "Pagamento via Pix.",
  },
  {
    codigo: "DINHEIRO",
    nome: "Dinheiro",
    icone: "💵",
    descricao:
      "Pagamento em dinheiro no atendimento.",
  },
  {
    codigo: "DEBITO",
    nome: "Cartão de débito",
    icone: "💳",
    descricao:
      "Pagamento com cartão de débito.",
  },
  {
    codigo: "CREDITO",
    nome: "Cartão de crédito",
    icone: "💳",
    descricao:
      "Pagamento com cartão de crédito.",
  },
  {
    codigo: "OUTROS",
    nome: "Outros",
    icone: "•",
    descricao:
      "Outras formas aceitas pela barbearia.",
  },
];

function renderizarFormasPagamento() {
  const lista =
    document.getElementById(
      "listaPagamentos",
    );

  if (!lista) return;

  lista.innerHTML =
    FORMAS_PAGAMENTO.map(
      (forma) => `
        <article class="payment-method">
          <div
            class="payment-icon"
            aria-hidden="true"
          >
            ${forma.icone}
          </div>

          <div>
            <h3>
              ${portalEscaparHtml(
                forma.nome,
              )}
            </h3>

            <p>
              ${portalEscaparHtml(
                forma.descricao,
              )}
            </p>
          </div>
        </article>
      `,
    ).join("");
}

document.addEventListener(
  "DOMContentLoaded",
  renderizarFormasPagamento,
);