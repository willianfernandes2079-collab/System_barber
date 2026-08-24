/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `barbeiros` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "barbeiros" ADD COLUMN     "cpf" VARCHAR(14),
ADD COLUMN     "data_nascimento" TIMESTAMP(3),
ADD COLUMN     "pix_chave" TEXT,
ADD COLUMN     "pix_tipo" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "barbeiros_cpf_key" ON "barbeiros"("cpf");

-- CreateIndex
CREATE INDEX "barbeiros_cpf_idx" ON "barbeiros"("cpf");

-- CreateIndex
CREATE INDEX "barbeiros_pix_tipo_idx" ON "barbeiros"("pix_tipo");
