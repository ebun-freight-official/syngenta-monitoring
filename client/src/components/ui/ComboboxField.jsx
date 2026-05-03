import clsx from "clsx";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { MdKeyboardArrowDown } from "react-icons/md";

// Props:
//   label         string  — field label
//   value         string  — selected id
//   onChange      fn      — called with the selected id
//   onQueryChange fn      — called with the typed search string
//   allOptions    array   — full list [{ id, label }] used for display value lookup
//   options       array   — filtered list [{ id, label }] shown in dropdown
//   disabled      bool    — default false
//   required      bool    — default true
//   uppercase     bool    — applies uppercase style

const ComboboxField = ({
  label,
  value,
  onChange,
  onQueryChange,
  allOptions = [],
  options = [],
  disabled = false,
  required = true,
  uppercase = false,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider truncate">
      {label} {required && <span className="text-red-400">*</span>}
    </span>

    {disabled ? (
      <div
        className={clsx(
          "flex items-center bg-gray-50 border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 text-xs max-sm:text-xxs text-gray-700",
          uppercase ? "uppercase" : "capitalize",
        )}
      >
        {allOptions.find((o) => o.id === value)?.label || (
          <span className="text-gray-400 italic">—</span>
        )}
      </div>
    ) : (
      <Combobox value={value} onChange={onChange}>
        <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 focus-within:border-gray-400 transition-all">
          <ComboboxInput
            className={clsx(
              "w-full bg-transparent text-xs max-sm:text-xxs text-gray-800 placeholder-gray-400 focus:outline-none min-w-0",
              uppercase ? "uppercase" : "capitalize",
            )}
            displayValue={(id) =>
              allOptions.find((o) => o.id === id)?.label || ""
            }
            onChange={(e) => onQueryChange?.(e.target.value)}
            required={required}
          />
          <ComboboxButton className="absolute right-4 max-sm:right-3 text-gray-400">
            <MdKeyboardArrowDown className="text-base" />
          </ComboboxButton>
        </div>
        <ComboboxOptions
          portal
          anchor={{ to: "bottom start", gap: 8 }}
          className="z-999 max-h-60 w-(--input-width) overflow-auto rounded-md bg-white border border-gray-200 py-1 text-xs focus:outline-none"
        >
          {options.map((o) => (
            <ComboboxOption
              key={o.id}
              value={o.id}
              className={({ focus }) =>
                clsx(
                  "px-4 py-2 cursor-default select-none transition-colors",
                  uppercase ? "uppercase" : "capitalize",
                  { "bg-gray-50": focus },
                )
              }
            >
              {o.label}
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    )}
  </div>
);

export default ComboboxField;
