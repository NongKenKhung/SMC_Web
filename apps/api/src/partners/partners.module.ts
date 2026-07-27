import { Controller, Get, Injectable, Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.partner.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    });
  }
}

@Controller("partners")
export class PartnersController {
  constructor(private readonly service: PartnersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}

@Module({
  providers: [PartnersService],
  controllers: [PartnersController],
})
export class PartnersModule {}
