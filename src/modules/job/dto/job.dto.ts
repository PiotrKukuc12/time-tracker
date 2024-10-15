import { createZodDto } from '@anatine/zod-nestjs';
import {
  finishJobSchema,
  startJobSchema,
} from 'src/modules/user/domain/models/resource/job.resource';
import { createProjectSchema } from 'src/modules/user/domain/models/resource/project.resource';

export class StartJobDto extends createZodDto(startJobSchema) {}

export class CreateJobDto extends createZodDto(createProjectSchema) {}

export class FinishJobDto extends createZodDto(finishJobSchema) {}
