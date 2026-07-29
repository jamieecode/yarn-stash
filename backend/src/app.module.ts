import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { YarnCatalogModule } from "./yarn-catalog/yarn-catalog.module";
import { YarnModule } from "./yarn/yarn.module";
import { PatternModule } from "./pattern/pattern.module";
import { ProjectModule } from "./project/project.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    YarnCatalogModule,
    YarnModule,
    PatternModule,
    ProjectModule,
  ],
})
export class AppModule {}
