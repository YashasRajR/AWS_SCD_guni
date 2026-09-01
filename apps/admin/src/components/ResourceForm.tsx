import { useState } from 'react';
import type { FormEvent } from 'react';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '../lib/format.js';

export type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'datetime' | 'date' | 'multiselect';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  help?: string;
}

export type FormValues = Record<string, unknown>;

interface ResourceFormProps {
  fields: FieldDef[];
  initialValues?: FormValues;
  submitLabel: string;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
}

/** Converts a field's raw form-input state into the value the API expects (undefined = omit from the patch). */
function toApiValue(field: FieldDef, raw: unknown): unknown {
  if (field.type === 'checkbox') return Boolean(raw);
  if (field.type === 'multiselect') return Array.isArray(raw) ? raw : [];
  if (field.type === 'number') {
    if (raw === '' || raw === undefined || raw === null) return undefined;
    const n = Number(raw);
    return Number.isNaN(n) ? undefined : n;
  }
  if (field.type === 'datetime') {
    return fromDateTimeLocalValue(String(raw ?? ''));
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return raw;
}

function toInputValue(field: FieldDef, raw: unknown): string | boolean | string[] {
  if (field.type === 'checkbox') return Boolean(raw);
  if (field.type === 'multiselect') return Array.isArray(raw) ? (raw as string[]) : [];
  if (field.type === 'datetime') return toDateTimeLocalValue(raw as string | null | undefined);
  if (raw === null || raw === undefined) return '';
  return String(raw);
}

export function ResourceForm({ fields, initialValues, submitLabel, onSubmit, onCancel }: ResourceFormProps) {
  const [values, setValues] = useState<Record<string, string | boolean | string[]>>(() => {
    const initial: Record<string, string | boolean | string[]> = {};
    for (const field of fields) {
      initial[field.name] = toInputValue(field, initialValues?.[field.name]);
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (name: string, value: string | boolean | string[]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMultiselectValue = (name: string, optionValue: string, checked: boolean) => {
    setValues((prev) => {
      const current = Array.isArray(prev[name]) ? (prev[name] as string[]) : [];
      const next = checked ? [...current, optionValue] : current.filter((v) => v !== optionValue);
      return { ...prev, [name]: next };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: FormValues = {};
      for (const field of fields) {
        payload[field.name] = toApiValue(field, values[field.name]);
      }
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="resource-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div className="form-field" key={field.name}>
          <label htmlFor={field.name}>
            {field.label}
            {field.required ? ' *' : ''}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              id={field.name}
              value={values[field.name] as string}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              onChange={(e) => setField(field.name, e.target.value)}
            />
          ) : field.type === 'checkbox' ? (
            <input
              id={field.name}
              type="checkbox"
              checked={Boolean(values[field.name])}
              onChange={(e) => setField(field.name, e.target.checked)}
            />
          ) : field.type === 'multiselect' ? (
            <div className="multiselect">
              {field.options && field.options.length > 0 ? (
                field.options.map((opt) => {
                  const selected = Array.isArray(values[field.name])
                    ? (values[field.name] as string[]).includes(opt.value)
                    : false;
                  return (
                    <label className="multiselect-option" key={opt.value}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => toggleMultiselectValue(field.name, opt.value, e.target.checked)}
                      />
                      {opt.label}
                    </label>
                  );
                })
              ) : (
                <p className="form-help">No options available.</p>
              )}
            </div>
          ) : field.type === 'select' ? (
            <select
              id={field.name}
              value={values[field.name] as string}
              required={field.required}
              onChange={(e) => setField(field.name, e.target.value)}
            >
              {!field.required && <option value="">—</option>}
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={field.name}
              type={field.type === 'datetime' ? 'datetime-local' : field.type === 'date' ? 'date' : field.type}
              value={values[field.name] as string}
              placeholder={field.placeholder}
              required={field.required}
              onChange={(e) => setField(field.name, e.target.value)}
            />
          )}
          {field.help && <p className="form-help">{field.help}</p>}
        </div>
      ))}

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
