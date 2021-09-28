import { ChangeEvent, useState } from 'react';
import { Agile, shared } from '@agile-ts/core';
import type {
  EditorConfig,
  Multieditor,
  StatusInterface,
  SubmitConfigInterface,
  FieldPaths,
  Item,
} from '@agile-ts/multieditor';
import { useAgile } from '../../core';
import { logCodeManager } from '../../logCodeManager';
import { multieditorPackage } from '../multieditorPackage';
import { FieldData } from '@agile-ts/multieditor';

export function useMultieditor<TFieldData extends FieldData = FieldData>(
  configOrMultieditor: EditorConfig<TFieldData> | Multieditor<TFieldData>,
  agileInstance: Agile = shared
): UseMultieditorReturnInterface<TFieldData> {
  // Return if '@agile-ts/multieditor' isn't installed
  if (multieditorPackage == null) {
    logCodeManager.log('34:03:00');
    return null as any;
  }

  // Retrieve Multieditor
  const [multieditor] = useState(
    configOrMultieditor instanceof multieditorPackage.Multieditor
      ? configOrMultieditor
      : new multieditorPackage.Multieditor(configOrMultieditor, agileInstance)
  );

  // Subscribe Multieditor dependencies to the React Component
  useAgile(multieditor.deps);

  // Inserts the most important 'props' into the React Component
  const insertItem = (
    itemKey: FieldPaths<TFieldData>
  ): InsertMethodConfigInterface => {
    const item = multieditor.getItem(itemKey);
    if (item == null) return {};

    const isComputed = item.computeValueMethod != null;
    const onChange = (e: any) => {
      const nextValue = e?.target?.value;
      if (nextValue != null) {
        multieditor.setValue(itemKey, nextValue, {
          background: !isComputed, // If the value is computed, we need a controlled input (-> re-render on every value change)
        });
      }
    };

    // Compute value property
    let value = isComputed ? item.value : undefined;
    if (typeof value !== 'number' && typeof value !== 'string')
      value = undefined;

    // Compute defaultValue property
    let defaultValue = item.initialStateValue as any;
    if (typeof defaultValue !== 'number' && typeof defaultValue !== 'string')
      defaultValue = undefined;

    return {
      defaultValue,
      onChange,
      value,
    };
  };

  // Submits the Multieditor
  const submit = async (
    config: SubmitConfigInterface = {}
  ): Promise<any | false> => {
    return await multieditor.submit(config);
  };

  // Retrieves the Status of the Item with the specified key/name identifier
  const status = (itemKey: FieldPaths<TFieldData>): StatusInterface | null => {
    return multieditor.getStatus(itemKey);
  };

  // Retrieves a single Item with the specified key/name identifier from the Multieditor
  const item = (itemKey: FieldPaths<TFieldData>): Item | null => {
    return multieditor.getItem(itemKey);
  };

  return { editor: multieditor, insertItem, submit, status, item };
}

export interface InsertMethodConfigInterface {
  /**
   * Default value property containing the default value of the React Component.
   */
  defaultValue?: string | number;
  /**
   * Value property containing the current value of the React Component.
   * This property is only set in case of a controlled input.
   */
  value?: string | number;
  /**
   * 'onChange()' method.
   */
  onChange?: (event: ChangeEvent) => void;
}

// When using Interface the object destruction has no full intellij
// https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces
export type UseMultieditorReturnInterface<
  TFieldData extends FieldData = FieldData
> = {
  /**
   * Multieditor that manages all the Form tasks.
   */
  editor: Multieditor<TFieldData>;
  /**
   * Submits the Multieditor.
   *
   * @param config - Configuration object
   */
  submit: (config?: SubmitConfigInterface) => Promise<any | false>;
  /**
   * Inserts the most important 'props' into the React Component.
   *
   * @param itemKey - Key/Name identifier of the Item.
   */
  insertItem: (itemKey: FieldPaths<TFieldData>) => InsertMethodConfigInterface;
  /**
   * Retrieves the Status of the Item with the specified key/name identifier.
   *
   * If the to retrieve Status doesn't exist, `null` is returned.
   *
   * @param itemKey - Key/Name identifier of the Item.
   */
  status: (itemKey: FieldPaths<TFieldData>) => StatusInterface | null;
  /**
   * Retrieves a single Item with the specified key/name identifier from the Multieditor.
   *
   * If the to retrieve Item doesn't exist, `undefined` is returned.
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   */
  item: (itemKey: FieldPaths<TFieldData>) => Item | null;
};
