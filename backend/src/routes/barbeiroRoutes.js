const { Router } = require("express");

const {
  listarBarbeiros,
  buscarBarbeiroPorId,
  criarBarbeiro,
  atualizarBarbeiro,
  desativarBarbeiro,
} = require("../controllers/barbeiroController");

const router = Router();

router.get("/", listarBarbeiros);

router.get("/:id", buscarBarbeiroPorId);

router.post("/", criarBarbeiro);

router.put("/:id", atualizarBarbeiro);

router.delete("/:id", desativarBarbeiro);

module.exports = router;