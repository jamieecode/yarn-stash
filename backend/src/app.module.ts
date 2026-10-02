import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { DEFAULT_THROTTLE } from "./common/throttle";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { YarnCatalogModule } from "./yarn-catalog/yarn-catalog.module";
import { YarnModule } from "./yarn/yarn.module";
import { PatternModule } from "./pattern/pattern.module";
import { ProjectModule } from "./project/project.module";
import { DashboardModule } from "./dashboard/dashboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 카운터는 메모리에 둔다 - Render 인스턴스가 하나라 충분하고, 재시작되면 초기화되는 정도는 감수
    ThrottlerModule.forRoot({
      throttlers: [DEFAULT_THROTTLE],
      errorMessage: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요",
    }),
    PrismaModule,
    AuthModule,
    YarnCatalogModule,
    YarnModule,
    PatternModule,
    ProjectModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
