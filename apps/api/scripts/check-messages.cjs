/* dev util: ดูข้อความจากฟอร์มติดต่อใน DB — node scripts/check-messages.cjs */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

prisma.contactMessage
  .findMany({ orderBy: { createdAt: "desc" } })
  .then((rows) => {
    console.log(JSON.stringify(rows, null, 2));
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
