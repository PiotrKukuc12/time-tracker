import { createZodDto } from '@anatine/zod-nestjs';
import {
  loginUserResponseSchema,
  registerUserResponseSchema,
  userLoginSchema,
  userRegisterSchema,
  verifyUserSchema,
} from 'src/modules/user/domain/models/resource/user.resource';

export class RegisterUserDto extends createZodDto(userRegisterSchema) {}

export class LoginUserDto extends createZodDto(userLoginSchema) {}

export class VerifyUserDto extends createZodDto(verifyUserSchema) {}

export class RegisterUserDtoResponse extends createZodDto(
  registerUserResponseSchema,
) {}

export class LoginUserDtoResponse extends createZodDto(
  loginUserResponseSchema,
) {}
