const prisma = require("../config/prismaClient");

function toPublicUser(usuario) {
  if (!usuario) return null;

  const { senha_hash, ...publico } = usuario;
  return publico;
}

async function findByEmail(email) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });

  return usuario;
}

async function findById(id) {
  return prisma.usuario.findUnique({
    where: {
      id,
    },
  });
}

async function create({ nome, email, senha_hash, telefone = null, cargo }) {
  const emailNormalizado = email.toLowerCase();

  const jaExiste = await findByEmail(emailNormalizado);

  if (jaExiste) {
    throw new Error("E-mail já cadastrado.");
  }

  return prisma.usuario.create({
    data: {
      nome,
      email: emailNormalizado,
      senha_hash,
      telefone,
      cargo,
      ativo: true,
    },
  });
}

async function updateSenha(id, novaSenhaHash) {
  const usuario = await prisma.usuario.update({
    where: {
      id,
    },
    data: {
      senha_hash: novaSenhaHash,
    },
  });

  return usuario;
}

async function listAll() {
  const usuarios = await prisma.usuario.findMany({
    orderBy: {
      created_at: "asc",
    },
  });

  return usuarios.map(toPublicUser);
}

module.exports = {
  findByEmail,
  findById,
  create,
  updateSenha,
  listAll,
  toPublicUser,
};
