'use client'

import { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import Spinner from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'outline' | 'ghost'
  fullWidth?: boolean
}

export default function Button({
  children,
  loading,
  variant = 'primary',
  fullWidth,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'flex items-center justify-center gap-2 px-6 py-3',
        'text-[0.72rem] tracking-[0.2em] uppercase font-medium',
        'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-dark text-alluri-white hover:bg-gold',
        variant === 'outline' && 'border border-dark text-dark hover:bg-dark hover:text-alluri-white',
        variant === 'ghost'   && 'text-alluri-muted hover:text-dark underline underline-offset-2',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}
