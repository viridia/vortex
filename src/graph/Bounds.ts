import { batch } from 'solid-js';
import { makeObservable } from '../lib/makeObservable';

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

  /** Allocate a copy of this bounds object. */
  public clone(): Bounds {
    return new Bounds(this.xMin, this.yMin, this.xMax, this.yMax);
  }

  /** Set the coordinates of this bounds explicitly. */
  public set(xMin: number, yMin: number, xMax: number, yMax: number): Bounds {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
    return this;
  }

  /** Copy the state of another bounds object into this one. */
  public copy(from: Bounds): Bounds {
    this.xMin = from.xMin;
    this.yMin = from.yMin;
    this.xMax = from.xMax;
    this.yMax = from.yMax;
    return this;
  }

  /** Initialize this bounds to the empty bounds (negative infinite size). */
  public makeEmpty(): Bounds {
    this.xMin = Infinity;
    this.xMax = -Infinity;
    this.yMin = Infinity;
    this.yMax = -Infinity;
    return this;
  }

  /** Return true if the two bounds are equal. */
  public equals(other: Bounds): boolean {
    return (
      this.xMin === other.xMin &&
      this.xMax === other.xMax &&
      this.yMin === other.yMin &&
      this.yMax === other.yMax
    );
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

  /** Expand this bound to include the given vertex. */
  public expandVertex(x: number, y: number): this {
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

  /** Make this the intersection with another bounds. */
  public unionWith(b: Bounds): this {
    this.xMin = Math.min(this.xMin, b.xMin);
    this.xMax = Math.max(this.xMax, b.xMax);
    this.yMin = Math.min(this.yMin, b.yMin);
    this.yMax = Math.max(this.yMax, b.yMax);
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

  /** Increase the size of this bounds by the given values. */
  public expand(dx: number, dy: number): this {
    this.xMin -= dx;
    this.xMax += dx;
    this.yMin -= dy;
    this.yMax += dy;
    return this;
  }

  public toString(): string {
    return `Bounds(${this.xMin}, ${this.yMin}, ${this.xMax}, ${this.yMax})`;
  }
}

// export class ObservableBounds extends Bounds {
//   constructor(xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity) {
//     super(xMin, yMin, xMax, yMax);
//     makeObservable(this, ['xMin', 'yMin', 'xMax', 'yMax']);
//   }

//   public override makeEmpty(): Bounds {
//     return batch(() => super.makeEmpty());
//   }

//   public override copy(from: Bounds): Bounds {
//     return batch(() => super.copy(from));
//   }

//   public override intersectWith(from: Bounds): this {
//     return batch(() => super.intersectWith(from));
//   }

//   public override unionWith(from: Bounds): this {
//     return batch(() => super.unionWith(from));
//   }

//   public override expand(dx: number, dy: number): this {
//     return batch(() => super.expand(dx, dy));
//   }

//   public override expandVertex(x: number, y: number): this {
//     return batch(() => super.expandVertex(x, y));
//   }

//   public override translate(dx: number, dy: number): this {
//     return batch(() => super.translate(dx, dy));
//   }

//   public override scale(s: number): this {
//     return batch(() => {
//       return super.scale(s);
//     });
//   }
// }
