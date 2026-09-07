import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

// 프로젝트에 실을 연결할 때. 예약량을 안 보내면 서비스가 도안의 requiredMinM으로 기본값을 채움.
// 길이는 배치와 동일한 규칙 - 사용자가 입력한 단위로 받고 서비스에서 m로 정규화해 저장 (기획서 2.1)
export class CreateProjectYarnDto {
  @IsString()
  @IsNotEmpty()
  yarnId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedM?: number;

  @IsOptional()
  @IsIn(["METRIC", "IMPERIAL"])
  inputUnit?: "METRIC" | "IMPERIAL";
}

// 예약량 조정, 또는 완료 시 실제로 얼마나 썼는지 확정
export class UpdateProjectYarnDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedM?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usedM?: number;

  @IsOptional()
  @IsIn(["METRIC", "IMPERIAL"])
  inputUnit?: "METRIC" | "IMPERIAL";
}
