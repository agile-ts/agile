import { Agile } from './internal';

export class LoggingHandler {
  public static logs = {
    // Agile
    createdAgileInstanceSuccess: (agileInstance: any, loggerInstance: any) =>
      Agile.logger.success(
        'Created new AgileInstance ',
        agileInstance,
        loggerInstance
      ),
    multipleGlobalBoundAgileInstancesWarning: () =>
      Agile.logger.warn(
        'Be careful with binding multiple Agile Instances globally in one Application!'
      ),

    // Storages
    localStorageNotAvailableWarning: () =>
      Agile.logger.warn(
        `The 'Local Storage' is in your current environment not available. 
        To use the .persist() functionality please provide a custom Storage!`
      ),
    firstAssignedStorageHasToBeDefaultStorageWarning: () =>
      Agile.logger.warn(
        'The first allocated Storage for AgileTs must be set as the default Storage!'
      ),
    storageAtKeyNotReadyError: (key: any) =>
      Agile.logger.error(`Storage with the key/name '${key}' isn't ready yet!`),
    noStorageFoundError: () =>
      Agile.logger.error(
        'No Storage found! Please provide at least one Storage.'
      ),

    // Persistent
    noPersistKeyFoundError: () =>
      Agile.logger.error(
        'No valid persist Key found! Please provide a Key or assign one to the parent instance.'
      ),
    noPersistStorageKeyFoundError: () =>
      Agile.logger.error(
        'No persist Storage Key found! Please provide at least one Storage Key.'
      ),

    // Storage
    noValidStorageMethodError: (methodName: string) =>
      Agile.logger.error(
        `Invalid ${methodName}() method as StorageMethod provided!`
      ),
    normalGetInAsyncStorageWarning: () =>
      Agile.logger.warn(
        'Using normalGet() in a async based Storage might lead to a unexpected return value. Instead of an resolved value it returns an Promise!'
      ),

    // Runtime
    createdRuntimeJobInfo: (job: any) =>
      Agile.logger.if.tag(['runtime']).info(`Created Job '${job._key}'`, job),
    completedRuntimeJobInfo: (job: any) =>
      Agile.logger.if.tag(['runtime']).info(`Completed Job '${job._key}'`, job),
    notReadySubscriptionContainerWarning: (subscriptionContainer: any) =>
      Agile.logger.warn(
        "SubscriptionContainer/Component isn't ready to rerender!",
        subscriptionContainer
      ),
    removedJobExpiredJobFromRuntimeWarning: (
      subscriptionContainer: any,
      triesOfUpdating
    ) =>
      Agile.logger.warn(
        `Job with not ready SubscriptionContainer/Component was removed from the runtime after ${triesOfUpdating} tries to avoid an overflow.`,
        subscriptionContainer
      ),
    updatedSubscriptionsInfo: (subscriptionsToUpdate: any) =>
      Agile.logger.if
        .tag(['runtime'])
        .info('Updated/Rerendered Subscriptions', subscriptionsToUpdate),

    // SubController
    unregisteredSubscriptionInfo: (subscriptionInstance: any, based: string) =>
      Agile.logger.if
        .tag(['runtime', 'subscription'])
        .info(
          `Unregistered '${based}' based Subscription.`,
          subscriptionInstance
        ),
    registeredSubscriptionInfo: (subscriptionInstance: any, based: string) =>
      Agile.logger.if
        .tag(['runtime', 'subscription'])
        .info(
          `Registered '${based}' based Subscription.`,
          subscriptionInstance
        ),

    // Integrations
    failedToIntegrateFrameworkError: (integration: any) =>
      Agile.logger.error(
        `Failed to integrate Framework '${integration._key}'!`,
        integration
      ),
    integratedFrameworkSuccess: (integration: any) =>
      Agile.logger.success(
        `Integrated '${integration._key}' into AgileTs`,
        integration
      ),
    notReadyIntegrationWarning: (integration: any) =>
      Agile.logger.warn(`Integration '${integration.key}' isn't ready yet!`),

    // State
    incorrectTypeProvided: (type: string, messageType: 'error' | 'warn') =>
      Agile.logger[messageType](`Incorrect type (${type}) was provided!`),
    notSupportedTypeError: (type: string) =>
      Agile.logger.error(
        `'${type}' is not supported! Supported types: String, Boolean, Array, Object, Number`
      ),
    noPatchMethodOnNonObjectStateError: () =>
      Agile.logger.error(
        'The patch() method works only on States of the type object!'
      ),
    onlyOneIntervalAtOnceError: () =>
      Agile.logger.error(`Only one Interval can be active at once!`),
    onlyInvertBooleanBasedStatesError: () =>
      Agile.logger.error('Only boolean based States can be inverted!'),

    // Collection
    useCreateGroupAfterInstantiationWarning: () =>
      Agile.logger.warn(
        "We recommend using 'createGroup()' instead of 'Group()' outside the Collection configuration object"
      ),
    useCreateSelectorAfterInstantiationWarning: () =>
      Agile.logger.warn(
        "We recommend using 'createSelector()' instead of 'Selector()' outside the Collection configuration object"
      ),
    itemAtKeyDoesNotExistInCollectionError: (
      itemKey: any,
      collectionKey: any
    ) =>
      Agile.logger.error(
        `Item with key/name '${itemKey}' doesn't exist in Collection '${collectionKey}'!`
      ),
    validObjectRequiredToUpdateCollectionItemError: (
      itemKey: any,
      collectionKey: any
    ) =>
      Agile.logger.error(
        `You have to pass an valid Changes Object to update '${itemKey}' in '${collectionKey}'!`
      ),
    overwriteWholeItemWarning: (changes: any) =>
      Agile.logger.warn(
        `By overwriting the whole Item you have to pass the correct itemKey into the changes object!`,
        changes
      ),
    useGroupMethodBeforeInstantiationWarning: () =>
      Agile.logger.warn(
        "We recommend using 'Group()' instead of 'createGroup()' in the Collection configuration object!"
      ),
    useSelectorMethodBeforeInstantiationWarning: () =>
      Agile.logger.warn(
        "We recommend using 'Selector()' instead of 'createSelector()' in the Collection configuration object!"
      ),
    couldNotUpdateItemKeyBecauseItemKeyAlreadyExistsError: (
      oldItemKey: any,
      newItemKey: any
    ) =>
      Agile.logger.error(
        `Couldn't update ItemKey from '${oldItemKey}' to '${newItemKey}' because an Item with the key/name '${newItemKey}' already exists!`
      ),
    itemDataHasToBeValidObjectError: (collectionKey: any) =>
      Agile.logger.error(
        `Item Data of Collection '${collectionKey}' has to be an valid Object!`
      ),
    itemDataHasToContainPrimaryKeyWarning: (
      collectionKey: any,
      primaryKeyProperty: any
    ) =>
      Agile.logger.warn(
        `Collection '${collectionKey}' Item Data should contain a primaryKey property called '${primaryKeyProperty}'!`
      ),

    // Group
    couldNotFindItemsInCollectionWarning: (
      collectionKey: any,
      groupKey: any,
      notFoundItemKeys: any
    ) =>
      Agile.logger.warn(
        `Couldn't find Items in Collection '${collectionKey}' during the rebuild of the Group '${groupKey}'`,
        notFoundItemKeys
      ),

    // Utils
    classMethodXNotSet: (methodName: string, className: string) =>
      Agile.logger.error(
        `${methodName}() isn't set in ${className} but need to be set! ${className} is no stand alone class.`
      ),
    canNotUseMethodXOnClassX: (
      methodName: string,
      className: string,
      reason: string
    ) =>
      Agile.logger.error(
        `We can't use the '${methodName}()' in the ${className}! ${reason}`
      ),
    xAlreadyExistsAtKeyYError: (x: any, y: any) =>
      Agile.logger.error(`${x} with the key/name '${y}' already exists!`),
    xDoesNotExistsAtKeyYError: (x: any, y: any) =>
      Agile.logger.error(`${x} with the key/name '${y}' doesn't exists!`),
    xHasToBeOfTheTypeYError: (x: any, y: any) =>
      Agile.logger.error(`${x} has to be of the type ${y}!`),
  };

  constructor() {
    // empty
  }
}
