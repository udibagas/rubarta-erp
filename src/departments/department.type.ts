import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType('Department')
export class DepartmentType {
  @Field(() => Int)
  id: number;

  @Field()
  code: string;

  @Field()
  name: string;
}
