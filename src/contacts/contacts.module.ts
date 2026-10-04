import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { ContactsResolver } from './contacts.resolver';
import { ContactsPolicy } from './contacts.policy';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService, ContactsResolver, ContactsPolicy],
})
export class ContactsModule {}
