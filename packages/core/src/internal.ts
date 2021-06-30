// This file exposes Agile functions and types to the outside world
// It also serves as a cyclic dependency workaround
// https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de.

// !! All internal Agile modules must be imported from here!!

// Utils
export * from './utils';
export * from '@agile-ts/utils';

// Logger
export * from '@agile-ts/logger';
export * from './logCodeManager';

// Agile
export * from './agile';

// Integrations
export * from './integrations';
export * from './integrations/integration';

// Runtime
export * from './runtime';
export * from './runtime/observer';
export * from './runtime/runtime.job';
export * from './runtime/subscription/container/SubscriptionContainer';
export * from './runtime/subscription/container/CallbackSubscriptionContainer';
export * from './runtime/subscription/container/ComponentSubscriptionContainer';
export * from './runtime/subscription/sub.controller';

// Storage
export * from './storages';
export * from './storages/storage';
export * from './storages/persistent';

// State
export * from './state';
export * from './state/state.observer';
export * from './state/state.persistent';
export * from './state/state.runtime.job';

// Computed
export * from './computed';
export * from './computed/computed.tracker';

// Collection
export * from './collection';
export * from './collection/group';
export * from './collection/group/group.observer';
export * from './collection/item';
export * from './collection/selector';
export * from './collection/collection.persistent';

// Shared
export * from './shared';

export const runsOnServer =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined';
