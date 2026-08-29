const assinaturaPlanoService =
  require("../services/assinaturaPlanoService");

const asyncHandler =
  require("../utils/asyncHandler");

const {
  isNonEmptyString,
} = require("../utils/validators");

const userStore =
  require("../models/userStore");

const listarPorCliente =
  asyncHandler(async (req, res) => {
    const { cliente_id } = req.params;

    if (!isNonEmptyString(cliente_id)) {
      return res.status(400).json({
        success: false,
        message: "Cliente não informado.",
      });
    }

    const cliente =
      await assinaturaPlanoService.buscarClientePorId(
        cliente_id,
        req.user.barbearia_id,
      );

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente não encontrado.",
      });
    }

    if (req.user.cargo === "CLIENTE") {
      const usuario =
        await userStore.findById(
          req.user.sub,
        );

      if (
        !usuario ||
        !usuario.email ||
        !cliente.email ||
        usuario.email.toLowerCase() !==
          cliente.email.toLowerCase()
      ) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado.",
        });
      }
    }

    const assinaturas =
      await assinaturaPlanoService.listarAssinaturasCliente(
        cliente_id,
        req.user.barbearia_id,
      );

    return res.status(200).json({
      success: true,
      data: assinaturas,
    });
  });

const listarAtivas =
  asyncHandler(async (req, res) => {
    const { cliente_id } = req.params;

    if (!isNonEmptyString(cliente_id)) {
      return res.status(400).json({
        success: false,
        message: "Cliente não informado.",
      });
    }

    const cliente =
      await assinaturaPlanoService.buscarClientePorId(
        cliente_id,
        req.user.barbearia_id,
      );

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente não encontrado.",
      });
    }

    if (req.user.cargo === "CLIENTE") {
      const usuario =
        await userStore.findById(
          req.user.sub,
        );

      if (
        !usuario ||
        !usuario.email ||
        !cliente.email ||
        usuario.email.toLowerCase() !==
          cliente.email.toLowerCase()
      ) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado.",
        });
      }
    }

    const assinaturas =
      await assinaturaPlanoService.listarAssinaturasAtivas(
        cliente_id,
        req.user.barbearia_id,
      );

    return res.status(200).json({
      success: true,
      data: assinaturas,
    });
  });

const buscarPorId =
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isNonEmptyString(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Assinatura não informada.",
      });
    }

    const assinatura =
      await assinaturaPlanoService.buscarAssinaturaPorId(
        id,
        req.user.barbearia_id,
      );

    if (!assinatura) {
      return res.status(404).json({
        success: false,
        message:
          "Assinatura de plano não encontrada.",
      });
    }

    if (req.user.cargo === "CLIENTE") {
      const usuario =
        await userStore.findById(
          req.user.sub,
        );

      if (
        !usuario ||
        !usuario.email ||
        !assinatura.cliente ||
        !assinatura.cliente.email ||
        usuario.email.toLowerCase() !==
          assinatura.cliente.email.toLowerCase()
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Assinatura de plano não encontrada.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: assinatura,
    });
  });

const contratar =
  asyncHandler(async (req, res) => {
    const {
      cliente_id,
      plano_id,
      valor_pago,
      data_inicio,
    } = req.body;

    if (!isNonEmptyString(cliente_id)) {
      return res.status(400).json({
        success: false,
        message:
          "O cliente é obrigatório.",
      });
    }

    if (!isNonEmptyString(plano_id)) {
      return res.status(400).json({
        success: false,
        message:
          "O plano é obrigatório.",
      });
    }

    if (
      valor_pago !== undefined &&
      valor_pago !== null &&
      (
        !Number.isFinite(
          Number(valor_pago),
        ) ||
        Number(valor_pago) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Informe um valor pago válido.",
      });
    }

    if (req.user.cargo === "CLIENTE") {
      const usuario =
        await userStore.findById(
          req.user.sub,
        );

      if (
        !usuario ||
        !usuario.email
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Cliente não encontrado.",
        });
      }

      const cliente =
        await assinaturaPlanoService.buscarClientePorId(
          cliente_id,
          req.user.barbearia_id,
        );

      if (
        !cliente ||
        !cliente.email ||
        cliente.email.toLowerCase() !==
          usuario.email.toLowerCase()
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Cliente não encontrado.",
        });
      }
    }

    const assinatura =
      await assinaturaPlanoService.contratarPlano({
        cliente_id,
        plano_id,
        valor_pago:
          valor_pago !== undefined &&
          valor_pago !== null
            ? Number(valor_pago)
            : undefined,
        data_inicio,
        barbeariaId:
          req.user.barbearia_id,
      });

    return res.status(201).json({
      success: true,
      message:
        "Plano contratado com sucesso.",
      data: assinatura,
    });
  });

const cancelar =
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existente =
      await assinaturaPlanoService.buscarAssinaturaPorId(
        id,
        req.user.barbearia_id,
      );

    if (!existente) {
      return res.status(404).json({
        success: false,
        message:
          "Assinatura de plano não encontrada.",
      });
    }

    if (req.user.cargo === "CLIENTE") {
      const usuario =
        await userStore.findById(
          req.user.sub,
        );

      if (
        !usuario ||
        !usuario.email ||
        !existente.cliente ||
        !existente.cliente.email ||
        usuario.email.toLowerCase() !==
          existente.cliente.email.toLowerCase()
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Assinatura de plano não encontrada.",
        });
      }
    }

    const assinatura =
      await assinaturaPlanoService.cancelarAssinatura(
        id,
        req.user.barbearia_id,
      );

    return res.status(200).json({
      success: true,
      message:
        "Assinatura cancelada com sucesso.",
      data: assinatura,
    });
  });

const utilizar =
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existente =
      await assinaturaPlanoService.buscarAssinaturaPorId(
        id,
        req.user.barbearia_id,
      );

    if (!existente) {
      return res.status(404).json({
        success: false,
        message:
          "Assinatura de plano não encontrada.",
      });
    }

    if (req.user.cargo === "CLIENTE") {
      const usuario =
        await userStore.findById(
          req.user.sub,
        );

      if (
        !usuario ||
        !usuario.email ||
        !existente.cliente ||
        !existente.cliente.email ||
        usuario.email.toLowerCase() !==
          existente.cliente.email.toLowerCase()
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Assinatura de plano não encontrada.",
        });
      }
    }

    const assinatura =
      await assinaturaPlanoService.utilizarAssinatura(
        id,
        req.user.barbearia_id,
      );

    return res.status(200).json({
      success: true,
      message:
        "Utilização do plano registrada com sucesso.",
      data: assinatura,
    });
  });

module.exports = {
  listarPorCliente,
  listarAtivas,
  buscarPorId,
  contratar,
  cancelar,
  utilizar,
};

