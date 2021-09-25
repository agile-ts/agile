import mockConsole from 'jest-mock-console';
import { LogCodesArrayType, logCodeManager } from '../../src';

type LogTypes = 'log' | 'warn' | 'error';

type LoggerTypes = LogTypes | 'success' | 'info';

const logPrefixes = {
  success: 'Agile Success',
  info: 'Agile Info',
  error: 'Agile Error',
  warn: 'Agile Warn',
  log: 'Agile Log',
};

const logTypes = {
  success: 'log',
  info: 'log',
  error: 'error',
  warn: 'warn',
  log: 'log',
};

function mockLogs(mockArg?: LogTypes[]): void {
  const _mockArg = mockArg ?? ['warn', 'error', 'log'];
  mockConsole(_mockArg);
}

function hasLogged(type: LoggerTypes, ...data: any[]): void {
  expect(console[logTypes[type]]).toHaveBeenCalled();
  if (data.length > 0)
    expect(console[logTypes[type]]).toHaveBeenCalledWith(
      ...getLogArguments(type, ...data)
    );
}

function hasNotLogged(type: LoggerTypes, ...data: any[]): void {
  expect(console[logTypes[type]]).not.toHaveBeenCalled();
  if (data.length > 0)
    expect(console[logTypes[type]]).not.toHaveBeenCalledWith(
      ...getLogArguments(type, ...data)
    );
}

function getLogArguments(type: LoggerTypes, ...data: any[]): any[] {
  return [
    `${logPrefixes[type]}: ${data[0]}`,
    ...data.filter((v, i) => i !== 0),
  ];
}

function hasLoggedCode<
  T extends LogCodesArrayType<typeof logCodeManager.logCodeMessages>
>(logCode: T, replacers: any[] = [], ...data: any[]): void {
  const codes = logCode.split(':');
  if (codes.length === 3)
    hasLogged(
      logCodeManager.logCodeLogTypes[codes[1]] as any,
      ...[logCodeManager.getLog(logCode, replacers)],
      ...data
    );
}

function hasNotLoggedCode<
  T extends LogCodesArrayType<typeof logCodeManager.logCodeMessages>
>(logCode: T, replacers: any[] = [], ...data: any[]) {
  const codes = logCode.split(':');
  if (codes.length === 3)
    hasNotLogged(
      logCodeManager.logCodeLogTypes[codes[1]] as any,
      ...[logCodeManager.getLog(logCode, replacers)],
      ...data
    );
}

export const LogMock = {
  mockLogs,
  hasLogged,
  hasNotLogged,
  hasLoggedCode,
  hasNotLoggedCode,
};
