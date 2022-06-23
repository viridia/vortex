import { DataType } from '../operators';
import { glType } from '../operators/DataType';
import { ExprOrLiteral, Expr, literal, typeCast } from './Expr';

export function castIfNeeded(expr: ExprOrLiteral, type: DataType): Expr {
  if (typeof expr === 'number') {
    if (type === DataType.FLOAT) {
      return literal(formatFloat(expr), type);
    } else if (type === DataType.INTEGER) {
      return literal(formatInteger(expr), type);
    } else {
      throw Error(`Invalid literal type: ${DataType[type]}: ${JSON.stringify(expr)}`);
    }
  } else if (typeof expr === 'string') {
    if (type === DataType.FLOAT) {
      return literal(formatFloat(Number(expr)), type);
    } else if (type === DataType.INTEGER) {
      return literal(formatInteger(Number(expr)), type);
    } else {
      throw Error(`Invalid literal type: ${DataType[type]}: ${JSON.stringify(expr)}`);
    }
  } else if (expr.type === type || glType(expr.type) === glType(type)) {
    return expr;
  } else if (type === DataType.OTHER) {
    throw Error(`Undetermined type: ${expr.kind}`);
  } else {
    return typeCast(expr, type);
  }
}

export function formatFloat(value: number): string {
  if (isNaN(value)) {
    throw Error('Not a number');
  }

  const str = String(value);
  if (!str.includes('.')) {
    return str + '.';
  } else {
    return str.replace(/^(-?)0(\.\d+)$/, '$1$2');
  }
}

export function formatInteger(value: number): string {
  if (isNaN(value)) {
    throw Error('Not a number');
  }

  if (value !== Math.fround(value)) {
    throw Error('Not an integer');
  }

  const result = String(value);
  if (result.includes('.')) {
    throw Error(`Invalid integer literal: ${value}`);
  }

  return result;
}
