import { Agile } from './agile';

// Shared Agile Instance that is used when no Agile Instance was specified
// eslint-disable-next-line prefer-const
export let shared = new Agile();
// if (!process.env.DISABLE_SHARED_AGILE_INSTANCE) shared = new Agile();
