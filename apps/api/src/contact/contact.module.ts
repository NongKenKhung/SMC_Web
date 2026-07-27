import { Body, Controller, Injectable, Module, Post } from "@nestjs/common";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
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
}

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  /** เฟส 1: เก็บลง DB ก่อน — เฟส 2 จะต่อ Nodemailer ส่งเข้าอีเมลแลป + กันสแปม */
  async create(dto: CreateContactDto) {
    const saved = await this.prisma.contactMessage.create({ data: dto });
    return { ok: true, id: saved.id };
  }
}

@Controller("contact")
export class ContactController {
  constructor(private readonly service: ContactService) {}

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.service.create(dto);
  }
}

@Module({
  providers: [ContactService],
  controllers: [ContactController],
})
export class ContactModule {}
