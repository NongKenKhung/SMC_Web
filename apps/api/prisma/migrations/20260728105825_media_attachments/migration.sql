-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "altEn" TEXT,
ADD COLUMN     "altTh" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "storedName" TEXT,
ADD COLUMN     "width" INTEGER;

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "captionTh" TEXT,
    "captionEn" TEXT,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_ownerType_ownerId_role_order_idx" ON "Attachment"("ownerType", "ownerId", "role", "order");

-- CreateIndex
CREATE INDEX "Media_kind_createdAt_idx" ON "Media"("kind", "createdAt");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
