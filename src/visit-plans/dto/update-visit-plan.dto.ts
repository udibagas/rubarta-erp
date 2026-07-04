import { PartialType } from '@nestjs/mapped-types';
import { CreateVisitPlanDto } from './create-visit-plan.dto';

export class UpdateVisitPlanDto extends PartialType(CreateVisitPlanDto) {}
