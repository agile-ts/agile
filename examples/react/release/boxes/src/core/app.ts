import { Agile, Logger } from '@agile-ts/core';
import reactIntegration from '@agile-ts/react';

export const App = new Agile({
  logConfig: { level: Logger.level.WARN },
}).integrate(reactIntegration);
