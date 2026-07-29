import {
  BadRequestException, Body, CanActivate, Controller, ExecutionContext, Get, Injectable,
  Module, Post, Req, UnauthorizedException, UseGuards,
} from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { IsEmail, IsString, MinLength } from "class-validator";
import { PrismaService } from "../prisma/prisma.module";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString() @MinLength(6)
  password!: string;
}

export class ChangePasswordDto {
  @IsString() @MinLength(1)
  currentPassword!: string;

  /* 10 ตัวขึ้นไป — ยาวกว่าตอน login เพราะนี่คือรหัสที่จะใช้จริงหลังเลิกใช้ค่าเริ่มต้น */
  @IsString() @MinLength(10, { message: "รหัสผ่านใหม่ต้องยาวอย่างน้อย 10 ตัวอักษร" })
  newPassword!: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: string;
}

/** Guard ตรวจ Bearer token — ใช้ครอบทุก endpoint ฝั่ง admin */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers["authorization"];
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException("ต้องเข้าสู่ระบบก่อน");
    try {
      req.user = await this.jwt.verifyAsync<JwtPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException("token ไม่ถูกต้องหรือหมดอายุ");
    }
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
    const payload: JwtPayload = {
      sub: user.id, email: user.email, name: user.name, role: user.role,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: payload,
    };
  }

  /** เปลี่ยนรหัสผ่านของตัวเอง — ต้องยืนยันรหัสเดิมก่อนเสมอ
   *  (กันกรณีมีคนมานั่งที่เครื่องที่เปิด admin ค้างไว้แล้วเปลี่ยนรหัสยึดบัญชี) */
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("ไม่พบบัญชีผู้ใช้");
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException("รหัสผ่านปัจจุบันไม่ถูกต้อง");
    }
    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new BadRequestException("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม");
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
    /* token เดิมยังใช้ได้จนหมดอายุ — ฝั่งหน้าเว็บจะให้เข้าสู่ระบบใหม่เอง */
    return { ok: true };
  }
}

@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: { user: JwtPayload }) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  changePassword(@Req() req: { user: JwtPayload }, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(req.user.sub, dto);
  }
}

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? "sml-dev-secret",
      signOptions: { expiresIn: "12h" },
    }),
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
