/*
  Warnings:

  - You are about to alter the column `cpf` on the `clientes` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(14)`.
  - A unique constraint covering the columns `[cpf]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "clientes" ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(14);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_key" ON "clientes"("cpf");
