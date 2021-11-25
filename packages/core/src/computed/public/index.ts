import { CreateAgileSubInstanceInterface } from '../../shared';
import { CreateComputedConfigInterface } from '../computed';

export * from './createComputed';

export interface CreateComputedConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    CreateComputedConfigInterface {}
