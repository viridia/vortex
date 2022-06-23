/** Computes the union of two sets. Avoids creating a new set unless needed. */
export function union<T>(ls: Set<T>, rs: Set<T>): Set<T> {
  // If left is empty, return right.
  if (ls.size === 0) {
    return rs;
  }

  let result: Set<T> | null = null;
  for (const item of rs.values()) {
    // Copy-on-write
    if (!ls.has(item)) {
      if (!result) {
        result = new Set(ls);
      }
      result.add(item);
    }
  }

  return result || ls;
}
