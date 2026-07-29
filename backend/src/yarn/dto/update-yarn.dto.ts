import { OmitType, PartialType } from "@nestjs/mapped-types";
import { IsBoolean, IsOptional } from "class-validator";
import { CreateYarnDto } from "./create-yarn.dto";

// 마스터 정보 수정 (화면설계서 3-1) - catalogId는 최초 등록 시에만 연결, batches는 별도 엔드포인트로 관리
class YarnMasterFieldsDto extends OmitType(CreateYarnDto, ["catalogId", "batches"] as const) {}

export class UpdateYarnDto extends PartialType(YarnMasterFieldsDto) {
  // "다 썼어요" 토글 (화면설계서 3번, 기획서 2.12)
  @IsOptional()
  @IsBoolean()
  consumed?: boolean;
}
