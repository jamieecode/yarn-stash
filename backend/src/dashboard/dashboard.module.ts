import { Module } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule], // AuthGuard 사용을 위해 import
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
