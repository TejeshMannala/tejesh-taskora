import { FaChevronDown } from 'react-icons/fa';

const Select = ({
  value,
  onChange,
  options,
  disabled,
  error,
  placeholder,
  className = '',
  selectProps,
  children,
  ...props
}) => {
  const nativeSelectProps = selectProps || {};

  return (
    <div className={`relative ${className}`} {...props}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...nativeSelectProps}
        className={`
          w-full appearance-none rounded-lg border bg-white/5 px-4 py-2.5
          text-white outline-none transition-all duration-200
          backdrop-blur-md cursor-pointer
          ${error ? 'border-red-500' : 'border-white/10 hover:border-white/25'}
          focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]
          disabled:cursor-not-allowed disabled:opacity-40
        `}
      >
        {placeholder && (
          <option value="" disabled className="text-gray-400">
            {placeholder}
          </option>
        )}
        {options
          ? options.map((opt) => {
              const label = typeof opt === 'string' ? opt : opt.label;
              const val = typeof opt === 'string' ? opt : opt.value;
              return (
                <option key={val} value={val}>
                  {label}
                </option>
              );
            })
          : children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200">
        <FaChevronDown size={12} />
      </div>
    </div>
  );
};

export default Select;
