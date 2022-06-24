import { GraphNode } from '../graph';
import { DataType } from './DataType';

export interface EnumValue {
  name: string;
  value: number;
}

export type EditorType = 'color' | null;

/** Defines an operator parameter. */
export interface Parameter {
  // Variable name of this parameter
  id: string;

  // Human-readable name of this parameter
  name: string;

  // Parameter type
  type: DataType;

  // What UI editor to use for this parameter.
  editor?: EditorType;

  // Type-specific constraints
  default?: any;
  min?: number;
  max?: number;
  increment?: number;
  precision?: number;
  noAlpha?: boolean;
  enumVals?: EnumValue[]; // For enumerations
  children?: Parameter[]; // If this is a group

  // Indicates that this is not a uniform, but occurs in the preprocessing (code generation) phase.
  pre?: boolean;

  // This parameter's value is derived from other parameters.
  computed?: (node: GraphNode) => any;
}
