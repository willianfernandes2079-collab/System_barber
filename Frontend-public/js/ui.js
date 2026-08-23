/**
 * js/ui.js — pequenos helpers de interface reusados em várias páginas.
 * Requer <div class="toast-container" id="toastContainer"></div> no HTML.
 */

function mostrarToast(mensagem, tipo = "info") {
  const container = document.getElementById("toastContainer");

  if (!container) {
    alert(mensagem);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensagem;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function formatarMoeda(valor) {
  const numero = Number(valor) || 0;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "—";

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("pt-BR");
}

function formatarDataHora(data) {
  if (!data) return "—";

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function debounce(fn, atraso = 350) {
  let timer;

  return (...args) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
    }, atraso);
  };
}
