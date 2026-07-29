import { Module } from "@nestjs/common";
import { YarnCatalogService } from "./yarn-catalog.service";
import { YarnCatalogController } from "./yarn-catalog.controller";
import { RavelryModule } from "../ravelry/ravelry.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [RavelryModule, AuthModule],
  controllers: [YarnCatalogController],
  providers: [YarnCatalogService],
  exports: [YarnCatalogService],
})
export class YarnCatalogModule {}
