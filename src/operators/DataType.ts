/** Data types for expressions. */
export enum DataType {
  INTEGER,// Integer
  FLOAT,  // float
  VEC2,     // vec2
  VEC3,    // vec3
  VEC4,   // vec4 rgba
  RGBA_GRADIENT,  // Gradient array
  IMAGE,  // Image reference
  OTHER,  // Placeholder, not used as operator output

  // Implementation-level types
  FLOAT_ARRAY,  // array of floats
  VEC4_ARRAY,  // array of vec4

  // TODO: Don't use types for this.
  GROUP,  // Sentinel value that indicates a parameter group
}

// Returns the WebGL type for a given datatype.
export function glType(type: DataType): string {
  switch (type) {
    case DataType.INTEGER:
      return 'int';
    case DataType.FLOAT:
      return 'float';
    case DataType.VEC2:
      return 'vec2';
    case DataType.VEC3:
      return 'vec3';
    case DataType.VEC4:
      return 'vec4';
    case DataType.IMAGE:
      return 'sampler2D';
    default:
      throw Error(`Invalid GLSL type: ${DataType[type]}`);
  }
}
