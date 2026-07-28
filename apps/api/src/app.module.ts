import { Module } from "@nestjs/common";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { BlocksModule } from "./blocks/blocks.module";
import { ContactModule } from "./contact/contact.module";
import { ContentModule } from "./content/content.module";
import { MediaModule } from "./media/media.module";
import { PagesModule } from "./pages/pages.module";
import { PartnersModule } from "./partners/partners.module";
import { PostsModule } from "./posts/posts.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SolutionsModule } from "./solutions/solutions.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MediaModule,
    BlocksModule,
    AdminModule,
    SolutionsModule,
    PagesModule,
    PartnersModule,
    PostsModule,
    ContentModule,
    ContactModule,
  ],
})
export class AppModule {}
