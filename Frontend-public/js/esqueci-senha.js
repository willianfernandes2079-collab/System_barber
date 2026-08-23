document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formEsqueciSenha");
  const emailInput = document.getElementById("emailInput");
  const botao = form?.querySelector('button[type="submit"]');
  const mensagemEl = document.getElementById("mensagemResultado");

  if (!form || !emailInput || !botao || !mensagemEl) {
    console.error("Elementos da recuperação de senha não encontrados.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
      mensagemEl.className = "alert alert-danger";
      mensagemEl.textContent = "Informe seu e-mail.";
      mensagemEl.style.display = "block";
      return;
    }

    botao.disabled = true;
    botao.textContent = "Enviando...";
    mensagemEl.style.display = "none";

    try {
      const resposta = await fetch(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          data?.message || "Não foi possível solicitar a recuperação.",
        );
      }

      mensagemEl.className = "alert alert-success";
      mensagemEl.innerHTML =
        "Solicitação enviada com sucesso!<br><br>" +
        "Se o e-mail estiver cadastrado, o link de recuperação " +
        "chegará em breve.<br>" +
        "O link é válido por <strong>15 minutos</strong>.";

      mensagemEl.style.display = "block";
      form.reset();
    } catch (erro) {
      console.error("Erro na recuperação de senha:", erro);

      mensagemEl.className = "alert alert-danger";
      mensagemEl.textContent =
        erro?.message ||
        "Não foi possível conectar ao servidor. Tente novamente.";

      mensagemEl.style.display = "block";
    } finally {
      botao.disabled = false;
      botao.textContent = "Enviar link de recuperação";
    }
  });
});
