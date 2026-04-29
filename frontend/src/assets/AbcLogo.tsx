type AbcLogoProps = {
    size?: number
    variant?: 'dark' | 'light'
    showText?: boolean
}

export function AbcLogo({ size = 36 }: AbcLogoProps) {
    const height = size
    const width = Math.round(size * 1.667) // 310 / 186 actual aspect ratio

    return (
        <img
            src="/logo.png"
            alt="African Business Club - Alumni ABC"
            width={width}
            height={height}
            className="abc-logo"
        />
    )
}
