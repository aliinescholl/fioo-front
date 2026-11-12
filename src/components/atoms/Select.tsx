"use client"

import { useEffect, useId, useRef, useState } from "react"

export interface SelectOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export const DROPDOWN_MENU_CLASSES =
  "absolute left-0 right-0 mt-1.5 bg-white rounded-[12px] border border-[#d5e6e2] shadow-[0_8px_24px_rgba(42,89,77,0.12)] py-1.5 z-50 max-h-[240px] overflow-y-auto animate-[fadeIn_0.15s_ease-out]"

export const DROPDOWN_OPTION_BASE =
  "w-[calc(100%-8px)] mx-1 my-0.5 px-3 py-2 rounded-[8px] text-left text-sm flex items-center justify-between gap-2 transition-all duration-150 outline-none select-none"

export const DROPDOWN_OPTION_INTERACTIVE =
  "text-gray-700 hover:bg-[#e8f5f2] hover:text-[#2a594d] hover:shadow-[0_1px_3px_rgba(42,89,77,0.12)] focus-visible:bg-[#e8f5f2] focus-visible:text-[#2a594d] focus-visible:ring-2 focus-visible:ring-[#7EBEB2]/40 cursor-pointer"

export const DROPDOWN_OPTION_SELECTED =
  "bg-[#e8f5f2] text-[#2a594d] font-semibold shadow-[0_1px_2px_rgba(42,89,77,0.1)]"

export const DROPDOWN_OPTION_DISABLED =
  "opacity-50 cursor-not-allowed pointer-events-none bg-gray-50 text-gray-400"

type SelectProps<T extends string = string> = {
  id?: string
  value: T
  onChange: (value: T) => void
  options: readonly SelectOption<T>[]
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
  className?: string
  buttonClassName?: string
  menuClassName?: string
  icon?: React.ReactNode
  variant?: "default" | "pill"
}

export function Select<T extends string = string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  disabled = false,
  ariaLabel,
  className = "w-full",
  buttonClassName = "",
  menuClassName = "",
  icon,
  variant = "default",
}: SelectProps<T>) {
  const generatedId = useId()
  const triggerId = id ?? generatedId
  const listboxId = `${triggerId}-listbox`

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder
  const isPlaceholder = !selectedOption || selectedOption.value === ""

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const enabledOptions = options.filter(o => !o.disabled)
      if (enabledOptions.length === 0) return
      const currentIndex = enabledOptions.findIndex(o => o.value === value)
      const nextIndex =
        e.key === "ArrowDown"
          ? (currentIndex + 1) % enabledOptions.length
          : (currentIndex - 1 + enabledOptions.length) % enabledOptions.length
      onChange(enabledOptions[nextIndex].value)
    }
  }

  const shapeClasses =
    variant === "pill"
      ? "rounded-[20px] px-3.5"
      : "rounded-[12px] px-3.5"

  const stateClasses = disabled
    ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-70"
    : open
      ? "bg-white border-[#7EBEB2] ring-2 ring-[#7EBEB2]/20 text-gray-800"
      : "bg-white border-[#d5e6e2] hover:border-[#84c4b4] text-gray-700"

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full h-[44px] flex items-center justify-between gap-2 border text-sm transition-all outline-none focus-visible:border-[#7EBEB2] focus-visible:ring-2 focus-visible:ring-[#7EBEB2]/20 ${shapeClasses} ${stateClasses} ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
          {icon && <span className="shrink-0 text-[#2a594d] flex items-center">{icon}</span>}
          <span className={`truncate ${isPlaceholder && variant !== "pill" ? "text-gray-400 font-normal" : "text-gray-700 font-medium"}`}>
            {displayLabel}
          </span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-[#2a594d]/70 transition-transform duration-200 ${open ? "rotate-180 text-[#2a594d]" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={`${DROPDOWN_MENU_CLASSES} ${menuClassName}`}
        >
          {options.map(opt => {
            const isSelected = opt.value === value
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={opt.disabled}
                onClick={() => {
                  if (opt.disabled) return
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`${DROPDOWN_OPTION_BASE} ${
                  opt.disabled
                    ? DROPDOWN_OPTION_DISABLED
                    : `${DROPDOWN_OPTION_INTERACTIVE} ${isSelected ? DROPDOWN_OPTION_SELECTED : ""}`
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-[#2a594d]"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

type CategoryComboboxProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  categories: string[]
  placeholder?: string
  disabled?: boolean
  maxLength?: number
}

/**
 * Campo de categoria com dropdown padronizado: permite escolher uma categoria existente
 * com o mesmo padrão visual e estado de hover dos demais dropdowns, ou digitar uma nova.
 */
export function CategoryCombobox({
  id,
  value,
  onChange,
  categories,
  placeholder = "Ex: Costura, Bordado, Malharia...",
  disabled = false,
  maxLength = 100,
}: CategoryComboboxProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const listboxId = `${inputId}-listbox`

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtradas = categories.filter(c =>
    !value.trim() || c.toLowerCase().includes(value.trim().toLowerCase())
  )

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          id={inputId}
          type="text"
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && filtradas.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          onFocus={() => !disabled && setOpen(true)}
          onChange={e => {
            onChange(e.target.value)
            if (!open) setOpen(true)
          }}
          className={`w-full h-[44px] pl-4 pr-10 rounded-[12px] border text-sm transition-all outline-none ${
            disabled
              ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-[#d5e6e2] hover:border-[#84c4b4] focus:border-[#7EBEB2] focus:ring-2 focus:ring-[#7EBEB2]/20"
          }`}
        />
        {categories.length > 0 && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Mostrar sugestões de categorias"
            onClick={() => setOpen(prev => !prev)}
            className="absolute right-2.5 w-7 h-7 flex items-center justify-center rounded-lg text-[#2a594d]/70 hover:text-[#2a594d] hover:bg-[#e8f5f2] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {open && !disabled && filtradas.length > 0 && (
        <div id={listboxId} role="listbox" className={DROPDOWN_MENU_CLASSES}>
          {filtradas.map(cat => {
            const isSelected = cat.toLowerCase() === value.trim().toLowerCase()
            return (
              <button
                key={cat}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(cat)
                  setOpen(false)
                }}
                className={`${DROPDOWN_OPTION_BASE} ${DROPDOWN_OPTION_INTERACTIVE} ${
                  isSelected ? DROPDOWN_OPTION_SELECTED : ""
                }`}
              >
                <span className="truncate">{cat}</span>
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-[#2a594d]"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

