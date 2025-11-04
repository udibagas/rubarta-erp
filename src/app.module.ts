import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BanksModule } from './banks/banks.module';
import { CompaniesModule } from './companies/companies.module';
import { DepartmentsModule } from './departments/departments.module';
import { ApprovalSettingsModule } from './approval-settings/approval-settings.module';
import { NkpModule } from './nkp/nkp.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
// import { APP_GUARD } from '@nestjs/core';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter'; //?
import { NotificationsModule } from './notifications/notifications.module';
import { FileModule } from './file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ReportModule } from './report/report.module';
// import { InvoicesModule } from './invoices/invoices.module';
// import { PaymentsModule } from './payments/payments.module';
// import { ExpensesModule } from './expenses/expenses.module';
import { CustomersModule } from './customers/customers.module';
// import { AccountsModule } from './accounts/accounts.module';
import { join } from 'path';
import { ContactsModule } from './contacts/contacts.module';
import { LeadsModule } from './leads/leads.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // max request per minute
      },
    ]),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAILER_HOST,
        port: process.env.MAILER_PORT,
        secure: true,
        auth: {
          user: process.env.MAILER_USER,
          pass: process.env.MAILER_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
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
    // FOR SPA
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'public'),
    }),
    EventEmitterModule.forRoot(),
    UsersModule,
    PrismaModule,
    AuthModule,
    BanksModule,
    CompaniesModule,
    DepartmentsModule,
    ApprovalSettingsModule,
    NkpModule,
    NotificationsModule,
    FileModule,
    SuppliersModule,
    ReportModule,
    // AccountsModule,
    // InvoicesModule,
    // PaymentsModule,
    // ExpensesModule,
    CustomersModule,
    ContactsModule,
    LeadsModule,
    OpportunitiesModule,
  ],
  controllers: [],
  providers: [],
  //! ini bikin test jadi hang up, enable kalau udah production
  // providers: [
  //   {
  //     provide: APP_GUARD,
  //     useClass: ThrottlerGuard,
  //   },
  // ],
})
export class AppModule {}
