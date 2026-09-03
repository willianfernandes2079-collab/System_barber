-- CreateTable
CREATE TABLE "movimentacoes_financeiras" (
    "id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "forma_pagamento" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMADA',
    "observacoes" TEXT,
    "usuario_id" UUID,
    "cliente_id" UUID,
    "barbeiro_id" UUID,
    "pagamento_id" UUID,
    "barbearia_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimentacoes_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_fiscais" (
    "id" UUID NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "inscricao_municipal" TEXT,
    "inscricao_estadual" TEXT,
    "regime_tributario" TEXT,
    "codigo_municipio" TEXT,
    "municipio" TEXT,
    "uf" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cep" TEXT,
    "ambiente" TEXT NOT NULL DEFAULT 'HOMOLOGACAO',
    "habilitado" BOOLEAN NOT NULL DEFAULT false,
    "barbearia_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "movimentacoes_financeiras_pagamento_id_key" ON "movimentacoes_financeiras"("pagamento_id");

-- CreateIndex
CREATE INDEX "movimentacoes_financeiras_barbearia_id_idx" ON "movimentacoes_financeiras"("barbearia_id");

-- CreateIndex
CREATE INDEX "movimentacoes_financeiras_tipo_idx" ON "movimentacoes_financeiras"("tipo");

-- CreateIndex
CREATE INDEX "movimentacoes_financeiras_categoria_idx" ON "movimentacoes_financeiras"("categoria");

-- CreateIndex
CREATE INDEX "movimentacoes_financeiras_data_idx" ON "movimentacoes_financeiras"("data");

-- CreateIndex
CREATE INDEX "movimentacoes_financeiras_status_idx" ON "movimentacoes_financeiras"("status");

-- CreateIndex
CREATE INDEX "movimentacoes_financeiras_cliente_id_idx" ON "movimentacoes_financeiras"("cliente_id");

-- CreateIndex
CREATE INDEX "movimentacoes_financeiras_barbeiro_id_idx" ON "movimentacoes_financeiras"("barbeiro_id");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_fiscais_barbearia_id_key" ON "configuracoes_fiscais"("barbearia_id");

-- AddForeignKey
ALTER TABLE "movimentacoes_financeiras" ADD CONSTRAINT "movimentacoes_financeiras_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_financeiras" ADD CONSTRAINT "movimentacoes_financeiras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_financeiras" ADD CONSTRAINT "movimentacoes_financeiras_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_financeiras" ADD CONSTRAINT "movimentacoes_financeiras_barbeiro_id_fkey" FOREIGN KEY ("barbeiro_id") REFERENCES "barbeiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_financeiras" ADD CONSTRAINT "movimentacoes_financeiras_pagamento_id_fkey" FOREIGN KEY ("pagamento_id") REFERENCES "pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_fiscais" ADD CONSTRAINT "configuracoes_fiscais_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
