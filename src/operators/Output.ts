import { DataType } from './DataType';

export interface Output {
  // Variable name of this output
  id: string;

  // Human-readable name of this output
  name: string;

  // Output data type
  type: DataType;
}
