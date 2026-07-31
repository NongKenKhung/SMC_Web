import {
  BadRequestException, Body, CanActivate, Controller, Delete, ExecutionContext, Get, Injectable,
  Module, NotFoundException, Param, ParseIntPipe, Post, Req, UnauthorizedException, UseGuards,
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

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString() @MinLength(1, { message: "ต้องใส่ชื่อผู้ใช้" })
  name!: string;

  @IsString() @MinLength(10, { message: "รหัสผ่านต้องยาวอย่างน้อย 10 ตัวอักษร" })
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

  /* ---------- จัดการผู้ใช้ ---------- */

  listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { id: "asc" },
    });
  }

  async createUser(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException("มีผู้ใช้อีเมลนี้อยู่แล้ว");
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: "ADMIN",
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return user;
  }

  /** ลบผู้ใช้ — กันสองกรณีที่จะทำให้เข้าระบบไม่ได้อีก:
   *  ลบตัวเอง (ยังใช้งานอยู่) และลบคนสุดท้ายที่เหลือ */
  async removeUser(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new BadRequestException("ลบบัญชีที่กำลังใช้งานอยู่ไม่ได้ — ให้ผู้ดูแลคนอื่นลบให้");
    }
    const total = await this.prisma.user.count();
    if (total <= 1) throw new BadRequestException("ต้องเหลือผู้ดูแลอย่างน้อย 1 คน");
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("ไม่พบผู้ใช้");
    await this.prisma.user.delete({ where: { id } });
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

/** จัดการผู้ดูแลระบบ — ต้องเข้าสู่ระบบก่อนทุก endpoint */
@UseGuards(JwtAuthGuard)
@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly service: AuthService) {}

  @Get()
  list() {
    return this.service.listUsers();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.createUser(dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number, @Req() req: { user: JwtPayload }) {
    return this.service.removeUser(id, req.user.sub);
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
  controllers: [AuthController, AdminUsersController],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
