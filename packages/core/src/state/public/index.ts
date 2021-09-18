import { CreateAgileSubInstanceInterface } from '../../shared';
import { StateConfigInterface } from '../state';

export * from './createState';
export * from './createEnhancedState';
export * from './createLightState';

export interface CreateStateConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    StateConfigInterface {}
