import { ExprOrLiteral } from './Expr';

export function equalExpr(e0: ExprOrLiteral | null, e1: ExprOrLiteral | null): boolean {
  if (e0 === e1) {
    return true;
  }

  if (
    typeof e0 === 'number' ||
    typeof e0 === 'string' ||
    typeof e1 === 'number' ||
    typeof e1 === 'string' ||
    e0 === null ||
    e1 === null
  ) {
    return false;
  }

  if (e0.type !== e1.type) {
    return false;
  }

  switch (e0.kind) {
    case 'assign':
      return e1.kind === 'assign' && equalExpr(e0.left, e1.left) && equalExpr(e0.right, e1.right);

    case 'call':
      return e1.kind === 'call' && e0.callable === e1.callable && equalExprList(e0.args, e1.args);

    case 'ovcall':
      return e1.kind === 'ovcall' && e0.callable === e1.callable && equalExprList(e0.args, e1.args);

    case 'deflocal':
      return e1.kind === 'deflocal' && e0.name === e1.name && equalExpr(e0.init, e1.init);

    case 'reflocal':
      return e1.kind === 'reflocal' && e0.name === e1.name;

    case 'refuniform':
      return e1.kind === 'refuniform' && e0.name === e1.name && e0.node === e1.node;

    case 'refinput':
      return (
        e1.kind === 'refinput' &&
        e0.name === e1.name &&
        e0.node === e1.node &&
        equalExpr(e0.uv, e1.uv)
      );

    case 'reftexcoords':
      return e1.kind === 'reftexcoords';

    case 'literal':
      return e1.kind === 'literal' && e0.value === e1.value;

    case 'typecast':
      return e1.kind === 'typecast' && e0.value === e1.value;

    case 'getattr':
      return e1.kind === 'getattr' && e0.base === e1.base && e0.name === e1.name;

    case 'binop':
      return (
        e1.kind === 'binop' &&
        e0.op === e1.op &&
        equalExpr(e0.left, e1.left) &&
        equalExpr(e0.right, e1.right)
      );

    case 'fork':
      return e1.kind === 'fork' && equalExpr(e0.value, e1.value) && e0.name === e1.name;

    default:
      return false;
  }
}

export function equalExprList(e0: ExprOrLiteral[], e1: ExprOrLiteral[]): boolean {
  if (e0.length !== e1.length) {
    return false;
  }
  return e0.every((element, index) => equalExpr(element, e1[index]));
}
