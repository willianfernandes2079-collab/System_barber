-- Reconciliação de estruturas que já existem no banco PostgreSQL.
-- Esta migration será marcada como aplicada e não será executada
-- no banco atual.

CREATE TABLE "Caixa" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "cliente_id" UUID,
    "barbeiro_id" UUID,
    "estoque_id" UUID,
    "servico_id" UUID,
    "plano_id" UUID,
    "quantidade" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "forma_pagamento" TEXT NOT NULL,
    "valor_entregue" DECIMAL(10,2),
    "troco" DECIMAL(10,2),
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caixa_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ValorCorte" (
    "id" UUID NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    "servicos_id" UUID NOT NULL,

    CONSTRAINT "ValorCorte_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bloqueios_agenda" (
    "id" UUID NOT NULL,
    "barbeiro_id" UUID,
    "data" DATE NOT NULL,
    "horario_inicio" TIMESTAMP(3),
    "horario_fim" TIMESTAMP(3),
    "motivo" TEXT NOT NULL,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloqueios_agenda_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Caixa_barbeiro_id_idx" ON "Caixa"("barbeiro_id");
CREATE INDEX "Caixa_cliente_id_idx" ON "Caixa"("cliente_id");
CREATE INDEX "Caixa_estoque_id_idx" ON "Caixa"("estoque_id");
CREATE INDEX "Caixa_plano_id_idx" ON "Caixa"("plano_id");
CREATE INDEX "Caixa_servico_id_idx" ON "Caixa"("servico_id");

CREATE INDEX "bloqueios_agenda_ativo_idx" ON "bloqueios_agenda"("ativo");
CREATE INDEX "bloqueios_agenda_barbeiro_id_idx" ON "bloqueios_agenda"("barbeiro_id");
CREATE INDEX "bloqueios_agenda_data_idx" ON "bloqueios_agenda"("data");

ALTER TABLE "Caixa"
ADD CONSTRAINT "Caixa_barbeiro_id_fkey"
FOREIGN KEY ("barbeiro_id") REFERENCES "barbeiros"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Caixa"
ADD CONSTRAINT "Caixa_cliente_id_fkey"
FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Caixa"
ADD CONSTRAINT "Caixa_estoque_id_fkey"
FOREIGN KEY ("estoque_id") REFERENCES "estoque"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Caixa"
ADD CONSTRAINT "Caixa_plano_id_fkey"
FOREIGN KEY ("plano_id") REFERENCES "Plano"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Caixa"
ADD CONSTRAINT "Caixa_servico_id_fkey"
FOREIGN KEY ("servico_id") REFERENCES "servicos"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Caixa"
ADD CONSTRAINT "Caixa_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ValorCorte"
ADD CONSTRAINT "ValorCorte_servicos_id_fkey"
FOREIGN KEY ("servicos_id") REFERENCES "servicos"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bloqueios_agenda"
ADD CONSTRAINT "bloqueios_agenda_barbeiro_id_fkey"
FOREIGN KEY ("barbeiro_id") REFERENCES "barbeiros"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
