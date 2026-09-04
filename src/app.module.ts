import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BanksModule } from './banks/banks.module';
import { CompaniesModule } from './companies/companies.module';
import { DepartmentsModule } from './departments/departments.module';
import { ApprovalSettingsModule } from './approval-settings/approval-settings.module';
import { ApprovalModule } from './approval/approval.module';
import { NkpModule } from './nkp/nkp.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MailerModule } from '@nestjs-modules/mailer';
import { NotificationsModule } from './notifications/notifications.module';
import { FileModule } from './file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ReportModule } from './report/report.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CustomersModule } from './customers/customers.module';
import { join } from 'path';
import { ContactsModule } from './contacts/contacts.module';
import { LeadsModule } from './leads/leads.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { QuotationsModule } from './quotations/quotations.module';
import { TasksModule } from './tasks/tasks.module';
import { InteractionsModule } from './interactions/interactions.module';
import { OrdersModule } from './orders/orders.module';
import { MaterialsModule } from './materials/materials.module';
import { CrmDashboardModule } from './crm-dashboard/crm-dashboard.module';
import { VisitPlansModule } from './visit-plans/visit-plans.module';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAILER_HOST,
        port: Number(process.env.MAILER_PORT),
        secure: true,
        auth: {
          user: process.env.MAILER_USER,
          pass: process.env.MAILER_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
        // connectionTimeout: 10000, // 10 seconds
        // greetingTimeout: 10000,
        // socketTimeout: 10000,
      },
      // preview: true,
      defaults: {
        from: `"${process.env.MAILER_FROM_NAME}" <${process.env.MAILER_FROM_EMAIL}>`,
      },
      template: {
        dir: __dirname + '/../../templates',
        adapter: new EjsAdapter(),
        options: {
          strict: false,
        },
      },
    }),
    // FOR UPLOAD FILE
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'uploads'),
      serveRoot: '/uploads',
    }),
    // FOR CSS
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'css'),
      serveRoot: '/css',
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      graphiql: true,
      playground: false,
      autoSchemaFile: true,
    }),
    UsersModule,
    PrismaModule,
    AuthModule,
    BanksModule,
    CompaniesModule,
    DepartmentsModule,
    ApprovalSettingsModule,
    ApprovalModule,
    NkpModule,
    NotificationsModule,
    FileModule,
    SuppliersModule,
    ReportModule,
    InvoicesModule,
    CustomersModule,
    ContactsModule,
    LeadsModule,
    OpportunitiesModule,
    QuotationsModule,
    TasksModule,
    InteractionsModule,
    OrdersModule,
    MaterialsModule,
    CrmDashboardModule,
    VisitPlansModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
