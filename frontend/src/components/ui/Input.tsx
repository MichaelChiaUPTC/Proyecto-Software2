import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cx } from '@/utils/format'

interface FieldProps {
  label: string
  hint?: string
  error?: string
  success?: string
  hideLabel?: boolean
}

function Field({ id, label, hint, error, success, hideLabel, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={cx('field', error && 'field--error')}>
      <label htmlFor={id} className={cx('field__label', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="field__msg field__msg--error" role="alert">
          <AlertCircle size={14} aria-hidden /> {error}
        </p>
      ) : success ? (
        <p id={`${id}-msg`} className="field__msg field__msg--ok">{success}</p>
      ) : hint ? (
        <p id={`${id}-msg`} className="field__msg">{hint}</p>
      ) : null}
    </div>
  )
}

type InputProps = FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & { id?: string; trailing?: ReactNode; leading?: ReactNode }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, success, hideLabel, trailing, leading, className, id, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  const hasMsg = !!(error || success || hint)
  return (
    <Field id={fid} label={label} hint={hint} error={error} success={success} hideLabel={hideLabel}>
      <div className={cx('control', error && 'control--error', !!leading && 'control--lead')}>
        {leading && <span className="control__lead" aria-hidden>{leading}</span>}
        <input ref={ref} id={fid} className={cx('control__input', className)} aria-invalid={!!error || undefined} aria-describedby={hasMsg ? `${fid}-msg` : undefined} {...rest} />
        {trailing && <span className="control__trail">{trailing}</span>}
      </div>
    </Field>
  )
})

type TextareaProps = FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { id?: string }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, error, success, hideLabel, className, id, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  const hasMsg = !!(error || success || hint)
  return (
    <Field id={fid} label={label} hint={hint} error={error} success={success} hideLabel={hideLabel}>
      <textarea ref={ref} id={fid} className={cx('control control__input control__textarea', error && 'control--error', className)} aria-invalid={!!error || undefined} aria-describedby={hasMsg ? `${fid}-msg` : undefined} {...rest} />
    </Field>
  )
})

type SelectProps = FieldProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & { id?: string }

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, hint, error, success, hideLabel, className, id, children, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  const hasMsg = !!(error || success || hint)
  return (
    <Field id={fid} label={label} hint={hint} error={error} success={success} hideLabel={hideLabel}>
      <div className={cx('control control--select', error && 'control--error')}>
        <select ref={ref} id={fid} className={cx('control__input', className)} aria-invalid={!!error || undefined} aria-describedby={hasMsg ? `${fid}-msg` : undefined} {...rest}>
          {children}
        </select>
      </div>
    </Field>
  )
})
