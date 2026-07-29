import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// @Global로 등록해서 다른 모듈에서 imports 없이 PrismaService를 바로 주입받을 수 있게 함
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
