import { BinaryOpExpr, BinaryOperator, Expr } from '../Expr';
import { DataType } from '../../operators';
import { glType } from '../../operators/DataType';
import { OutputChunk, fcall, flat, parens, stmt, infix, lit } from '../codefmt/OutputChunk';

/** Code generator. Takes in an expression tree and outputs a string tree. */
export function generate(expr: Expr): OutputChunk {
  switch (expr.kind) {
    case 'assign': {
      // Bind the '=' more tightly to the first segment
      return stmt(infix('=', generate(expr.left), generate(expr.right)));
    }

    case 'ovcall': {
      const fnSig = expr.callable.type;
      if (expr.args.length !== fnSig.args.length) {
        throw Error(`Argument length mismatch: ${expr.callable.name}`);
      }
      return fcall(
        expr.callable.name,
        expr.args.map(arg => generate(arg))
      );
    }

    case 'deflocal': {
      if (expr.init) {
        // Bind the '=' more tightly to the first segment
        return stmt(infix('=', flat(glType(expr.type), ' ', expr.name), generate(expr.init)));
      } else {
        return flat(glType(expr.type), ' ', expr.name, ';');
      }
    }

    case 'reflocal': {
      return lit(expr.name);
    }

    case 'refuniform': {
      return lit(expr.node.operator.uniformName(expr.node.id, expr.name));
    }

    case 'typecast': {
      const srcType = expr.value.type;
      const dstType = expr.type;
      if (srcType === dstType) {
        return generate(expr.value);
      }

      switch (dstType) {
        case DataType.FLOAT:
          if (srcType === DataType.VEC4) {
            return fcall('dot', [generate(expr.value), lit('vec4(.3, .4, .3, 0.)')]);
          } else if (srcType === DataType.VEC3) {
            return fcall('dot', [generate(expr.value), lit('vec3(.3, .4, .3)')]);
          } else if (srcType === DataType.INTEGER) {
            return fcall('float', [generate(expr.value)]);
          }
          break;
        case DataType.VEC4:
          if (srcType === DataType.FLOAT) {
            return fcall('vec4', [
              infix('*', lit('vec3(1., 1., 1.)'), generate(expr.value)),
              lit('1.'),
            ]);
          }
          break;
        case DataType.VEC3:
          if (srcType === DataType.FLOAT) {
            return infix('*', lit('vec3(1., 1., 1.)'), generate(expr.value));
          }
          break;
        default:
          break;
      }
      console.error(`Bad cast ${DataType[srcType]} => ${DataType[dstType]}`);
      return flat(`badcast(${DataType[srcType]} ${DataType[dstType]})`, generate(expr.value));
      // throw Error(
      //   `Type conversion not supported: ${DataType[expr.type]} ${DataType[expr.value.type]}.`
      // );
    }

    case 'literal': {
      return lit(expr.value);
    }

    case 'getattr': {
      return flat(generate(expr.base), '.', expr.name);
    }

    case 'binop': {
      const parensIfNeeded = (expr: Expr, parent: BinaryOpExpr): OutputChunk => {
        const parentPrec = precedence[parent.op];
        if (expr.kind === 'binop') {
          if (expr.op === parent.op && commutative[parent.op]) {
            return generate(expr);
          }
          const argPrec = precedence[expr.op];
          if (argPrec <= parentPrec) {
            return parens(generate(expr));
          }
        }
        return generate(expr);
      };

      // TODO: Test that this works
      const left = parensIfNeeded(expr.left, expr);
      const right = parensIfNeeded(expr.right, expr);
      return flat(left, operator[expr.op], right);
    }

    default:
      console.error(`Not implemented: ${expr.kind}`);
      console.warn(JSON.stringify(expr, null, 2));
      throw new Error(`Not implemented: ${expr.kind}`);
  }
}

const operator: { [name in BinaryOperator]: string } = {
  add: ' + ',
  sub: ' - ',
  mul: ' * ',
  div: ' / ',
};

const precedence: { [name in BinaryOperator]: number } = {
  add: 1,
  sub: 1,
  mul: 2,
  div: 2,
};

const commutative: { [name in BinaryOperator]: boolean } = {
  add: true,
  sub: false,
  mul: true,
  div: false,
};
