import { CreateAgileSubInstanceInterface } from '../../shared';
import { CreateComputedConfigInterface } from '../computed';

export interface CreateComputedConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    CreateComputedConfigInterface {}
