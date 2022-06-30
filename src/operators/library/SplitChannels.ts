import { DataType, Input, Operator, Output, Parameter } from '..';
import { defLocal, Expr, getAttr, refInput, refLocal, refTexCoords } from '../../render/Expr';
import { GraphNode, OutputTerminal } from '../../graph';
import { lowerExprs } from '../../render/pass/transform';

class SplitChannels extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.VEC4,
    },
  ];
  public readonly outputs: Output[] = [
    {
      id: 'r',
      name: 'R',
      type: DataType.FLOAT,
    },
    {
      id: 'g',
      name: 'G',
      type: DataType.FLOAT,
    },
    {
      id: 'b',
      name: 'B',
      type: DataType.FLOAT,
    },
    {
      id: 'a',
      name: 'A',
      type: DataType.FLOAT,
    },
  ];
  public readonly params: Parameter[] = [];

  public readonly description = `Separates the red, green, blue and alpha channels as separate outputs.`;

  constructor() {
    super('filter', 'Split Channels', 'filter_split_channels');
  }

  public getCode(node: GraphNode, terminal: OutputTerminal, prologue: Expr[]): Expr {
    // Put the RGBA value on the input into a temp var so that it can be used for multiple
    // output terminals without recalculating.
    const tmpVarName = `split_input_${node.id}`;

    // See if the variable has already been defined in the prologue and re-use it, otherwise
    // initialize a new var.
    let tmpVar = prologue.find(expr => expr.kind === 'deflocal' && expr.name === tmpVarName);
    if (!tmpVar) {
      const rgba = refInput('in', DataType.VEC4, node, refTexCoords());
      tmpVar = defLocal(tmpVarName, DataType.VEC4, rgba);
      lowerExprs(tmpVar, prologue);
    }

    const tmpVarRef = refLocal(tmpVarName, DataType.VEC4);
    return getAttr(tmpVarRef, terminal.id, DataType.FLOAT);
  }
}

export default new SplitChannels();
