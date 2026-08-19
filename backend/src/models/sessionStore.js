const prisma = require("../config/prismaClient");

async function criarSessao(
  userId,
  jti,
  { expiresAt, userAgent = null, ip = null } = {}
) {
  return prisma.sessao.create({
    data: {
      usuario_id: userId,
      jti,
      expires_at: new Date(expiresAt),
      user_agent: userAgent,
      ip,
    },
  });
}

async function sessaoValida(userId, jti) {
  const sessao = await prisma.sessao.findFirst({
    where: {
      usuario_id: userId,
      jti,
      expires_at: {
        gt: new Date(),
      },
    },
  });

  return Boolean(sessao);
}

async function revogarSessao(userId, jti) {
  const resultado = await prisma.sessao.deleteMany({
    where: {
      usuario_id: userId,
      jti,
    },
  });

  return resultado.count > 0;
}

async function revogarTodasSessoes(userId) {
  await prisma.sessao.deleteMany({
    where: {
      usuario_id: userId,
    },
  });
}

async function listarSessoes(userId) {
  const sessoes = await prisma.sessao.findMany({
    where: {
      usuario_id: userId,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return sessoes.map((sessao) => ({
    jti: sessao.jti,
    createdAt: sessao.created_at.toISOString(),
    expiresAt: sessao.expires_at.toISOString(),
    userAgent: sessao.user_agent,
    ip: sessao.ip,
  }));
}

module.exports = {
  criarSessao,
  sessaoValida,
  revogarSessao,
  revogarTodasSessoes,
  listarSessoes,
};