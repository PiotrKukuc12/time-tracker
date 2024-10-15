import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiConfigService } from './modules/config/api-config.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestjsSwagger } from '@anatine/zod-nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ApiConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Candao API')
    .setDescription('Candao API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'Bearer',
        in: 'Header',
        description:
          'Authorization token obtained from the /auth/token endpoint',
      },
      `Bearer`,
    )
    .build();

  patchNestjsSwagger();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    ignoreGlobalPrefix: true,
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey}.${methodKey}`,
  });

  SwaggerModule.setup('/docs', app, {
    ...document,
    openapi: '3.1.0',
  });

  const port = configService.get('PORT');
  await app.listen(port).then(() => {
    console.log(`Server is running on port ${port}`);
  });
}
bootstrap();
