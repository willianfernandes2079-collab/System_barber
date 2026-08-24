-- AlterTable
ALTER TABLE "agendamentos" ADD COLUMN     "assinatura_plano_id" UUID;

-- CreateTable
CREATE TABLE "Plano" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "servico_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "validade_dias" INTEGER NOT NULL DEFAULT 30,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssinaturaPlano" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "plano_id" UUID NOT NULL,
    "quantidade_total" INTEGER NOT NULL,
    "quantidade_utilizada" INTEGER NOT NULL DEFAULT 0,
    "valor_pago" DECIMAL(10,2) NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssinaturaPlano_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Plano_servico_id_idx" ON "Plano"("servico_id");

-- CreateIndex
CREATE INDEX "Plano_ativo_idx" ON "Plano"("ativo");

-- CreateIndex
CREATE INDEX "Plano_nome_idx" ON "Plano"("nome");

-- CreateIndex
CREATE INDEX "AssinaturaPlano_cliente_id_idx" ON "AssinaturaPlano"("cliente_id");

-- CreateIndex
CREATE INDEX "AssinaturaPlano_plano_id_idx" ON "AssinaturaPlano"("plano_id");

-- CreateIndex
CREATE INDEX "AssinaturaPlano_status_idx" ON "AssinaturaPlano"("status");

-- CreateIndex
CREATE INDEX "AssinaturaPlano_data_inicio_idx" ON "AssinaturaPlano"("data_inicio");

-- CreateIndex
CREATE INDEX "AssinaturaPlano_data_fim_idx" ON "AssinaturaPlano"("data_fim");

-- CreateIndex
CREATE INDEX "agendamentos_assinatura_plano_id_idx" ON "agendamentos"("assinatura_plano_id");

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_assinatura_plano_id_fkey" FOREIGN KEY ("assinatura_plano_id") REFERENCES "AssinaturaPlano"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plano" ADD CONSTRAINT "Plano_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaPlano" ADD CONSTRAINT "AssinaturaPlano_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaPlano" ADD CONSTRAINT "AssinaturaPlano_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "Plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
