import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export function Button({
    variant = 'primary',
    size = 'md',
    ...props
}: ButtonProps) {
    return (
        <button className={`btn btn-${variant} btn-${size}`} {...props}>
            {props.children}
        </button>
    );
}
