type AbcLogoProps = {
    size?: number
    variant?: 'dark' | 'light'
    showText?: boolean
}

export function AbcLogo({ size = 36 }: AbcLogoProps) {
    const height = size
    const width = Math.round(size * 2.6)

    return (
        <img
            src="/logo.png"
            alt="African Business Club – Alumni ABC"
            width={width}
            height={height}
            className="abc-logo"
        />
    )
}
