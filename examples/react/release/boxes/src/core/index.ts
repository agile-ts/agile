import ui from './entities/ui';
import { globalBind } from '@agile-ts/core';

const core = {
  ui: ui,
};

globalBind('__core__', core);

export default core;
