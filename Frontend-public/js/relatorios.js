function abrirRelatorio(tipo) {
  const periodo = document.getElementById("periodoSelect")?.value || "30dias";

  mostrarToast(
    `Relatório de "${tipo}" (período: ${periodo}) ainda depende do backend de relatórios.`,
    "warning"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-relatorio]").forEach((card) => {
    card.addEventListener("click", () => {
      abrirRelatorio(card.dataset.relatorio);
    });
  });
});