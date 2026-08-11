/* ไฟล์แนบของแต่ละรายการ
   ไม่มีคลังสื่อกลางแล้ว — อัปโหลดไฟล์แล้วผูกเข้ากับ solution/post/หน้า นั้น ๆ ทันที
   ผ่านตาราง Attachment (role = GALLERY | DOWNLOAD | POSTER | BROCHURE)
   พอไม่มีรายการไหนอ้างถึง ไฟล์จะถูกลบทั้งแถว Media และไฟล์บนดิสก์อัตโนมัติ
   ความปลอดภัย: ตรวจนามสกุล+mimetype+magic bytes, ไม่รับ SVG, บังคับดาวน์โหลดไฟล์ที่ไม่ใช่รูป,
   กัน path traversal */
import {
  BadRequestException, Body, Controller, DefaultValuePipe, Delete, Get, Injectable,
  Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Put, Query, Res,
  StreamableFile, UploadedFile, UseGuards, UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Type } from "class-transformer";
import {
  IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength,
} from "class-validator";
import { create as contentDisposition } from "content-disposition";
import type { Response } from "express";
import { diskStorage } from "multer";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { open, rm } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { JwtAuthGuard } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";

/* ================= ที่เก็บไฟล์ ================= */
export const UPLOAD_DIR = process.env.UPLOADS_DIR
  ? resolve(process.env.UPLOADS_DIR)
  : join(process.cwd(), "uploads");
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

/* ================= กติกาชนิดไฟล์ =================
   ตรวจ "นามสกุล" คู่กับ "mimetype" — เชื่อ mimetype อย่างเดียวไม่ได้ (client ปลอมได้)
   ไม่รับ SVG โดยเจตนา: ฝัง <script> ได้ → XSS ตอนเบราว์เซอร์เปิด inline */
const IMAGE_RULES: Record<string, string[]> = {
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
  ".gif": ["image/gif"],
};
const FILE_RULES: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".zip": ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
};
export const IMAGE_EXTS = new Set(Object.keys(IMAGE_RULES));
const MAX_IMAGE = 5 * 1024 * 1024; // 5 MB
const MAX_FILE = 20 * 1024 * 1024; // 20 MB

/** ลายเซ็นไบต์ต้นไฟล์ — กันเปลี่ยนนามสกุล/ปลอม mimetype (เช่น .exe เปลี่ยนชื่อเป็น .png) */
const MAGIC: Array<{ exts: string[]; sig: number[] }> = [
  { exts: [".jpg", ".jpeg"], sig: [0xff, 0xd8, 0xff] },
  { exts: [".png"], sig: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { exts: [".gif"], sig: [0x47, 0x49, 0x46, 0x38] },
  { exts: [".webp"], sig: [0x52, 0x49, 0x46, 0x46] }, // RIFF (เช็ค "WEBP" ที่ offset 8 เพิ่ม)
  { exts: [".pdf"], sig: [0x25, 0x50, 0x44, 0x46] },
  { exts: [".zip", ".docx", ".xlsx", ".pptx"], sig: [0x50, 0x4b, 0x03, 0x04] }, // Office ใหม่ = zip
  { exts: [".doc", ".xls", ".ppt"], sig: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE2
];

const extOf = (name: string) => extname(name || "").toLowerCase();
export const kindOfExt = (ext: string) => (IMAGE_EXTS.has(ext) ? "IMAGE" : "FILE");

/** multer เก็บ originalname เป็น latin1 — ชื่อไฟล์ภาษาไทยจะเพี้ยนถ้าไม่แปลง */
function decodeOriginalName(raw: string): string {
  const decoded = Buffer.from(raw, "latin1").toString("utf8");
  // ตัด path component ที่อาจแฝงมา + อักขระควบคุม (ชื่อนี้ถูกส่งกลับใน Content-Disposition)
  return decoded.replace(/[/\\]/g, "_").replace(/[\x00-\x1f\x7f]/g, "").slice(0, 200) || "file";
}

/** อ่านไบต์ต้นไฟล์แล้วเทียบลายเซ็นกับนามสกุล */
async function magicMatches(filePath: string, ext: string): Promise<boolean> {
  const rule = MAGIC.find((m) => m.exts.includes(ext));
  if (!rule) return true; // ไม่มีลายเซ็นให้เทียบ (ผ่าน allowlist มาแล้ว)
  const fh = await open(filePath, "r");
  try {
    const buf = Buffer.alloc(16);
    const { bytesRead } = await fh.read(buf, 0, 16, 0);
    if (bytesRead < rule.sig.length) return false;
    if (!rule.sig.every((b, i) => buf[i] === b)) return false;
    if (ext === ".webp") return buf.subarray(8, 12).toString("ascii") === "WEBP";
    return true;
  } finally {
    await fh.close();
  }
}

/** ประกอบ path ในโฟลเดอร์อัปโหลดอย่างปลอดภัย (กัน ../ หลุดออกนอกโฟลเดอร์) */
function safeUploadPath(storedName: string): string {
  const full = resolve(UPLOAD_DIR, storedName);
  if (full !== UPLOAD_DIR && !full.startsWith(UPLOAD_DIR + sep)) {
    throw new BadRequestException("path ไม่ถูกต้อง");
  }
  return full;
}

/* ================= DTOs ================= */
class MediaPatchDto {
  @IsOptional() @IsString() @MaxLength(300)
  altTh?: string;

  @IsOptional() @IsString() @MaxLength(300)
  altEn?: string;

  @IsOptional() @IsString() @MaxLength(200)
  filename?: string;
}

/** ข้อมูลปลายทางตอนอัปโหลดแนบเข้ารายการ (มากับ multipart จึงไม่มี mediaId) */
class AttachmentUploadDto {
  @IsIn(["SOLUTION", "POST", "PAGE"])
  ownerType!: string;

  @IsString() @IsNotEmpty() @MaxLength(120)
  ownerId!: string;

  @IsIn(["GALLERY", "DOWNLOAD", "POSTER", "BROCHURE"])
  role!: string;
}

class AttachmentCreateDto {
  @Type(() => Number) @IsInt()
  mediaId!: number;

  @IsIn(["SOLUTION", "POST", "PAGE"])
  ownerType!: string;

  @IsString() @IsNotEmpty() @MaxLength(120)
  ownerId!: string;

  @IsIn(["GALLERY", "DOWNLOAD", "POSTER", "BROCHURE"])
  role!: string;

  @IsOptional() @IsString() @MaxLength(300)
  captionTh?: string;

  @IsOptional() @IsString() @MaxLength(300)
  captionEn?: string;
}

class AttachmentPatchDto {
  @IsOptional() @IsString() @MaxLength(300)
  captionTh?: string;

  @IsOptional() @IsString() @MaxLength(300)
  captionEn?: string;
}

class ReorderDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  ids!: number[];
}

/* ================= Services ================= */
@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async update(id: number, dto: MediaPatchDto) {
    const found = await this.prisma.media.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("ไม่พบไฟล์");
    return this.prisma.media.update({ where: { id }, data: { ...dto } });
  }

  /** รับไฟล์ที่ multer วางลงดิสก์แล้ว ตรวจซ้ำอีกชั้น แล้วบันทึกเป็นแถว Media
   *  ใช้ร่วมกันทั้งอัปโหลดเดี่ยว (รูปปก/รูปในเนื้อหา) และอัปโหลดแนบเข้ารายการ */
  async saveUpload(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        "อัปโหลดไม่สำเร็จ — รับเฉพาะรูป (jpg, png, webp, gif) และเอกสาร (pdf, doc/docx, xls/xlsx, ppt/pptx, zip)",
      );
    }
    const ext = extOf(file.originalname);
    const kind = kindOfExt(ext);
    const stored = file.filename;
    const path = safeUploadPath(stored);
    const fail = async (msg: string) => {
      await rm(path, { force: true }).catch(() => undefined);
      throw new BadRequestException(msg);
    };

    if (kind === "IMAGE" && file.size > MAX_IMAGE) {
      await fail("ไฟล์รูปต้องไม่เกิน 5 MB");
    }
    if (!(await magicMatches(path, ext))) {
      await fail("เนื้อไฟล์ไม่ตรงกับนามสกุล — ไฟล์อาจถูกเปลี่ยนชื่อหรือเสียหาย");
    }

    return this.prisma.media.create({
      data: {
        filename: decodeOriginalName(file.originalname),
        storedName: stored,
        url: `/uploads/${stored}`,
        mime: file.mimetype,
        size: file.size,
        kind,
      },
    });
  }

  /** ลบทั้งแถวและไฟล์บนดิสก์ (attachment ที่อ้างถึงถูกลบตาม onDelete: Cascade) */
  async remove(id: number) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException("ไม่พบไฟล์");
    const stored = media.storedName ?? media.url.split("/").pop() ?? "";
    await this.prisma.media.delete({ where: { id } });
    if (stored) {
      // ลบไฟล์หลังลบแถวสำเร็จ — ถ้าไฟล์หายไปแล้วไม่ต้อง error
      await rm(safeUploadPath(stored), { force: true }).catch(() => undefined);
    }
    return { ok: true };
  }

  async getOrFail(id: number) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException("ไม่พบไฟล์");
    return media;
  }
}

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  listFor(ownerType: string, ownerId: string) {
    return this.prisma.attachment.findMany({
      where: { ownerType, ownerId },
      orderBy: [{ role: "asc" }, { order: "asc" }],
      include: { media: true },
    });
  }

  /** รวมไฟล์แนบของหลายรายการในคิวรีเดียว แล้วจัดกลุ่มตาม ownerId (กัน N+1) */
  async groupedForMany(ownerType: string, ownerIds: string[]) {
    const rows = ownerIds.length
      ? await this.prisma.attachment.findMany({
          where: { ownerType, ownerId: { in: ownerIds } },
          orderBy: [{ order: "asc" }],
          include: { media: true },
        })
      : [];
    const out = new Map<string, ReturnType<typeof shape>>();
    for (const id of ownerIds) {
      out.set(id, shape(rows.filter((r) => r.ownerId === id)));
    }
    return out;
  }

  async grouped(ownerType: string, ownerId: string) {
    return shape(await this.listFor(ownerType, ownerId));
  }

  async add(dto: AttachmentCreateDto) {
    const media = await this.prisma.media.findUnique({ where: { id: dto.mediaId } });
    if (!media) throw new NotFoundException("ไม่พบไฟล์ที่อ้างถึง");
    if (dto.role === "GALLERY" || dto.role === "POSTER" || dto.role === "BROCHURE") {
      if (media.kind !== "IMAGE") {
        throw new BadRequestException("แกลเลอรี poster และโบรชัว ต้องเป็นไฟล์รูปเท่านั้น");
      }
    }
    // poster มีได้ตัวเดียวต่อรายการ — ใส่ใหม่แทนที่ของเดิม (รูปเก่าต้องถูกลบทิ้งด้วย)
    if (dto.role === "POSTER") {
      const old = await this.prisma.attachment.findMany({
        where: { ownerType: dto.ownerType, ownerId: dto.ownerId, role: "POSTER" },
        select: { id: true, mediaId: true },
      });
      if (old.length) {
        await this.prisma.attachment.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
        for (const o of old) await this.dropOrphanMedia(o.mediaId);
      }
    }
    const last = await this.prisma.attachment.findFirst({
      where: { ownerType: dto.ownerType, ownerId: dto.ownerId, role: dto.role },
      orderBy: { order: "desc" },
    });
    return this.prisma.attachment.create({
      data: { ...dto, order: (last?.order ?? 0) + 1 },
      include: { media: true },
    });
  }

  async patch(id: number, dto: AttachmentPatchDto) {
    return this.prisma.attachment.update({ where: { id }, data: { ...dto }, include: { media: true } });
  }

  /** จัดลำดับใหม่ตามลำดับ id ที่ส่งมา */
  async reorder(ids: number[]) {
    await this.prisma.$transaction(
      ids.map((id, i) => this.prisma.attachment.update({ where: { id }, data: { order: i + 1 } })),
    );
    return { ok: true };
  }

  async remove(id: number) {
    const att = await this.prisma.attachment.findUnique({ where: { id } });
    if (!att) throw new NotFoundException("ไม่พบไฟล์แนบ");
    await this.prisma.attachment.delete({ where: { id } });
    await this.dropOrphanMedia(att.mediaId);
    return { ok: true };
  }

  /** ไฟล์ผูกกับรายการโดยตรง ไม่มีคลังกลางให้เก็บกวาดแล้ว
   *  พอไม่มีรายการไหนอ้างถึง ต้องลบทั้งแถว Media และไฟล์บนดิสก์ทิ้ง
   *  ไม่งั้นไฟล์จะค้างสะสมโดยไม่มีหน้าไหนมองเห็น */
  private async dropOrphanMedia(mediaId: number) {
    const left = await this.prisma.attachment.count({ where: { mediaId } });
    if (left > 0) return;
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return;
    const stored = media.storedName ?? media.url.split("/").pop() ?? "";
    await this.prisma.media.delete({ where: { id: mediaId } });
    if (stored) await rm(safeUploadPath(stored), { force: true }).catch(() => undefined);
  }
}

type AttachmentRow = {
  id: number; role: string; order: number;
  captionTh: string | null; captionEn: string | null;
  media: { id: number; url: string; filename: string; mime: string; size: number; kind: string; altTh: string | null; altEn: string | null };
};

/** แปลงแถว attachment เป็นรูปแบบที่หน้าเว็บใช้ */
function shape(rows: AttachmentRow[]) {
  const pickFields = (r: AttachmentRow) => ({
    id: r.id,
    mediaId: r.media.id,
    url: r.media.url,
    filename: r.media.filename,
    mime: r.media.mime,
    size: r.media.size,
    altTh: r.media.altTh,
    altEn: r.media.altEn,
    captionTh: r.captionTh,
    captionEn: r.captionEn,
    order: r.order,
  });
  const poster = rows.find((r) => r.role === "POSTER");
  return {
    poster: poster ? pickFields(poster) : null,
    gallery: rows.filter((r) => r.role === "GALLERY").map(pickFields),
    brochure: rows.filter((r) => r.role === "BROCHURE").map(pickFields),
    downloads: rows.filter((r) => r.role === "DOWNLOAD").map(pickFields),
  };
}

/* ตัวเลือกรับไฟล์อัปโหลด — ใช้ร่วมกันทั้งอัปโหลดเดี่ยวและอัปโหลดแนบเข้ารายการ */
const UPLOAD_OPTS = {
  storage: diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, name: string) => void) => {
      const ext = extOf(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: MAX_FILE, files: 1 },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) => {
    const ext = extOf(file.originalname);
    const rule = IMAGE_RULES[ext] ?? FILE_RULES[ext];
    // ต้องผ่านทั้งนามสกุลและ mimetype
    cb(null, !!rule && rule.includes(file.mimetype));
  },
};

/* ================= Controllers: admin ================= */
@UseGuards(JwtAuthGuard)
@Controller("admin/media")
export class AdminMediaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly service: MediaService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor("file", UPLOAD_OPTS))
  upload(@UploadedFile() file?: Express.Multer.File) {
    return this.service.saveUpload(file);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: MediaPatchDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller("admin/attachments")
export class AdminAttachmentsController {
  constructor(
    private readonly service: AttachmentsService,
    private readonly media: MediaService,
  ) {}

  @Get()
  list(@Query("ownerType") ownerType: string, @Query("ownerId") ownerId: string) {
    return this.service.listFor(ownerType, ownerId);
  }

  /** อัปโหลดแล้วแนบเข้ารายการในคำขอเดียว — ไม่มีคลังกลางให้เลือกไฟล์เก่าแล้ว
   *  ทำสองขั้นในคำขอเดียวเพื่อไม่ให้เหลือไฟล์ค้างเมื่อขั้นแนบล้มเหลว */
  @Post("upload")
  @UseInterceptors(FileInterceptor("file", UPLOAD_OPTS))
  async uploadAndAttach(
    @Body() dto: AttachmentUploadDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const media = await this.media.saveUpload(file);
    try {
      return await this.service.add({ ...dto, mediaId: media.id });
    } catch (e) {
      await this.media.remove(media.id).catch(() => undefined);
      throw e;
    }
  }

  @Post()
  add(@Body() dto: AttachmentCreateDto) {
    return this.service.add(dto);
  }

  @Put("reorder")
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorder(dto.ids);
  }

  @Patch(":id")
  patch(@Param("id", ParseIntPipe) id: number, @Body() dto: AttachmentPatchDto) {
    return this.service.patch(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

/* ================= Controller: public ================= */
@Controller("media")
export class PublicMediaController {
  constructor(private readonly service: MediaService) {}

  /** ดาวน์โหลดโดยใช้ชื่อไฟล์เดิม + บังคับให้เบราว์เซอร์ดาวน์โหลด ไม่เปิด inline */
  @Get(":id/download")
  async download(@Param("id", ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
    const media = await this.service.getOrFail(id);
    const stored = media.storedName ?? media.url.split("/").pop() ?? "";
    const path = safeUploadPath(stored);
    if (!existsSync(path)) throw new NotFoundException("ไฟล์หายไปจากเซิร์ฟเวอร์");
    res.setHeader("Content-Type", media.mime);
    res.setHeader("Content-Length", String(media.size));
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", contentDisposition(media.filename));
    return new StreamableFile(createReadStream(path));
  }
}

@Module({
  providers: [MediaService, AttachmentsService],
  controllers: [
    AdminMediaController,
    AdminAttachmentsController,
    PublicMediaController,
  ],
  exports: [AttachmentsService, MediaService],
})
export class MediaModule {}
