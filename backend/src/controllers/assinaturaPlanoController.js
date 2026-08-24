const assinaturaPlanoService =
  require("../services/assinaturaPlanoService");

const asyncHandler =
  require("../utils/asyncHandler");

const {
  isNonEmptyString,
} = require("../utils/validators");

const listarPorCliente =
  asyncHandler(async (req, res) => {
    const { cliente_id } = req.params;

    const cliente =
      await assinaturaPlanoService.buscarClientePorId(
        cliente_id,
      );

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente não encontrado.",
      });
    }

    const assinaturas =
      await assinaturaPlanoService.listarAssinaturasCliente(
        cliente_id,
      );

    return res.status(200).json({
      success: true,
      data: assinaturas,
    });
  });

const listarAtivas =
  asyncHandler(async (req, res) => {
    const { cliente_id } = req.params;

    const cliente =
      await assinaturaPlanoService.buscarClientePorId(
        cliente_id,
      );

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente não encontrado.",
      });
    }

    const assinaturas =
      await assinaturaPlanoService.listarAssinaturasAtivas(
        cliente_id,
      );

    return res.status(200).json({
      success: true,
      data: assinaturas,
    });
  });

const buscarPorId =
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const assinatura =
      await assinaturaPlanoService.buscarAssinaturaPorId(
        id,
      );

    if (!assinatura) {
      return res.status(404).json({
        success: false,
        message:
          "Assinatura de plano não encontrada.",
      });
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
        message: "O cliente é obrigatório.",
      });
    }

    if (!isNonEmptyString(plano_id)) {
      return res.status(400).json({
        success: false,
        message: "O plano é obrigatório.",
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
        message: "Informe um valor pago válido.",
      });
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
      );

    if (!existente) {
      return res.status(404).json({
        success: false,
        message:
          "Assinatura de plano não encontrada.",
      });
    }

    const assinatura =
      await assinaturaPlanoService.cancelarAssinatura(
        id,
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

    const assinatura =
      await assinaturaPlanoService.utilizarAssinatura(
        id,
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