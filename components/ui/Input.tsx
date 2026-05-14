'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helper?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <label className="text-[0.65rem] tracking-[0.18em] uppercase text-alluri-muted font-medium">
        {label}
        {props.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2.5 bg-white border text-sm text-dark placeholder-alluri-muted',
          'outline-none transition-colors duration-150',
          'focus:border-gold',
          error ? 'border-red-400' : 'border-alluri-border',
          className,
        )}
        {...props}
      />
      {error && (
        <p className="text-[0.7rem] text-red-500 mt-0.5">{error}</p>
      )}
      {helper && !error && (
        <p className="text-[0.68rem] text-alluri-muted mt-0.5">{helper}</p>
      )}
    </div>
  ),
)

Input.displayName = 'Input'
export default Input
