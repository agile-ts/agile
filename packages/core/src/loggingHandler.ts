import { Agile } from './internal';

const l = Agile.logger;

export class LoggingHandler {
  public static logs = {
    // Agile
    createdAgileInstanceSuccess: (agileInstance: any, loggerInstance: any) =>
      l.success('Created new AgileInstance ', agileInstance, loggerInstance),
    multipleGlobalBoundAgileInstancesWarning: () =>
      l.warn(
        'Be careful with binding multiple Agile Instances globally in one Application!'
      ),

    // Storages
    localStorageNotAvailableWarning: () =>
      l.warn(
        `The 'Local Storage' is in your current environment not available. 
        To use the .persist() functionality please provide a custom Storage!`
      ),
    firstAssignedStorageHasToBeDefaultStorageWarning: () =>
      l.warn(
        'The first allocated Storage for AgileTs must be set as the default Storage!'
      ),
    storageAtKeyNotReadyError: (key: any) =>
      l.error(`Storage with the key/name '${key}' isn't ready yet!`),
    noStorageFoundError: () =>
      l.error('No Storage found! Please provide at least one Storage.'),

    // Persistent
    noPersistKeyFoundError: () =>
      l.error(
        'No valid persist Key found! Please provide a Key or assign one to the parent instance.'
      ),
    noPersistStorageKeyFoundError: () =>
      l.error(
        'No persist Storage Key found! Please provide at least one Storage Key.'
      ),

    // Storage
    noValidStorageMethodError: (methodName: string) =>
      l.error(`Invalid ${methodName}() method as StorageMethod provided!`),
    normalGetInAsyncStorageWarning: () =>
      l.warn(
        'Using normalGet() in a async based Storage might lead to a unexpected return value. Instead of an resolved value it returns an Promise!'
      ),

    // Runtime
    createdRuntimeJobInfo: (job: any) =>
      l.if.tag(['runtime']).info(`Created Job '${job._key}'`, job),
    completedRuntimeJobInfo: (job: any) =>
      l.if.tag(['runtime']).info(`Completed Job '${job._key}'`, job),
    notReadySubscriptionContainerWarning: (subscriptionContainer: any) =>
      l.warn(
        "SubscriptionContainer/Component isn't ready to rerender!",
        subscriptionContainer
      ),
    removedJobExpiredJobFromRuntimeWarning: (
      subscriptionContainer: any,
      triesOfUpdating
    ) =>
      l.warn(
        `Job with not ready SubscriptionContainer/Component was removed from the runtime after ${triesOfUpdating} tries to avoid an overflow.`,
        subscriptionContainer
      ),
    updatedSubscriptionsInfo: (subscriptionsToUpdate: any) =>
      l.if
        .tag(['runtime'])
        .info('Updated/Rerendered Subscriptions', subscriptionsToUpdate),

    // SubController
    unregisteredSubscriptionInfo: (subscriptionInstance: any, based: string) =>
      l.if
        .tag(['runtime', 'subscription'])
        .info(
          `Unregistered '${based}' based Subscription.`,
          subscriptionInstance
        ),
    registeredSubscriptionInfo: (subscriptionInstance: any, based: string) =>
      l.if
        .tag(['runtime', 'subscription'])
        .info(
          `Registered '${based}' based Subscription.`,
          subscriptionInstance
        ),

    // Integrations
    failedToIntegrateFrameworkError: (integration: any) =>
      l.error(
        `Failed to integrate Framework '${integration._key}'!`,
        integration
      ),
    integratedFrameworkSuccess: (integration: any) =>
      l.success(`Integrated '${integration._key}' into AgileTs`, integration),
    notReadyIntegrationWarning: (integration: any) =>
      l.warn(`Integration '${integration.key}' isn't ready yet!`),

    // State
    incorrectTypeProvided: (type: string, messageType: 'error' | 'warn') =>
      l[messageType](`Incorrect type (${type}) was provided!`),
    notSupportedTypeError: (type: string) =>
      l.error(
        `'${type}' is not supported! Supported types: String, Boolean, Array, Object, Number`
      ),
    noPatchMethodOnNonObjectStateError: () =>
      l.error('The patch() method works only on States of the type object!'),
    onlyOneIntervalAtOnceError: () =>
      l.error(`Only one Interval can be active at once!`),
    onlyInvertBooleanBasedStatesError: () =>
      l.error('Only boolean based States can be inverted!'),

    // Collection
    useCreateGroupAfterInstantiationWarning: () =>
      l.warn(
        "We recommend using 'createGroup()' instead of 'Group()' outside the Collection configuration object"
      ),
    useCreateSelectorAfterInstantiationWarning: () =>
      l.warn(
        "We recommend using 'createSelector()' instead of 'Selector()' outside the Collection configuration object"
      ),
    itemAtKeyDoesNotExistInCollectionError: (
      itemKey: any,
      collectionKey: any
    ) =>
      l.error(
        `Item with key/name '${itemKey}' doesn't exist in Collection '${collectionKey}'!`
      ),
    validObjectRequiredToUpdateCollectionItemError: (
      itemKey: any,
      collectionKey: any
    ) =>
      l.error(
        `You have to pass an valid Changes Object to update '${itemKey}' in '${collectionKey}'!`
      ),
    overwriteWholeItemWarning: (changes: any) =>
      Agile.logger.warn(
        `By overwriting the whole Item you have to pass the correct itemKey into the changes object!`,
        changes
      ),
    useGroupMethodBeforeInstantiationWarning: () =>
      l.warn(
        "We recommend using 'Group()' instead of 'createGroup()' in the Collection configuration object!"
      ),
    useSelectorMethodBeforeInstantiationWarning: () =>
      l.warn(
        "We recommend using 'Selector()' instead of 'createSelector()' in the Collection configuration object!"
      ),

    // Utils
    classMethodXNotSet: (methodName: string, className: string) =>
      l.error(
        `${methodName}() isn't set in ${className} but need to be set! ${className} is no stand alone class.`
      ),
    canNotUseMethodXOnClassX: (
      methodName: string,
      className: string,
      reason: string
    ) =>
      l.error(
        `We can't use the '${methodName}()' in the ${className}! ${reason}`
      ),
    xAlreadyExistsAtKeyYError: (x: any, y: any) =>
      l.error(`${x} with the key/name '${y}' already exists!`),
    xDoesNotExistsAtKeyYError: (x: any, y: any) =>
      l.error(`${x} with the key/name '${y}' doesn't exists!`),
    xHasToBeOfTheTypeYError: (x: any, y: any) =>
      l.error(`${x} has to be of the type ${y}!`),
  };

  constructor() {
    // empty
  }
}
