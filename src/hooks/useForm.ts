import { useCallback, useMemo, useState } from 'react';

type Errors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends object>(initial: T, validate: (values: T) => Errors<T>) {
  const [values, setValues] = useState<T>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const errors = useMemo(() => validate(values), [values, validate]);
  const isValid = Object.keys(errors).length === 0;

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  const reset = useCallback((next = initial) => {
    setValues(next);
    setTouched({});
  }, [initial]);

  return { values, errors, touched, isValid, setField, reset, setValues, setTouched };
}
