import { createSignal } from 'solid-js';

export function makeObservable<Cls extends {}, K extends keyof Cls>(target: Cls, keys: K[]) {
  keys.forEach(key => {
    const value = target[key];
    const [getter, setter] = createSignal(value);
    Reflect.defineProperty(target, key, {
      get: getter,
      set: setter,
    });
  });
}
