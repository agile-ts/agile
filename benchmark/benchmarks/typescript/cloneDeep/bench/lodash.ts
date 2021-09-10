// @ts-ignore
import _ from 'lodash';

export function cloneDeep<T = any>(value: T): T {
  return _.cloneDeep(value);
}
