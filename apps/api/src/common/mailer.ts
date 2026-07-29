/* ส่งอีเมลผ่าน SMTP — ตั้งค่าใน .env
   ถ้ายังไม่ตั้งค่า ระบบจะข้ามการส่งไปเฉย ๆ (บันทึก log ไว้) ไม่ทำให้ฟอร์มพัง */
import { Injectable, Logger } from "@nestjs/common";
import { createTransport, type Transporter } from "nodemailer";

@Injectable()
export class MailerService {
  private readonly log = new Logger("Mailer");
  private transporter: Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      this.log.warn("ยังไม่ได้ตั้งค่า SMTP — ข้อความจากฟอร์มจะเก็บลงฐานข้อมูลอย่างเดียว ไม่ส่งอีเมล");
      return;
    }
    const port = Number(process.env.SMTP_PORT ?? 587);
    this.transporter = createTransport({
      host,
      port,
      secure: port === 465, // 465 = TLS ตั้งแต่เชื่อมต่อ, 587 = STARTTLS
      auth: { user, pass },
    });
  }

  get enabled() {
    return this.transporter !== null;
  }

  /** ส่งอีเมล — คืน true เมื่อส่งสำเร็จ
   *  ไม่โยน error ออกไป เพราะผู้ส่งฟอร์มไม่ควรเห็นข้อผิดพลาดของระบบเมล
   *  (ข้อความถูกบันทึกลงฐานข้อมูลไปแล้ว) */
  async send(opts: { to: string; subject: string; text: string; replyTo?: string }) {
    if (!this.transporter) return false;
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        replyTo: opts.replyTo,
      });
      return true;
    } catch (e) {
      this.log.error(`ส่งอีเมลไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    }
  }
}
