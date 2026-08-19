const userStore = require("../models/userStore");
const { hashPassword } = require("../utils/hash");
const env = require("../config/env");

/**
 * Cria usuários de teste em memória quando DEVELOPMENT_MODE=true
 * (item 47/48 da especificação). Roda uma vez, na subida do servidor.
 * Substituído por `prisma db seed` na fase de banco de dados.
 */
async function seedUsers() {
  if (!env.DEVELOPMENT_MODE) return;

  const usuariosSeed = [
    { nome: "Admin Geral", email: "admin@barbearia.com", senha: "Admin@123", cargo: "ADMIN", telefone: "11999990001" },
    { nome: "Gerente Loja", email: "gerente@barbearia.com", senha: "Gerente@123", cargo: "GERENTE", telefone: "11999990002" },
    { nome: "Carlos Barbeiro", email: "carlos@barbearia.com", senha: "Barbeiro@123", cargo: "BARBEIRO", telefone: "11999990003" },
    { nome: "Recepção", email: "recepcao@barbearia.com", senha: "Recepcao@123", cargo: "RECEPCIONISTA", telefone: "11999990004" },
  ];

  for (const u of usuariosSeed) {
    const existente = await userStore.findByEmail(u.email);
    if (existente) continue;
    const senha_hash = await hashPassword(u.senha);
    await userStore.create({
      nome: u.nome,
      email: u.email,
      senha_hash,
      telefone: u.telefone,
      cargo: u.cargo,
    });
  }

  // eslint-disable-next-line no-console
  console.log("\n[SEED] Usuários de teste criados (DEVELOPMENT_MODE=true):");
  usuariosSeed.forEach((u) => console.log(`  - ${u.cargo.padEnd(14)} ${u.email} / ${u.senha}`));
  console.log("");
}

module.exports = seedUsers;