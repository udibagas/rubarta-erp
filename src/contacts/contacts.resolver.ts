import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ContactsService } from './contacts.service';
import { ContactType } from './contact.type';

@Resolver(() => ContactType)
export class ContactsResolver {
  constructor(private readonly contactsService: ContactsService) {}

  @Query(() => [ContactType], {
    name: 'contacts',
    description: 'Get all contacts',
  })
  async findAll(
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('customerId', { type: () => Int, nullable: true })
    customerId?: number,
    @Args('isActive', { type: () => Boolean, nullable: true })
    isActive?: boolean,
  ) {
    return this.contactsService.findAll({ keyword, customerId, isActive });
  }

  @Query(() => ContactType, {
    name: 'contact',
    description: 'Get contact by ID',
  })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.contactsService.findOne(id);
  }
}
