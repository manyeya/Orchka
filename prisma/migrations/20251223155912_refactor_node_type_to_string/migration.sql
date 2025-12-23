/*
  Warnings:

  - Changed the type of `type` on the `node` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "node" ALTER COLUMN "type" TYPE TEXT USING "type"::text;

-- DropEnum
DROP TYPE "NodeType";
