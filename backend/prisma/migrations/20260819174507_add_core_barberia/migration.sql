-- CreateTable
CREATE TABLE "barbeiros" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "especialidade" TEXT,
    "percentual_comissao" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "duracao" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "percentual_comissao" DECIMAL(5,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "barbeiro_id" UUID NOT NULL,
    "servico_id" UUID NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horario_inicio" TIMESTAMP(3) NOT NULL,
    "horario_fim" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADO',
    "observacoes" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "forma_pagamento" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "barbeiros_usuario_id_key" ON "barbeiros"("usuario_id");

-- CreateIndex
CREATE INDEX "barbeiros_nome_idx" ON "barbeiros"("nome");

-- CreateIndex
CREATE INDEX "barbeiros_ativo_idx" ON "barbeiros"("ativo");

-- CreateIndex
CREATE INDEX "servicos_nome_idx" ON "servicos"("nome");

-- CreateIndex
CREATE INDEX "servicos_ativo_idx" ON "servicos"("ativo");

-- CreateIndex
CREATE INDEX "agendamentos_cliente_id_idx" ON "agendamentos"("cliente_id");

-- CreateIndex
CREATE INDEX "agendamentos_barbeiro_id_idx" ON "agendamentos"("barbeiro_id");

-- CreateIndex
CREATE INDEX "agendamentos_servico_id_idx" ON "agendamentos"("servico_id");

-- CreateIndex
CREATE INDEX "agendamentos_data_idx" ON "agendamentos"("data");

-- CreateIndex
CREATE INDEX "agendamentos_status_idx" ON "agendamentos"("status");

-- CreateIndex
CREATE INDEX "agendamentos_barbeiro_id_data_idx" ON "agendamentos"("barbeiro_id", "data");

-- CreateIndex
CREATE INDEX "clientes_ativo_idx" ON "clientes"("ativo");

-- CreateIndex
CREATE INDEX "sessoes_usuario_id_idx" ON "sessoes"("usuario_id");

-- CreateIndex
CREATE INDEX "sessoes_expires_at_idx" ON "sessoes"("expires_at");

-- AddForeignKey
ALTER TABLE "barbeiros" ADD CONSTRAINT "barbeiros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_barbeiro_id_fkey" FOREIGN KEY ("barbeiro_id") REFERENCES "barbeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
