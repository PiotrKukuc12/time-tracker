import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './auth.service';
import {
  LoginUserDto,
  LoginUserDtoResponse,
  RegisterUserDto,
  RegisterUserDtoResponse,
  VerifyUserDto,
} from './dto/auth-user.dto';
import { map, Observable } from 'rxjs';
import { DescribeApi } from '../utils/api/describe-api.decorator';
import { ApiTags } from '@nestjs/swagger';
import { AuthTokens } from './ts/types/auth.type';
import { AuthenticationGuard } from './guards/authentication.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '../database/schema/user/user.schema';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './models/authenticated-user';

@Controller({
  path: '/auth',
})
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('/register')
  @DescribeApi({
    operationOptions: {
      description: 'Register a new user',
    },
    response: {
      status: 201,
      schema: RegisterUserDtoResponse,
    },
  })
  public register(
    @Body() { email, password, confirmPassword }: RegisterUserDto,
  ): Observable<{ token: string }> {
    return this.authService
      .register({
        email,
        password,
        confirmPassword,
      })
      .pipe(map((token) => ({ token })));
  }

  @Post('/verify')
  @DescribeApi({
    operationOptions: {
      description: 'Verify user code',
    },
  })
  public verify(@Body() { code, email }: VerifyUserDto): Observable<void> {
    return this.authService.verifyUserCode({
      code,
      email,
    });
  }

  @Post('/token')
  @DescribeApi({
    operationOptions: {
      description: 'Get auth tokens',
    },
    response: {
      schema: LoginUserDtoResponse,
      status: 200,
    },
  })
  public getAuthTokens(
    @Body() { email, password }: LoginUserDto,
  ): Observable<AuthTokens> {
    return this.authService.validateUser({ email, password });
  }

  @UseGuards(AuthenticationGuard)
  @Get('/test-user')
  public testUser(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('/test-admin')
  public testAdmin(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
