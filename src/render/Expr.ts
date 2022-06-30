import { DataType } from '../operators';
import { GraphNode } from '../graph';
import { FunctionDefn, OverloadDefn } from '../operators/FunctionDefn';

export type ExprKind =
  | 'assign'
  | 'call'
  | 'ovcall'
  | 'op'
  | 'deflocal'
  | 'reflocal'
  | 'refuniform'
  | 'refinput'
  | 'reftexcoords'
  | 'literal'
  | 'typecast'
  | 'getattr'
  | 'binop'
  | 'fork';

export type BinaryOperator = 'add' | 'sub' | 'mul' | 'div';

export interface BaseExpr {
  kind: ExprKind;
  type: DataType;
}

/** An assignment expression. */
export interface AssignExpr extends BaseExpr {
  kind: 'assign';
  left: Expr;
  right: Expr;
}

/** Constructor for assignment expression. */
export const assign = (left: Expr, right: Expr): AssignExpr => ({
  type: left.type,
  kind: 'assign',
  left,
  right,
});

/** An function call expression. */
export interface CallExpr extends BaseExpr {
  kind: 'call';
  callable: FunctionDefn;
  args: ExprOrLiteral[];
}

/** Constructor for function call expression. */
export const call = (callable: FunctionDefn, ...args: ExprOrLiteral[]): CallExpr => ({
  kind: 'call',
  args,
  type: callable.type.length > 1 ? DataType.OTHER : callable.type[0].result,
  callable,
});

export interface OverloadCallExpr extends BaseExpr {
  kind: 'ovcall';
  callable: OverloadDefn;
  args: Expr[];
}

export const ovcall = (callable: OverloadDefn, ...args: Expr[]): OverloadCallExpr => ({
  kind: 'ovcall',
  args,
  type: callable.type.result,
  callable,
});

export interface LocalDefn extends BaseExpr {
  kind: 'deflocal';
  name: string;
  type: DataType;
  init: Expr | null;
}

export const defLocal = (
  name: string,
  type: DataType,
  init: Expr | null = null
): LocalDefn => ({
  kind: 'deflocal',
  name,
  type,
  init,
});

/** Reading a local variable. */
export interface RefLocalExpr extends BaseExpr {
  kind: 'reflocal';
  name: string;
  type: DataType;
}

/** Constructor for reading a local variable. */
export const refLocal = (name: string, type: DataType): RefLocalExpr => ({
  kind: 'reflocal',
  name,
  type,
});

/** Reading a node parameter. */
export interface RefUniformExpr extends BaseExpr {
  kind: 'refuniform';
  name: string;
  type: DataType;
  node: GraphNode;
}

/** Constructor for reading a node parameter. */
export const refUniform = (name: string, type: DataType, node: GraphNode): RefUniformExpr => ({
  kind: 'refuniform',
  name,
  type,
  node,
});

/** Reading an input terminal. */
export interface RefInputExpr extends BaseExpr {
  kind: 'refinput';
  name: string;
  type: DataType;
  node: GraphNode;
  uv: Expr;
}

/** Constructor for reading from an input terminal. */
export const refInput = (
  name: string,
  type: DataType,
  node: GraphNode,
  uv: Expr
): RefInputExpr => ({
  kind: 'refinput',
  name,
  type,
  node,
  uv,
});

export interface RefTexCoordsExpr extends BaseExpr {
  kind: 'reftexcoords';
  type: DataType;
}

export const refTexCoords = (): RefTexCoordsExpr => ({
  kind: 'reftexcoords',
  type: DataType.VEC2,
});

export interface LiteralNode extends BaseExpr {
  kind: 'literal';
  value: string;
}

export const literal = (value: string, type: DataType): LiteralNode => ({
  kind: 'literal',
  value,
  type,
});

export interface TypeCastExpr extends BaseExpr {
  kind: 'typecast';
  value: Expr;
}

export const typeCast = (value: Expr, type: DataType): TypeCastExpr => ({
  kind: 'typecast',
  value,
  type,
});

export interface GetAttrExpr extends BaseExpr {
  kind: 'getattr';
  base: Expr;
  name: string;
  type: DataType;
}

export const getAttr = (base: Expr, name: string, type: DataType): GetAttrExpr => ({
  kind: 'getattr',
  base,
  name,
  type,
});

export interface BinaryOpExpr extends BaseExpr {
  kind: 'binop';
  op: BinaryOperator;
  left: Expr;
  right: Expr;
  type: DataType;
}

export const binop = (
  op: BinaryOperator,
  left: Expr,
  right: Expr,
  type: DataType
): BinaryOpExpr => ({
  kind: 'binop',
  op,
  left,
  right,
  type,
});

export const add = (left: Expr, right: Expr, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'add',
  left,
  right,
  type,
});

export const multiply = (left: Expr, right: Expr, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'mul',
  left,
  right,
  type,
});

export const subtract = (left: Expr, right: Expr, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'sub',
  left,
  right,
  type,
});

export const divide = (left: Expr, right: Expr, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'div',
  left,
  right,
  type,
});

/** A 'fork' is a hint to the code generator that we are going to use the expression
    multiple times, and we might not want to re-evaluate it, so store it in a local
    variable if needed.
 */
export interface ForkExpr extends BaseExpr {
  kind: 'fork';
  value: Expr;
  name: string;
  key: symbol;
  type: DataType;
}

export const fork = (value: Expr, name: string): ForkExpr => ({
  kind: 'fork',
  value,
  name,
  key: Symbol('expr'),
  type: value.type,
});

export type Expr =
  | AssignExpr
  | CallExpr
  | OverloadCallExpr
  | LocalDefn
  | RefLocalExpr
  | RefUniformExpr
  | RefInputExpr
  | RefTexCoordsExpr
  | LiteralNode
  | TypeCastExpr
  | GetAttrExpr
  | BinaryOpExpr
  | ForkExpr;

export type ExprOrLiteral = Expr | string | number;

export interface CallFactory {
  (...args: ExprOrLiteral[]): CallExpr;
  defn: FunctionDefn;
}

export function defineFn(defn: FunctionDefn): CallFactory {
  function fn(...args: ExprOrLiteral[]): CallExpr {
    return {
      kind: 'call',
      args,
      type: DataType.OTHER,
      callable: defn,
    };
  }
  fn.defn = defn;
  return fn;
}
