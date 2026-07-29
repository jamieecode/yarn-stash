import { Module } from "@nestjs/common";
import { YarnService } from "./yarn.service";
import { YarnController } from "./yarn.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule], // AuthGuard 사용을 위해 import
  controllers: [YarnController],
  providers: [YarnService],
})
export class YarnModule {}
