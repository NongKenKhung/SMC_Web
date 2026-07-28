/* Block = รายการเนื้อหาซ้ำ ๆ ที่แก้ผ่าน admin ได้ (Phase 6B)
   ใช้ตารางเดียวร่วมกันทุกชุด แยกด้วย group เช่น
     home.pillars              — 3 บทบาทของศูนย์วิจัย
     home.techs                — เทคโนโลยีหลัก (accordion)
     about.timeline            — เส้นทางของศูนย์วิจัย
     about.story               — ย่อหน้าความเป็นมา
     solution.features:<id>    — ฟีเจอร์ของ solution แต่ละตัว */
import {
  BadRequestException, Body, Controller, Delete, Get, Injectable, Module,
  NotFoundException, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards,
} from "@nestjs/common";
import { Type } from "class-transformer";
import {
  IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength,
} from "class-validator";
import { JwtAuthGuard } from "../auth/auth.module";
import { cleanHtmlFields, cleanInternalUrl } from "../common/sanitize";
import { PrismaService } from "../prisma/prisma.module";

/** field ที่รับ HTML จาก editor — ต้อง sanitize ทุกครั้งก่อนบันทึก */
const HTML_FIELDS = ["bodyTh", "bodyEn"] as const;

class BlockDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  group!: string;

  @IsString() @IsNotEmpty() @MaxLength(300)
  titleTh!: string;

  @IsOptional() @IsString() @MaxLength(300)
  titleEn?: string;

  @IsOptional() @IsString() @MaxLength(300)
  subtitleTh?: string;

  @IsOptional() @IsString() @MaxLength(300)
  subtitleEn?: string;

  @IsOptional() @IsString()
  bodyTh?: string;

  @IsOptional() @IsString()
  bodyEn?: string;

  @IsOptional() @IsString() @MaxLength(120)
  icon?: string;

  @IsOptional() @IsString() @MaxLength(300)
  image?: string;

  @IsOptional() @IsString()
  meta?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  order?: number;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

class BlockPatchDto extends BlockDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  declare group: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(300)
  declare titleTh: string;
}

class ReorderDto {
  @IsArray() @Type(() => Number) @IsInt({ each: true })
  ids!: number[];
}

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  /** ดึงหลายกลุ่มในคิวรีเดียว แล้วจัดกลุ่มให้ — หน้าแรกใช้ 2 กลุ่มพร้อมกัน */
  async byGroups(groups: string[], onlyPublished = true) {
    const rows = groups.length
      ? await this.prisma.block.findMany({
          where: { group: { in: groups }, ...(onlyPublished ? { published: true } : {}) },
          orderBy: [{ group: "asc" }, { order: "asc" }],
        })
      : [];
    const out: Record<string, typeof rows> = {};
    for (const g of groups) out[g] = rows.filter((r) => r.group === g);
    return out;
  }

  listAll(group?: string) {
    return this.prisma.block.findMany({
      where: group ? { group } : {},
      orderBy: [{ group: "asc" }, { order: "asc" }],
    });
  }

  /** ทำความสะอาดทุก field ที่ผู้ใช้ส่งมา (HTML + URL รูป) */
  private clean<T extends { image?: string }>(dto: T) {
    const out = cleanHtmlFields(dto, HTML_FIELDS as unknown as (keyof T & string)[]);
    if (out.image !== undefined) out.image = cleanInternalUrl(out.image);
    return out;
  }

  async create(dto: BlockDto) {
    const data = this.clean(dto);
    const last = await this.prisma.block.findFirst({
      where: { group: dto.group },
      orderBy: { order: "desc" },
    });
    return this.prisma.block.create({
      data: { ...data, order: data.order ?? (last?.order ?? 0) + 1 },
    });
  }

  async update(id: number, dto: BlockPatchDto) {
    const found = await this.prisma.block.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("ไม่พบรายการ");
    return this.prisma.block.update({ where: { id }, data: this.clean(dto) });
  }

  async reorder(ids: number[]) {
    await this.prisma.$transaction(
      ids.map((id, i) => this.prisma.block.update({ where: { id }, data: { order: i + 1 } })),
    );
    return { ok: true };
  }

  async remove(id: number) {
    await this.prisma.block.delete({ where: { id } });
    return { ok: true };
  }
}

/* ---------- public ---------- */
@Controller("blocks")
export class BlocksController {
  constructor(private readonly service: BlocksService) {}

  /** GET /api/blocks?groups=home.pillars,home.techs
   *  endpoint นี้เปิดสาธารณะ — จำกัดจำนวนกลุ่มและรูปแบบชื่อ กันยิงคิวรีขนาดใหญ่ */
  @Get()
  byGroups(@Query("groups") groups?: string) {
    const list = (groups ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length > 20) {
      throw new BadRequestException("ขอได้ไม่เกิน 20 กลุ่มต่อครั้ง");
    }
    const valid = list.filter((g) => /^[a-z][a-z0-9]*(\.[a-z0-9]+)*(:\d+)?$/i.test(g));
    return this.service.byGroups(valid);
  }
}

/* ---------- admin ---------- */
@UseGuards(JwtAuthGuard)
@Controller("admin/blocks")
export class AdminBlocksController {
  constructor(private readonly service: BlocksService) {}

  @Get()
  list(@Query("group") group?: string) {
    return this.service.listAll(group);
  }

  @Post()
  create(@Body() dto: BlockDto) {
    return this.service.create(dto);
  }

  @Put("reorder")
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorder(dto.ids);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: BlockPatchDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

@Module({
  providers: [BlocksService],
  controllers: [BlocksController, AdminBlocksController],
  exports: [BlocksService],
})
export class BlocksModule {}
