/** Represents a rectangular bounding box. */
export class Bounds {
  public xMin: number;
  public xMax: number;
  public yMin: number;
  public yMax: number;

  constructor(xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity) {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
  }

  public clone(): Bounds {
    return new Bounds(this.xMin, this.yMin, this.xMax, this.yMax);
  }

  /** True if the bounds has a positive area. */
  public get empty() {
    return this.xMax <= this.xMin && this.yMax <= this.yMin;
  }

  /** Size of the bounds along the x-axis. */
  public get width() {
    return this.xMax - this.xMin;
  }

  /** Size of the bounds along the y-axis. */
  public get height() {
    return this.yMax - this.yMin;
  }

  /** True if the given point is within the bounds or on the edge. */
  public contains(x: number, y: number): boolean {
    return x >= this.xMin && x < this.xMax && y >= this.yMin && y <= this.yMax;
  }

  /** True if this bounds overlaps with another bounds. */
  public overlaps(b: Bounds): boolean {
    return b.xMax > this.xMin && b.xMin < this.xMax && b.yMax > this.yMin && b.yMin <= this.yMax;
  }

  /** Expand this bound to include a point. */
  public unionWith(x: number, y: number): this {
    this.xMin = Math.min(this.xMin, x);
    this.xMax = Math.max(this.xMax, x);
    this.yMin = Math.min(this.yMin, y);
    this.yMax = Math.max(this.yMax, y);
    return this;
  }

  /** Make this the intersection with another bounds. */
  public intersectWith(b: Bounds): this {
    this.xMin = Math.max(this.xMin, b.xMin);
    this.xMax = Math.min(this.xMax, b.xMax);
    this.yMin = Math.max(this.yMin, b.yMin);
    this.yMax = Math.min(this.yMax, b.yMax);
    return this;
  }

  /** Scale the coordinates of this bounds by some factor. */
  public scale(s: number): this {
    this.xMin *= s;
    this.xMax *= s;
    this.yMin *= s;
    this.yMax *= s;
    return this;
  }

  /** Offset this bounds by the given values. */
  public translate(dx: number, dy: number): this {
    this.xMin += dx;
    this.xMax += dx;
    this.yMin += dy;
    this.yMax += dy;
    return this;
  }

  /** Offset this bounds by the given values. */
  public expand(dx: number, dy: number): this {
    this.xMin -= dx;
    this.xMax += dx;
    this.yMin -= dy;
    this.yMax += dy;
    return this;
  }

  public toString(): string {
    return `Bounds2D(${this.xMin}, ${this.yMin}, ${this.xMax}, ${this.yMax})`;
  }
}
