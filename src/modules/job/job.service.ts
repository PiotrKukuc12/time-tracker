import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Job, JobReadModel } from './domain/job';
import { forkJoin, from, map, Observable, switchMap, throwError } from 'rxjs';
import { dbSchema, DrizzleService } from '../database';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { CreateProjectResource } from '../user/domain/models/resource/project.resource';
import { OffsetPageOptionsDto } from '../utils/dtos/offset-page-options.dto';
import { Paginator } from '../utils/paginator';
import { PageDto } from '../utils/dtos/page.dto';
import { UserId } from '../user';
import { StartJobResource } from '../user/domain/models/resource/job.resource';
import { ProjectId } from './domain/value-objects/id/project-id.vo';
import { JobId } from './domain/value-objects/id/job-id.vo';
import { DateTime } from 'luxon';
import { JobStatus } from '../database/schema/job/job.schema';

export type ProjectReadModel = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class JobService {
  constructor(private readonly drizzle: DrizzleService) {}

  public finishJob(jobId: JobId, userId: UserId): Observable<void> {
    return from(
      this.drizzle.db.query.jobs.findFirst({
        where: and(
          eq(dbSchema.jobs.id, jobId.value),
          eq(dbSchema.jobs.userId, userId.value),
        ),
      }),
    ).pipe(
      switchMap((foundJob) => {
        if (!foundJob) {
          return throwError(() => {
            throw new NotFoundException('Not found job');
          });
        }

        if (foundJob.status === JobStatus.FINISHED) {
          return throwError(() => {
            throw new ConflictException('Job already finished');
          });
        }

        const job = Job.toDomain(foundJob);

        job.finish();

        return from(
          this.drizzle.db
            .update(dbSchema.jobs)
            .set(job.toInsert())
            .where(eq(dbSchema.jobs.id, job.id.value)),
        ).pipe(
          map(() => {
            return;
          }),
        );
      }),
    );
  }

  public create({
    description,
    projectId,
    userId,
  }: StartJobResource & { userId: UserId }): Observable<void> {
    return forkJoin({
      user: this.drizzle.db.query.users.findFirst({
        where: eq(dbSchema.users.id, userId.value),
      }),
      project: this.drizzle.db.query.projects.findFirst({
        where: eq(dbSchema.projects.id, projectId),
      }),
    }).pipe(
      switchMap(({ user, project }) => {
        if (!user) {
          return throwError(() => {
            throw new NotFoundException('Not found user');
          });
        }

        if (!project) {
          return throwError(() => {
            throw new NotFoundException('Not found project');
          });
        }

        const job = Job.start({
          description,
          projectId: new ProjectId(projectId),
          userId,
        });

        return from(
          this.drizzle.db.insert(dbSchema.jobs).values(job.toInsert()),
        ).pipe(
          map(() => {
            return;
          }),
        );
      }),
    );
  }

  public createProject({ name }: CreateProjectResource): Observable<void> {
    return from(
      this.drizzle.db.insert(dbSchema.projects).values({
        name,
      }),
    ).pipe(
      map(() => {
        return;
      }),
    );
  }

  public findManyJobs(
    pageOptions: OffsetPageOptionsDto,
    userId?: UserId,
  ): Observable<PageDto<JobReadModel>> {
    const offset = (pageOptions.page - 1) * pageOptions.limit;

    const whereAttributes: any[] = [];

    if (userId) {
      whereAttributes.push(eq(dbSchema.jobs.userId, userId.value));
    }
    return forkJoin({
      data: this.drizzle.db.query.jobs.findMany({
        limit: pageOptions.limit,
        offset: offset,
        orderBy: desc(dbSchema.jobs.startDate),
        where: and(...whereAttributes),
      }),
      totalCount: this.drizzle.db
        .select({ count: count() })
        .from(dbSchema.jobs)
        .then(([res]) => res?.count || 0),
    }).pipe(
      map(({ data, totalCount }) => {
        return Paginator.createOffsetPage({
          data: data.map((item) => Job.toDomain(item).toReadModel()),
          itemCount: totalCount,
          ...pageOptions,
        });
      }),
    );
  }

  public findManyProjects(
    pageOptions: OffsetPageOptionsDto,
  ): Observable<PageDto<ProjectReadModel>> {
    const offset = (pageOptions.page - 1) * pageOptions.limit;
    return forkJoin({
      data: this.drizzle.db.query.projects.findMany({
        limit: pageOptions.limit,
        offset: offset,
        orderBy: desc(dbSchema.projects.createdAt),
      }),
      totalCount: this.drizzle.db
        .select({ count: count() })
        .from(dbSchema.projects)
        .then(([res]) => res?.count || 0),
    }).pipe(
      map(({ data, totalCount }) => {
        return Paginator.createOffsetPage({
          data,
          itemCount: totalCount,
          ...pageOptions,
        });
      }),
    );
  }
  public getTotalWorkingTimeForUser(
    userId: UserId,
    page: number,
    limit: number,
  ): Observable<{ date: string; totalHours: number }[]> {
    const startDate = DateTime.now()
      .minus({ days: (page - 1) * limit })
      .startOf('day');
    const endDate = startDate.plus({ days: limit });

    return from(
      this.drizzle.db.query.jobs.findMany({
        where: and(
          eq(dbSchema.jobs.userId, userId.value),
          eq(dbSchema.jobs.status, JobStatus.FINISHED),
          // Filter by the calculated date range
          and(
            gte(dbSchema.jobs.finishDate, startDate.toJSDate()),
            lte(dbSchema.jobs.finishDate, endDate.toJSDate()),
          ),
        ),
        orderBy: desc(dbSchema.jobs.finishDate),
      }),
    ).pipe(
      map((jobs) => {
        const hoursByDate: { [key: string]: number } = {};

        jobs.forEach((job) => {
          const finishDate = DateTime.fromJSDate(job.finishDate as Date);
          const startDate = DateTime.fromJSDate(job.startDate);

          // Ensure both dates are valid
          if (finishDate && startDate) {
            const duration = finishDate.diff(startDate, ['hours']).hours;
            const dateKey = finishDate.toISODate();

            if (dateKey) {
              if (!hoursByDate[dateKey]) {
                hoursByDate[dateKey] = 0;
              }
              hoursByDate[dateKey] += duration;
            }
          }
        });

        return Object.entries(hoursByDate).map(([date, totalHours]) => ({
          date,
          totalHours,
        }));
      }),
    );
  }

  public getTotalWorkingTimeForAllUsers(
    page: number,
    limit: number,
  ): Observable<{ userId: string; date: string; totalHours: number }[]> {
    const startDate = DateTime.now()
      .minus({ days: (page - 1) * limit })
      .startOf('day');
    const endDate = startDate.plus({ days: limit });

    return from(
      this.drizzle.db.query.jobs.findMany({
        where: and(
          eq(dbSchema.jobs.status, JobStatus.FINISHED),
          and(
            gte(dbSchema.jobs.finishDate, startDate.toJSDate()),
            lte(dbSchema.jobs.finishDate, endDate.toJSDate()),
          ),
        ),
        orderBy: desc(dbSchema.jobs.finishDate),
      }),
    ).pipe(
      map((jobs) => {
        const hoursByUserAndDate: {
          [userId: string]: { [date: string]: number };
        } = {};

        jobs.forEach((job) => {
          const finishDate = DateTime.fromJSDate(job.finishDate as Date);
          const startDate = DateTime.fromJSDate(job.startDate);

          // Ensure both dates are valid
          if (finishDate && startDate) {
            const duration = finishDate.diff(startDate, ['hours']).hours;
            const dateKey = finishDate.toISODate();

            if (!hoursByUserAndDate[job.userId]) {
              hoursByUserAndDate[job.userId] = {};
            }

            if (dateKey) {
              if (!hoursByUserAndDate[job.userId][dateKey]) {
                hoursByUserAndDate[job.userId][dateKey] = 0;
              }
              hoursByUserAndDate[job.userId][dateKey] += duration;
            }
          }
        });

        return Object.entries(hoursByUserAndDate).flatMap(
          ([userId, dateHours]) =>
            Object.entries(dateHours).map(([date, totalHours]) => ({
              userId,
              date,
              totalHours,
            })),
        );
      }),
    );
  }
}
