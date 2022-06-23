import { DataType } from '.';

export interface FunctionSignature {
  result: DataType;
  args: DataType[];
}

/** Defines the name and type of a callable function. */
export interface FunctionDefn {
  name: string;
  type: FunctionSignature[];
  body?: string;
}

/** Defines the name and type of a function overload. */
export interface OverloadDefn {
  name: string;
  type: FunctionSignature;
}

export function makeFunctionType(
  sigs: FunctionSignature | FunctionSignature[]
): FunctionSignature[] {
  return Array.isArray(sigs) ? sigs : [sigs];
}
