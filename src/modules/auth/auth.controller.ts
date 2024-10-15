import { Body, Controller, Post } from '@nestjs/common';
import { AuthenticationService } from './auth.service';
import {
  LoginUserDto,
  RegisterUserDto,
  VerifyUserDto,
} from './dto/auth-user.dto';
import { map, Observable } from 'rxjs';
import { DescribeApi } from '../utils/api/describe-api.decorator';
import { ApiTags } from '@nestjs/swagger';

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
  public verify(@Body() { code, email }: VerifyUserDto): Observable<void> {
    return this.authService.verifyUserCode({
      code,
      email,
    });
  }

  @Post('/token')
  @DescribeApi({})
  public getAuthTokens(@Body() { email, password }: LoginUserDto) {
    return this.authService.validateUser({ email, password });
  }

  @Post('/logout')
  public logot() {}
}
