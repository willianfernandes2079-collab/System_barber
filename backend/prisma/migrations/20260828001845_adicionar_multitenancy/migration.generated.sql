/*
  Warnings:

  - A unique constraint covering the columns `[barbearia_id]` on the table `configuracoes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AssinaturaPlano" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "Caixa" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "Plano" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "ValorCorte" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "agendamentos" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "barbeiros" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "bloqueios_agenda" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "comissao" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "configuracoes" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "estoque" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "movimentacoes_estoque" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "pagamento" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "servicos" ADD COLUMN     "barbearia_id" UUID;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "barbearia_id" UUID;

-- CreateTable
CREATE TABLE "barbearias" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbearias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssinaturaPlano_barbearia_id_idx" ON "AssinaturaPlano"("barbearia_id");

-- CreateIndex
CREATE INDEX "Caixa_barbearia_id_idx" ON "Caixa"("barbearia_id");

-- CreateIndex
CREATE INDEX "Plano_barbearia_id_idx" ON "Plano"("barbearia_id");

-- CreateIndex
CREATE INDEX "ValorCorte_barbearia_id_idx" ON "ValorCorte"("barbearia_id");

-- CreateIndex
CREATE INDEX "agendamentos_barbearia_id_idx" ON "agendamentos"("barbearia_id");

-- CreateIndex
CREATE INDEX "barbeiros_barbearia_id_idx" ON "barbeiros"("barbearia_id");

-- CreateIndex
CREATE INDEX "bloqueios_agenda_barbearia_id_idx" ON "bloqueios_agenda"("barbearia_id");

-- CreateIndex
CREATE INDEX "clientes_barbearia_id_idx" ON "clientes"("barbearia_id");

-- CreateIndex
CREATE INDEX "comissao_barbearia_id_idx" ON "comissao"("barbearia_id");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_barbearia_id_key" ON "configuracoes"("barbearia_id");

-- CreateIndex
CREATE INDEX "estoque_barbearia_id_idx" ON "estoque"("barbearia_id");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_barbearia_id_idx" ON "movimentacoes_estoque"("barbearia_id");

-- CreateIndex
CREATE INDEX "pagamento_barbearia_id_idx" ON "pagamento"("barbearia_id");

-- CreateIndex
CREATE INDEX "servicos_barbearia_id_idx" ON "servicos"("barbearia_id");

-- CreateIndex
CREATE INDEX "usuarios_barbearia_id_idx" ON "usuarios"("barbearia_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barbeiros" ADD CONSTRAINT "barbeiros_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plano" ADD CONSTRAINT "Plano_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaPlano" ADD CONSTRAINT "AssinaturaPlano_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque" ADD CONSTRAINT "estoque_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao" ADD CONSTRAINT "comissao_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValorCorte" ADD CONSTRAINT "ValorCorte_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios_agenda" ADD CONSTRAINT "bloqueios_agenda_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caixa" ADD CONSTRAINT "Caixa_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
