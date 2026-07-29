import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

// PrismaClient를 Nest의 생명주기(모듈 초기화/종료)에 맞춰 관리하는 서비스.
// 다른 모든 모듈은 이 서비스를 주입받아 DB에 접근한다.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
