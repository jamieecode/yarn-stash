import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateNicknameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nickname!: string;
}
