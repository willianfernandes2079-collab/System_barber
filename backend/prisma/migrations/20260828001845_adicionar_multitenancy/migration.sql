-- Adiciona a estrutura inicial de multi-barbeira.
-- Os campos permanecem nullable nesta primeira etapa para permitir
-- a migração segura dos dados existentes.

-- CreateTable
CREATE TABLE "barbearias" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbearias_pkey" PRIMARY KEY ("id")
);

-- Insere a barbearia correspondente aos dados existentes.
INSERT INTO "barbearias" ("id", "nome", "ativo", "updated_at")
VALUES ('9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c', 'Sys', true, CURRENT_TIMESTAMP);

-- Adiciona barbearia_id às tabelas existentes.
ALTER TABLE "usuarios" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "clientes" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "barbeiros" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "agendamentos" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "servicos" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "configuracoes" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "Plano" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "AssinaturaPlano" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "estoque" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "movimentacoes_estoque" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "comissao" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "pagamento" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "ValorCorte" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "bloqueios_agenda" ADD COLUMN "barbearia_id" UUID;
ALTER TABLE "Caixa" ADD COLUMN "barbearia_id" UUID;

-- Vincula todos os registros existentes à Barbearia Sys.
UPDATE "usuarios"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "clientes"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "barbeiros"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "agendamentos"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "servicos"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "configuracoes"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "Plano"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "AssinaturaPlano"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "estoque"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "movimentacoes_estoque"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "comissao"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "pagamento"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "ValorCorte"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "bloqueios_agenda"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

UPDATE "Caixa"
SET "barbearia_id" = '9c1d6e32-6d25-4d4d-9f58-8f1fb4e70a1c';

-- Índices
CREATE INDEX "usuarios_barbearia_id_idx" ON "usuarios"("barbearia_id");
CREATE INDEX "clientes_barbearia_id_idx" ON "clientes"("barbearia_id");
CREATE INDEX "barbeiros_barbearia_id_idx" ON "barbeiros"("barbearia_id");
CREATE INDEX "agendamentos_barbearia_id_idx" ON "agendamentos"("barbearia_id");
CREATE INDEX "servicos_barbearia_id_idx" ON "servicos"("barbearia_id");
CREATE UNIQUE INDEX "configuracoes_barbearia_id_key" ON "configuracoes"("barbearia_id");
CREATE INDEX "Plano_barbearia_id_idx" ON "Plano"("barbearia_id");
CREATE INDEX "AssinaturaPlano_barbearia_id_idx" ON "AssinaturaPlano"("barbearia_id");
CREATE INDEX "estoque_barbearia_id_idx" ON "estoque"("barbearia_id");
CREATE INDEX "movimentacoes_estoque_barbearia_id_idx" ON "movimentacoes_estoque"("barbearia_id");
CREATE INDEX "comissao_barbearia_id_idx" ON "comissao"("barbearia_id");
CREATE INDEX "pagamento_barbearia_id_idx" ON "pagamento"("barbearia_id");
CREATE INDEX "ValorCorte_barbearia_id_idx" ON "ValorCorte"("barbearia_id");
CREATE INDEX "bloqueios_agenda_barbearia_id_idx" ON "bloqueios_agenda"("barbearia_id");
CREATE INDEX "Caixa_barbearia_id_idx" ON "Caixa"("barbearia_id");

-- Foreign Keys
ALTER TABLE "usuarios"
ADD CONSTRAINT "usuarios_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "clientes"
ADD CONSTRAINT "clientes_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "barbeiros"
ADD CONSTRAINT "barbeiros_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agendamentos"
ADD CONSTRAINT "agendamentos_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "servicos"
ADD CONSTRAINT "servicos_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "configuracoes"
ADD CONSTRAINT "configuracoes_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Plano"
ADD CONSTRAINT "Plano_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssinaturaPlano"
ADD CONSTRAINT "AssinaturaPlano_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "estoque"
ADD CONSTRAINT "estoque_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "movimentacoes_estoque"
ADD CONSTRAINT "movimentacoes_estoque_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comissao"
ADD CONSTRAINT "comissao_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pagamento"
ADD CONSTRAINT "pagamento_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ValorCorte"
ADD CONSTRAINT "ValorCorte_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bloqueios_agenda"
ADD CONSTRAINT "bloqueios_agenda_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Caixa"
ADD CONSTRAINT "Caixa_barbearia_id_fkey"
FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

