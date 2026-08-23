function pegarTokenDaUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formRedefinirSenha");
  const mensagemEl = document.getElementById("mensagemResultado");

  if (!form || !mensagemEl) return;

  const botao = form.querySelector('button[type="submit"]');
  const token = pegarTokenDaUrl();

  if (!token) {
    mensagemEl.className = "alert alert-danger";
    mensagemEl.textContent =
      "Link inválido ou incompleto. Solicite um novo link de recuperação.";
    mensagemEl.style.display = "block";

    if (botao) {
      botao.disabled = true;
    }

    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const novaSenha = document
      .getElementById("novaSenhaInput")
      .value;

    const confirmarSenha = document
      .getElementById("confirmarSenhaInput")
      .value;

    if (novaSenha !== confirmarSenha) {
      mensagemEl.className = "alert alert-danger";
      mensagemEl.textContent = "As senhas não coincidem.";
      mensagemEl.style.display = "block";
      return;
    }

    botao.disabled = true;
    botao.textContent = "Salvando...";

    try {
      const resposta = await fetch(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            novaSenha,
          }),
        }
      );

      const data = await resposta.json();

      if (resposta.ok && data.success) {
        mensagemEl.className = "alert alert-success";
        mensagemEl.textContent =
          "Senha redefinida com sucesso! Redirecionando para o login...";
        mensagemEl.style.display = "block";

        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);

        return;
      }

      mensagemEl.className = "alert alert-danger";
      mensagemEl.textContent =
        data?.message ||
        "Não foi possível redefinir a senha.";
      mensagemEl.style.display = "block";

      botao.disabled = false;
      botao.textContent = "Redefinir senha";

    } catch (erro) {
      console.error(
        "Erro ao redefinir senha:",
        erro
      );

      mensagemEl.className = "alert alert-danger";
      mensagemEl.textContent =
        "Não foi possível conectar ao servidor.";
      mensagemEl.style.display = "block";

      botao.disabled = false;
      botao.textContent = "Redefinir senha";
    }
  });
});
