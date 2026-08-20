-- CreateTable
CREATE TABLE "configuracoes" (
    "id" UUID NOT NULL,
    "nome_barbearia" TEXT NOT NULL,
    "telefone" TEXT,
    "endereco" TEXT,
    "horario_abertura" TEXT,
    "horario_fechamento" TEXT,
    "dias_funcionamento" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);
