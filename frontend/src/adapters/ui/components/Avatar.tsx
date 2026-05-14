function getAvatarColor(name: string) {
    const chars = name?.charCodeAt(0) || 0
    if (chars % 4 === 0) return 'avatar-blue'
    if (chars % 4 === 1) return 'avatar-orange'
    if (chars % 4 === 2) return 'avatar-green'
    return 'avatar-purple'
}

function getInitials(name: string) {
    const parts = (name || '??').split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (name || '??').substring(0, 2).toUpperCase()
}

type AvatarProps = {
    name: string
    photo?: string | null
    size?: string
    className?: string
}

export function Avatar({ name, photo, size = '', className = '' }: AvatarProps) {
    const sizeClass = size ? ` ${size}` : ''
    const extra = className ? ` ${className}` : ''
    if (photo) {
        return (
            <img
                src={photo}
                alt={name}
                className={`avatar${sizeClass}${extra}`}
            />
        )
    }
    return (
        <div className={`avatar${sizeClass} ${getAvatarColor(name)}${extra}`}>
            {getInitials(name)}
        </div>
    )
}
