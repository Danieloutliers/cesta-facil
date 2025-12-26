import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ value = '', onChange, ...props }, ref) => {
        const formatPhone = (input: string) => {
            // Remove all non-digits
            const digits = input.replace(/\D/g, '');

            // Limit to 11 digits
            const limited = digits.slice(0, 11);

            // Format as (XX) XXXXX-XXXX
            if (limited.length <= 2) {
                return limited;
            } else if (limited.length <= 7) {
                return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
            } else {
                return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
            }
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatPhone(e.target.value);
            const newEvent = {
                ...e,
                target: {
                    ...e.target,
                    value: formatted,
                },
            };
            onChange?.(newEvent as React.ChangeEvent<HTMLInputElement>);
        };

        return (
            <Input
                ref={ref}
                type="tel"
                placeholder="(00) 00000-0000"
                value={value}
                onChange={handleChange}
                {...props}
            />
        );
    }
);

PhoneInput.displayName = 'PhoneInput';
