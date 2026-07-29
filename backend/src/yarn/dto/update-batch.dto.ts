import { PartialType } from "@nestjs/mapped-types";
import { CreateBatchDto } from "./create-yarn.dto";

// 배치 인라인 수정 (화면설계서 3번 "배치 카드 탭 시 인라인 수정 모드")
export class UpdateBatchDto extends PartialType(CreateBatchDto) {}
