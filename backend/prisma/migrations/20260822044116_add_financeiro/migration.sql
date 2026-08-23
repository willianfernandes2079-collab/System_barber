-- AlterTable
ALTER TABLE "configuracoes" ADD COLUMN     "comissao_padrao" DECIMAL(5,2) NOT NULL DEFAULT 40;

-- CreateTable
CREATE TABLE "pagamento" (
    "id" UUID NOT NULL,
    "agendamento_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "forma_pagamento" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAGO',
    "data_pagamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissao" (
    "id" UUID NOT NULL,
    "barbeiro_id" UUID NOT NULL,
    "agendamento_id" UUID NOT NULL,
    "valor_servico" DECIMAL(10,2) NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,
    "valor_comissao" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comissao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_agendamento_id_key" ON "pagamento"("agendamento_id");

-- CreateIndex
CREATE INDEX "pagamento_cliente_id_idx" ON "pagamento"("cliente_id");

-- CreateIndex
CREATE INDEX "pagamento_data_pagamento_idx" ON "pagamento"("data_pagamento");

-- CreateIndex
CREATE INDEX "pagamento_forma_pagamento_idx" ON "pagamento"("forma_pagamento");

-- CreateIndex
CREATE INDEX "pagamento_status_idx" ON "pagamento"("status");

-- CreateIndex
CREATE UNIQUE INDEX "comissao_agendamento_id_key" ON "comissao"("agendamento_id");

-- CreateIndex
CREATE INDEX "comissao_barbeiro_id_idx" ON "comissao"("barbeiro_id");

-- CreateIndex
CREATE INDEX "comissao_status_idx" ON "comissao"("status");

-- CreateIndex
CREATE INDEX "comissao_data_idx" ON "comissao"("data");

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao" ADD CONSTRAINT "comissao_barbeiro_id_fkey" FOREIGN KEY ("barbeiro_id") REFERENCES "barbeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao" ADD CONSTRAINT "comissao_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
