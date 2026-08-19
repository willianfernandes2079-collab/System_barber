-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "data_nascimento" TIMESTAMP(3),
    "cpf" TEXT,
    "observacoes" TEXT,
    "preferencia_barbeiro" TEXT,
    "preferencia_servico" TEXT,
    "ultimo_atendimento" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clientes_nome_idx" ON "clientes"("nome");

-- CreateIndex
CREATE INDEX "clientes_telefone_idx" ON "clientes"("telefone");

-- CreateIndex
CREATE INDEX "clientes_email_idx" ON "clientes"("email");
