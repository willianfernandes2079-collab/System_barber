-- AlterTable
ALTER TABLE "sessoes" ADD COLUMN     "barbearia_id" UUID;

-- CreateIndex
CREATE INDEX "sessoes_barbearia_id_idx" ON "sessoes"("barbearia_id");

-- AddForeignKey
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "barbearias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
