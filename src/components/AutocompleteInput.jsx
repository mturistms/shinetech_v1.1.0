import React, { useState, useEffect, useRef } from 'react';

const AutocompleteInput = ({
    options = [],
    value,
    onChange,
    placeholder,
    onSelect,
    className,
    disabled
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        onChange(val);

        if (val.trim()) {
            const lowerVal = val.toLowerCase();
            const filtered = options.filter(opt =>
                opt.name.toLowerCase().includes(lowerVal) ||
                (opt.part_number && opt.part_number.toLowerCase().includes(lowerVal))
            ).slice(0, 50); // Limit to 50 results
            setFilteredOptions(filtered);
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const handleOptionClick = (opt) => {
        onChange(opt.name);
        if (onSelect) onSelect(opt);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                className={className}
                value={value}
                onChange={handleInputChange}
                onFocus={() => !disabled && value.trim() && setIsOpen(true)}
                placeholder={placeholder}
                style={{ width: '100%', cursor: disabled ? 'not-allowed' : 'text' }}
                disabled={disabled}
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    listStyle: 'none',
                    padding: '0.5rem 0',
                    margin: '0.25rem 0',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {filteredOptions.map((opt, idx) => (
                        <li
                            key={idx}
                            onClick={() => handleOptionClick(opt)}
                            style={{
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                borderBottom: idx < filteredOptions.length - 1 ? '1px solid var(--border)' : 'none',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg-light)'}
                            onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                        >
                            <div style={{ fontWeight: 500 }}>{opt.name}</div>
                            {opt.part_number && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Part: {opt.part_number}</div>
                            )}
                            {(opt.sale_price || opt.cost) && (
                                <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>
                                    ₹{opt.sale_price || opt.cost}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AutocompleteInput;
