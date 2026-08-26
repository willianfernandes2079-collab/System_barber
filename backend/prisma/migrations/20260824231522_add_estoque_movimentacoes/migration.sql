-- CreateTable
CREATE TABLE "estoque" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "quantidade_minima" INTEGER NOT NULL DEFAULT 0,
    "unidade" TEXT NOT NULL DEFAULT 'UN',
    "preco_custo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "preco_venda" DECIMAL(10,2),
    "fornecedor" TEXT,
    "codigo_barras" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" UUID NOT NULL,
    "estoque_id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "quantidade_anterior" INTEGER NOT NULL,
    "quantidade_nova" INTEGER NOT NULL,
    "valor_unitario" DECIMAL(10,2),
    "motivo" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "estoque_nome_idx" ON "estoque"("nome");

-- CreateIndex
CREATE INDEX "estoque_categoria_idx" ON "estoque"("categoria");

-- CreateIndex
CREATE INDEX "estoque_ativo_idx" ON "estoque"("ativo");

-- CreateIndex
CREATE INDEX "estoque_codigo_barras_idx" ON "estoque"("codigo_barras");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_estoque_id_idx" ON "movimentacoes_estoque"("estoque_id");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_tipo_idx" ON "movimentacoes_estoque"("tipo");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_created_at_idx" ON "movimentacoes_estoque"("created_at");

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_estoque_id_fkey" FOREIGN KEY ("estoque_id") REFERENCES "estoque"("id") ON DELETE CASCADE ON UPDATE CASCADE;
