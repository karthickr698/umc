import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Search } from 'lucide-react';
import { PopoverPanel } from '@/components/layout/popover-panel';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Shown while nothing is chosen; also listed as the "no choice" option unless `required`. */
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Adds a search box above the options; on by default for long lists. */
  searchable?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

const SEARCH_THRESHOLD = 7;
const PLACEHOLDER_KEY = '__placeholder__';

const matches = (option: SelectOption, search: string) =>
  option.label.toLowerCase().includes(search.trim().toLowerCase());

/** A styled single-choice dropdown with keyboard support and optional search. */
export function Select({
  value,
  options,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  searchable,
  id,
  className,
  ...aria
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const showSearch = searchable ?? options.length > SEARCH_THRESHOLD;
  const choices = useMemo(
    () =>
      placeholder !== undefined && !required
        ? [{ value: '', label: placeholder }, ...options]
        : options,
    [options, placeholder, required],
  );
  const visible = search ? choices.filter((option) => matches(option, search)) : choices;
  const selected = options.find((option) => option.value === value);
  const optionId = (index: number) => `${listId}-option-${index}`;

  useEffect(() => {
    if (open) document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
  });

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSearch('');
      setActiveIndex(
        Math.max(
          0,
          choices.findIndex((option) => option.value === value),
        ),
      );
    }
    setOpen(next);
  };

  const choose = (option: SelectOption) => {
    if (option.value !== value) onChange(option.value);
    setOpen(false);
  };

  const jumpToLetter = (letter: string) => {
    const start = activeIndex + 1;
    const ordered = [...visible.slice(start), ...visible.slice(0, start)];
    const match = ordered.find((option) => option.label.toLowerCase().startsWith(letter));
    if (match) setActiveIndex(visible.indexOf(match));
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const last = visible.length - 1;
    const moves: Record<string, () => void> = {
      ArrowDown: () => setActiveIndex((index) => Math.min(index + 1, last)),
      ArrowUp: () => setActiveIndex((index) => Math.max(index - 1, 0)),
      Home: () => setActiveIndex(0),
      End: () => setActiveIndex(last),
      Enter: () => {
        const option = visible[activeIndex];
        if (option) choose(option);
      },
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      move();
    } else if (event.key === 'Tab') {
      setOpen(false);
    } else if (!showSearch && event.key.length === 1) {
      jumpToLetter(event.key.toLowerCase());
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          {...aria}
          id={id}
          type="button"
          className={['field__input select__trigger', className].filter(Boolean).join(' ')}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          onBlur={onBlur}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              handleOpenChange(true);
            }
          }}
        >
          <span className={`select__value${selected ? '' : ' select__value--placeholder'}`}>
            {selected?.label ?? placeholder ?? 'Choose…'}
          </span>
          <ChevronDown className="select__chevron" size={18} aria-hidden />
        </button>
      </Popover.Trigger>
      <PopoverPanel
        className="select__panel"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (searchRef.current ?? listRef.current)?.focus();
        }}
      >
        {showSearch && (
          <div className="select__search">
            <Search size={16} aria-hidden />
            <input
              ref={searchRef}
              className="select__search-input"
              type="text"
              role="combobox"
              aria-label="Search options"
              aria-controls={listId}
              aria-expanded
              aria-autocomplete="list"
              aria-activedescendant={visible.length > 0 ? optionId(activeIndex) : undefined}
              placeholder="Type to search…"
              autoComplete="off"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={aria['aria-label'] ?? placeholder ?? 'Options'}
          aria-activedescendant={showSearch ? undefined : optionId(activeIndex)}
          tabIndex={showSearch ? -1 : 0}
          className="select__list"
          onKeyDown={showSearch ? undefined : handleKeyDown}
        >
          {visible.map((option, index) => {
            const isSelected = option.value === value && (option.value !== '' || !selected);
            return (
              <li
                key={option.value || PLACEHOLDER_KEY}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                className={[
                  'select__option',
                  index === activeIndex && 'select__option--active',
                  option.value === '' && 'select__option--muted',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => choose(option)}
              >
                <span className="select__option-label">{option.label}</span>
                {isSelected && <Check className="select__check" size={16} aria-hidden />}
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="select__empty" role="presentation">
              Nothing matches “{search.trim()}”
            </li>
          )}
        </ul>
      </PopoverPanel>
    </Popover.Root>
  );
}
