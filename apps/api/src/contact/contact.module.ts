import {
  BadRequestException, Body, Controller, Injectable, Ip, Module, Post,
} from "@nestjs/common";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { MailerService } from "../common/mailer";
import { PrismaService } from "../prisma/prisma.module";

export class CreateContactDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @IsOptional() @IsString() @MaxLength(160)
  org?: string;

  @IsEmail()
  email!: string;

  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(120)
  topic?: string;

  @IsString() @IsNotEmpty() @MaxLength(4000)
  message!: string;

  /** กับดักบอท — ช่องนี้ถูกซ่อนจากคนจริง ถ้ามีค่ามาแปลว่าเป็นบอทกรอกอัตโนมัติ
   *  ต้องเป็น optional เพราะคนจริงจะไม่ส่งค่านี้มาเลย */
  @IsOptional() @IsString() @MaxLength(200)
  website?: string;
}

/** จำกัดจำนวนครั้งที่ส่งได้ต่อ IP — เก็บในหน่วยความจำ พอสำหรับเซิร์ฟเวอร์ตัวเดียว
 *  (ถ้าขยายเป็นหลายเครื่องค่อยย้ายไป Redis) */
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 นาที
const RATE_MAX = 5;
const hits = new Map<string, number[]>();

function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  /* กันหน่วยความจำบวม — ล้าง IP ที่เงียบไปแล้วเมื่อ map เริ่มใหญ่ */
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > RATE_MAX;
}

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  /** เก็บข้อความลงฐานข้อมูล แล้วแจ้งเตือนทางอีเมล
   *  อีเมลส่งไม่ผ่านก็ยังถือว่าสำเร็จ — ข้อความอยู่ในระบบแล้ว ดูได้ที่ /admin/messages */
  async create(dto: CreateContactDto, ip: string) {
    if (dto.website) {
      /* บอทกรอกช่องกับดัก — ตอบเหมือนสำเร็จเพื่อไม่ให้รู้ตัว แต่ไม่บันทึกอะไร */
      return { ok: true };
    }
    if (tooMany(ip)) {
      throw new BadRequestException("ส่งข้อความถี่เกินไป กรุณารอสักครู่แล้วลองใหม่");
    }

    const { website: _ignored, ...data } = dto;
    const saved = await this.prisma.contactMessage.create({ data });

    const to = process.env.CONTACT_NOTIFY_TO;
    if (to) {
      await this.mailer.send({
        to,
        replyTo: saved.email, // กด "ตอบกลับ" ในเมลแล้วไปหาผู้ส่งเลย
        subject: `[SMC] ข้อความใหม่จาก ${saved.name}${saved.topic ? ` — ${saved.topic}` : ""}`,
        text: [
          `ชื่อ: ${saved.name}`,
          `หน่วยงาน: ${saved.org ?? "-"}`,
          `อีเมล: ${saved.email}`,
          `โทร: ${saved.phone ?? "-"}`,
          `เรื่อง: ${saved.topic ?? "-"}`,
          "",
          saved.message,
          "",
          "— ส่งจากฟอร์มติดต่อในเว็บไซต์ศูนย์วิจัยเมืองอัจฉริยะ",
        ].join("\n"),
      });
    }

    return { ok: true, id: saved.id };
  }
}

@Controller("contact")
export class ContactController {
  constructor(private readonly service: ContactService) {}

  @Post()
  create(@Body() dto: CreateContactDto, @Ip() ip: string) {
    return this.service.create(dto, ip || "unknown");
  }
}

@Module({
  providers: [ContactService, MailerService],
  controllers: [ContactController],
})
export class ContactModule {}
