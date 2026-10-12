import { ValidateIf } from "class-validator";

// 보내지 않은 필드만 건너뛴다 - @IsOptional은 null도 통과시키므로, 비울 수 없는 필드에 null이 오면 400으로 막기 위해 사용
export const IsPresent = () => ValidateIf((_, value) => value !== undefined);
