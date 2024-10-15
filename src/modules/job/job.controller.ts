import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '../auth/guards/authentication.guard';
import { Observable } from 'rxjs';
import { JobService, ProjectReadModel } from './job.service';
import { JobReadModel } from './domain/job';
import { CreateJobDto, FinishJobDto, StartJobDto } from './dto/job.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserId } from '../user';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/schema/user/user.schema';
import { DescribeApi } from '../utils/api/describe-api.decorator';
import { OffsetPageOptionsDto } from '../utils/dtos/offset-page-options.dto';
import { PageDto } from '../utils/dtos/page.dto';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import { JobId } from './domain/value-objects/id/job-id.vo';

@Controller({
  path: '/job',
})
@UseGuards(AuthenticationGuard)
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('/start')
  public startJob(
    @Body() dto: StartJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Observable<void> {
    return this.jobService.create({ ...dto, userId: new UserId(user.id) });
  }

  @Patch(`/finish`)
  public finishJob(
    @Body() { jobId }: FinishJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Observable<void> {
    return this.jobService.finishJob(new JobId(jobId), new UserId(user.id));
  }

  @Get('/')
  @DescribeApi({
    operationOptions: {
      description: 'Get all job stats',
    },
    query: [
      {
        spreadSchema: true,
        schema: OffsetPageOptionsDto,
      },
    ],
  })
  public getJobs(
    @Query() pageOptions: OffsetPageOptionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Observable<PageDto<JobReadModel>> {
    return this.jobService.findManyJobs(pageOptions, new UserId(user.id));
  }

  @Get('/projects')
  @DescribeApi({
    operationOptions: {
      description: 'Get all projects',
    },
    query: [
      {
        spreadSchema: true,
        schema: OffsetPageOptionsDto,
      },
    ],
  })
  public getProjects(
    @Query() pageOptions: OffsetPageOptionsDto,
  ): Observable<PageDto<ProjectReadModel>> {
    return this.jobService.findManyProjects(pageOptions);
  }

  // ADMIN ENDPOINTS
  @Post('/project')
  @DescribeApi({
    operationOptions: {
      description: 'Create a new project',
    },
    response: {
      status: 201,
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  public createProject(@Body() { name }: CreateJobDto): Observable<void> {
    return this.jobService.createProject({ name });
  }

  @Get('/admin')
  @DescribeApi({
    operationOptions: {
      description: 'Get all jobs',
    },
    query: [
      {
        spreadSchema: true,
        schema: OffsetPageOptionsDto,
      },
    ],
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  public getAllJobs(
    @Query() pageOptions: OffsetPageOptionsDto,
    @Query('userId') userId?: string,
  ): Observable<PageDto<JobReadModel>> {
    return this.jobService.findManyJobs(
      pageOptions,
      userId ? new UserId(userId) : undefined,
    );
  }

  @Get('/working-time')
  @DescribeApi({
    operationOptions: {
      description:
        'Get total working time for the currently logged-in user, grouped by day with pagination.',
    },
  })
  public getWorkingTimeForUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page: number = 1, // Default to page 1
    @Query('limit') limit: number = 7, // Default to 7 days
  ): Observable<{ date: string; totalHours: number }[]> {
    return this.jobService.getTotalWorkingTimeForUser(
      new UserId(user.id),
      page,
      limit,
    );
  }

  @Get('/admin/working-time')
  @DescribeApi({
    operationOptions: {
      description:
        'Get total working time for all users, grouped by day with pagination. Admin only.',
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  public getWorkingTimeForAllUsers(
    @Query('page') page: number = 1, // Default to page 1
    @Query('limit') limit: number = 7, // Default to 7 days
  ): Observable<{ userId: string; date: string; totalHours: number }[]> {
    return this.jobService.getTotalWorkingTimeForAllUsers(page, limit);
  }
}
