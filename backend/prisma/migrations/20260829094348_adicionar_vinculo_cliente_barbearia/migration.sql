-- DropIndex
DROP INDEX "clientes_ativo_idx";

-- CreateTable
CREATE TABLE "clientes_barbearias" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "barbearia_id" UUID NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_barbearias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clientes_barbearias_cliente_id_idx" ON "clientes_barbearias"("cliente_id");

-- CreateIndex
CREATE INDEX "clientes_barbearias_barbearia_id_idx" ON "clientes_barbearias"("barbearia_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_barbearias_cliente_id_barbearia_id_key" ON "clientes_barbearias"("cliente_id", "barbearia_id");

-- AddForeignKey
ALTER TABLE "clientes_barbearias" ADD CONSTRAINT "clientes_barbearias_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes_barbearias" ADD CONSTRAINT "clientes_barbearias_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
