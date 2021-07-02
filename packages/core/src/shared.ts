import { Agile, Logger } from './internal';

// Shared Agile Instance that is used when no Agile Instance was specified
// eslint-disable-next-line prefer-const
export let shared = new Agile({
  key: 'shared',
  logConfig: { level: Logger.level.WARN },
});
