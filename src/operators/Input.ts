import { DataType } from './DataType';

/** Defines an output terminal. */
export interface Input {
  // Variable name of this input
  id: string;

  // Human-readable name of this input
  name: string;

  // Data type
  type: DataType;

  // Whether this input requires a complete buffer (for sampling and such)
  buffered?: boolean;
}
