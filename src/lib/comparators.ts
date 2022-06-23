/** Compare two sets for equality. */
export function equalSet<T>(ls: Set<T>, rs: Set<T>): boolean {
  if (ls.size !== rs.size) {
    return false;
  }

  for (const item of ls.values()) {
    if (!rs.has(item)) {
      return false;
    }
  }

  return true;
}