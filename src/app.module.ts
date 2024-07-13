import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BanksModule } from './banks/banks.module';
import { CompaniesModule } from './companies/companies.module';
import { DepartmentsModule } from './departments/departments.module';
import { ExpenseTypesModule } from './expense-types/expense-types.module';
import { ApprovalSettingsModule } from './approval-settings/approval-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    PrismaModule,
    AuthModule,
    BanksModule,
    CompaniesModule,
    DepartmentsModule,
    ExpenseTypesModule,
    ApprovalSettingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
