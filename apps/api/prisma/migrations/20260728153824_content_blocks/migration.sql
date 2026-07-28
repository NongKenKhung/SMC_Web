-- CreateTable
CREATE TABLE "Block" (
    "id" SERIAL NOT NULL,
    "group" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    "titleTh" TEXT NOT NULL,
    "titleEn" TEXT,
    "subtitleTh" TEXT,
    "subtitleEn" TEXT,
    "bodyTh" TEXT,
    "bodyEn" TEXT,
    "image" TEXT,
    "meta" TEXT,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Block_group_order_idx" ON "Block"("group", "order");
