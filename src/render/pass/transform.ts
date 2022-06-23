import { DataType } from '../../operators';
import { Expr, defLocal, refLocal, ExprOrLiteral, literal } from './../Expr';
import { castIfNeeded } from '../casting';
import { FunctionSignature, FunctionDefn } from '../../operators/FunctionDefn';
import { equalExpr } from '../comparators';

let textureCoords: Expr = refLocal('vTextureCoord', DataType.VEC2);

interface CachedSignal {
  fragCoords: ExprOrLiteral;
  expr: Expr;
}

export function transform(expr: Expr, out: Expr[]): void {
  let tmpVarIndex = 1;
  const tmpVarMap = new Map<Symbol, Expr>();
  const signalCache: {
    [signalId: string]: CachedSignal[];
  } = {};

  const visit = (expr: Expr): Expr => {
    switch (expr.kind) {
      case 'assign': {
        const left = visit(expr.left);
        const right = castIfNeeded(visit(expr.right), expr.left.type);
        if (expr.left === left && expr.right === right) {
          return expr;
        } else {
          return { ...expr, left, right };
        }
      }

      case 'call': {
        const argValues = expr.args.map(arg =>
          typeof arg === 'number' || typeof arg === 'string' ? arg : visit(arg)
        );
        const fnSig = findOverload(expr.callable, argValues);
        const args = argValues.map((arg, index) => castIfNeeded(arg, fnSig.args[index]));
        return {
          kind: 'ovcall',
          callable: { name: expr.callable.name, type: fnSig },
          args,
          type: fnSig.result,
        };
      }

      case 'reflocal':
      case 'refuniform':
      case 'typecast':
      case 'literal':
        return expr;

      case 'reftexcoords': {
        if (textureCoords.kind === 'reftexcoords') {
          throw Error('Bad texture coords');
        }
        return textureCoords;
      }

      case 'refinput': {
        // Return an expression representing the input to a terminal. This is the same as the
        // value from the connected output terminal, unless the input is not connected in Which
        // case the expression is zero. Also handles de-duping of expressions that are used in
        // more than one place.
        const { node, type, name } = expr;
        // const operator = node.operator;
        // const input = operator.getInput(name);
        const inputTerminal = node.getInputTerminal(name);
        if (!inputTerminal.connection) {
          return defaultValue(type);
        }

        const outputTerminal = inputTerminal.connection.source;
        const outputNode = outputTerminal.node;
        const fragCoords = visit(expr.uv);

        // If there's more than one node taking data from this output, see if they
        // can be combined.
        if (outputTerminal.connections.length > 1) {
          const srcNode = outputTerminal.node;
          const signalId = `${outputNode.operator.name}.${srcNode.id}.${outputTerminal.id}`;
          let signalList = signalCache[signalId];
          if (signalList) {
            for (const signal of signalList) {
              if (equalExpr(signal.fragCoords, fragCoords)) {
                return castIfNeeded(signal.expr, type);
              }
            }
          } else {
            signalList = [];
            signalCache[signalId] = signalList;
          }

          const result = outputNode.outputCode;
          const saveTextureCoords = textureCoords;
          textureCoords = fragCoords;
          const retVal = visit(result);
          textureCoords = saveTextureCoords;

          if (retVal.type === DataType.OTHER) {
            throw Error(`Type should have been decided by now: ${signalId}`);
          }

          if (isSimpleExpr(retVal)) {
            signalList.push({ fragCoords, expr: retVal });
            return castIfNeeded(retVal, type);
          }

          // Generate a temporary variable.
          const tmpVarDef = defLocal(`${outputTerminal.id}${tmpVarIndex}`, retVal.type, retVal);
          const tmpVarRef = refLocal(tmpVarDef.name, retVal.type);
          const key = Symbol('tmpVar');
          tmpVarMap.set(key, tmpVarRef);
          out.push(tmpVarDef);
          signalList.push({ fragCoords, expr: tmpVarRef });
          tmpVarIndex += 1;
          return castIfNeeded(tmpVarRef, type);
        }

        const result = outputNode.outputCode;
        const saveTextureCoords = textureCoords;
        textureCoords = fragCoords;
        const retVal = castIfNeeded(visit(result), type);
        textureCoords = saveTextureCoords;
        return retVal;
      }

      case 'getattr': {
        const base = visit(expr.base);
        if (base === expr.base) {
          return expr;
        } else {
          return { ...expr, base };
        }
      }

      case 'binop': {
        let leftType = expr.type;
        let rightType = expr.type;

        // GLSL allows multiplying or adding a vector by a scalar.
        if (expr.op === 'mul' || expr.op === 'add') {
          if (
            expr.type === DataType.VEC2 ||
            expr.type === DataType.VEC3 ||
            expr.type === DataType.VEC4
          ) {
            if (expr.left.type === DataType.FLOAT) {
              leftType = DataType.FLOAT;
            }
            if (expr.right.type === DataType.FLOAT) {
              rightType = DataType.FLOAT;
            }
          }
        }

        const left = castIfNeeded(visit(expr.left), leftType);
        const right = castIfNeeded(visit(expr.right), rightType);
        if (left === expr.left && right === expr.right) {
          return expr;
        } else {
          return { ...expr, left, right };
        }
      }

      case 'fork': {
        const value = visit(expr.value);
        if (value.type === DataType.OTHER) {
          throw Error(`Type should have been decided by now: ${expr.name}`);
        }

        if (isSimpleExpr(value)) {
          return value;
        }

        const tmpVar = tmpVarMap.get(expr.key);
        if (tmpVar) {
          return tmpVar;
        }

        // Generate a temporary variable.
        const tmpVarDef = defLocal(`${expr.name}${tmpVarIndex}`, value.type, value);
        const tmpVarRef = refLocal(tmpVarDef.name, value.type);
        tmpVarMap.set(expr.key, tmpVarRef);
        out.push(tmpVarDef);
        tmpVarIndex += 1;
        return tmpVarRef;
      }

      default:
        throw new Error(`Not implemented: ${expr.kind}`);
    }
  };
  out.push(visit(expr));
}

function isSimpleExpr(expr: Expr): boolean {
  switch (expr.kind) {
    case 'reflocal':
    case 'refuniform':
      return true;
    case 'literal':
      return expr.value.indexOf(',') < 0;
    case 'getattr':
      return isSimpleExpr(expr.base);
    default:
      return false;
  }
}

function findOverload(callable: FunctionDefn, args: ExprOrLiteral[]): FunctionSignature {
  for (const sig of callable.type) {
    if (sig.args.length === args.length) {
      if (args.every((arg, index) => canCast(arg, sig.args[index]))) {
        return sig;
      }
    }
  }

  console.error(args.map(arg => DataType[typeOfExpr(arg)]));
  throw Error(`No overload found for function: ${callable.name}`);
}

function typeOfExpr(e: ExprOrLiteral) {
  if (typeof e === 'number' || typeof e === 'string') {
    return DataType.OTHER;
  } else {
    return e.type;
  }
}

function canCast(expr: ExprOrLiteral, type: DataType): boolean {
  if (typeof expr === 'string') {
    expr = Number(expr);
  }

  if (typeof expr === 'number') {
    if (type === DataType.FLOAT || type === DataType.VEC4) {
      return true;
    } else if (type === DataType.INTEGER) {
      return Math.fround(expr) === expr;
    } else {
      return false;
    }
  }

  if (expr.type === type) {
    return true;
  } else if (expr.type === DataType.FLOAT) {
    if (type === DataType.VEC2 || type === DataType.VEC3 || type === DataType.VEC4) {
      return true;
    }
  }

  return false;
}

const DEFAULT_VALUE: { [key: number]: Expr } = {
  [DataType.INTEGER]: literal('0', DataType.INTEGER),
  [DataType.FLOAT]: literal('0.', DataType.FLOAT),
  [DataType.VEC2]: literal('vec2(0., 0.)', DataType.VEC2),
  [DataType.VEC3]: literal('vec3(0., 0., 0.)', DataType.VEC3),
  [DataType.VEC4]: literal('vec4(0., 0., 0., 0.)', DataType.VEC4),
};

export function defaultValue(type: DataType) {
  return DEFAULT_VALUE[type];
}
