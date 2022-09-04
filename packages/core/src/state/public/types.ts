import { CreateAgileSubInstanceInterface } from '../../shared';
import { StateConfigInterface } from '../state';

export interface CreateStateConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    StateConfigInterface {}
