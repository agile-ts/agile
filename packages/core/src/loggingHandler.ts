import { Agile } from './internal';

export class LoggingHandler {
  public static logs = {
    // Agile

    // Persistent

    // Storage

    // Runtime

    // Integrations
    // State

    // Collection

    // Group

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
