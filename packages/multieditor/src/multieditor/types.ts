import { ItemKey } from '../item';
import { ComputeValueMethod, StateRuntimeJobConfigInterface } from '@agile-ts/core';
import { ValidationMethodInterface, Validator } from '../validator';
import { Multieditor } from './multieditor';

// Resources:
// 'keyof': https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html
// Conditional Types: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html

// Inspiration
// https://react-hook-form.com/get-started#TypeScript

export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

declare const $NestedValue: unique symbol;

export type NestedValue<TValue extends Object = Object> = {
  [$NestedValue]: never;
} & TValue;

// Creates an object type based on the specified object were each property is optional
export type DeepPartial<T> = {
  [K in keyof T]?: DeepPartialImpl<T[K]>;
};

type DeepPartialImpl<T> = T extends NestedValue
  ? T
  : T extends ReadonlyArray<any> | Record<any, unknown>
    ? DeepPartial<T>
    : T;

// Creates an object type based on the specified object were each property at the top level is optional
export type ShallowPartial<T> = {
  [K in keyof T]?: T;
};


// Extracts each path to a property from the specified object
export type DeepPaths<T> = {
  [K in keyof T]: DeepPathsImpl<K & string, T[K]>;
}[keyof T];

type DeepPathsImpl<K extends string | number, V> = V extends Primitive
  ? `${K}`
  : `${K}` | `${K}.${DeepPaths<V>}`;

// Extracts each path to a property at the top level of the specified object
export type FlatPaths<T> = {
  [K in keyof T]: T[K] extends any ? K : never;
}[keyof T]

// Extracts the value type of the specified Path (P) in the provided object (T) at top level
export type DeepPathValues<T, P extends DeepPaths<T> | string | number> = T extends any
  ? P extends `${infer K}.${infer R}` // if having nested Path like 'image.id'
    ? K extends keyof T
      ? R extends DeepPaths<T[K]>
        ? DeepPathValues<T[K], R>
        : never
      : never
    : P extends keyof T // if having normal Path like 'name'
      ? T[P]
      : never
  : never;


export type DeepFieldPaths<TFieldData extends FieldData> = DeepPaths<TFieldData> | ItemKey;

export type FieldPaths<TFieldData extends FieldData> = FlatPaths<TFieldData> | ItemKey;

export type FieldData = Record<string, any>;

export type DeepFieldPathValues<
  TFieldData extends FieldData,
  TFieldPath extends DeepFieldPaths<TFieldData>,
  > = DeepPathValues<TFieldData, TFieldPath>;


export type EditorKey = string | number;

export interface CreateEditorConfigInterface<
  TFieldData extends FieldData = FieldData
  > {
  /**
   * Key/Name identifier of the Multieditor.
   * @default undefined
   */
  key?: string;
  /**
   * Initial data of the Multieditor.
   * @default {}
   */
  initialData: TFieldData;
  /**
   * Key/name identifiers of Items whose values
   * to be always passed to the specified 'onSubmit()' method.
   * @default []
   */
  fixedProperties?: string[];
  /**
   * Key/Name identifiers of Items that can be edited.
   * @default Object.keys(config.initialData)
   */
  editableProperties?: string[];
  /**
   * Keymap to assign validation schemas to the individual Items of the Multieditor.
   * @default {}
   */
  validationSchema?: EditorValidationSchemaType;
  /**
   * Keymap to assign compute methods to the individual Items of the Multieditor.
   * @default {}
   */
  computeMethods?: { [key: string]: ComputeValueMethod };
  /**
   * Callback to be called when the Multieditor is submitted.
   * @default () => {}
   */
  onSubmit: (
    preparedData: ShallowPartial<TFieldData>,
    config?: any
  ) => Promise<any>;
  /**
   * In which circumstances the Multieditor is revalidated.
   * @default 'onSubmit'
   */
  reValidateMode?: ValidationMode;
  /**
   * What type of data should be revalidated.
   * @default 'editable'
   */
  toValidate?: ValidateType;
}

export type EditorValidationSchemaType = {
  [key: string]: ValidationMethodInterface | Validator;
};

export interface EditorConfigInterface {
  /**
   * In which circumstances the Multieditor is revalidated.
   * @default 'onSubmit'
   */
  reValidateMode: ValidationMode;
  /**
   * What type of data should be revalidated.
   * @default 'editable'
   */
  toValidate: ValidateType;
}

export type EditorConfig<TFieldData extends FieldData = FieldData> =
  | CreateEditorConfigInterface<TFieldData>
  | ((
  editor: Multieditor<TFieldData>
) => CreateEditorConfigInterface<TFieldData>);

export interface SubmitConfigInterface<OnSubmitConfigType = any> {
  /**
   * Whether the submitted values should be assigned
   * as the initial values of the corresponding Items.
   * @default true
   */
  assignToInitial?: boolean;
  /**
   * Configuration object that is passed into the 'onSubmit()' method.
   * @default {}
   */
  onSubmitConfig?: OnSubmitConfigType;
}

export interface UpdateInitialValueConfigInterface
  extends StateRuntimeJobConfigInterface {
  /**
   * Whether the new initial Item value should be applied to the current Item value.
   * @default true
   */
  reset?: boolean;
}

export interface RecomputeValidatedStateMethodConfigInterface {
  /**
   * Whether all Items should be revalidated
   * before the validation state of the Multieditor is computed.
   * @default true
   */
  validate?: boolean;
}

export type ValidationMode = 'onChange' | 'onSubmit' | 'onBlur' | 'afterFirstSubmit';
export type ValidateType = 'all' | 'editable';
