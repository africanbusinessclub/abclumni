export function splitCsv(value: string): string[] {
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}
