export const DECIMAL_BASE = 100;

export function getFormattedValue(value: number) {
    return (value / DECIMAL_BASE);
}