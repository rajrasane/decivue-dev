import React from 'react'

export function Spinner({
    className = '',
    size = 32,
    color = 'currentColor'
}: {
    className?: string
    size?: number
    color?: string
}) {
    return (
        <div
            className={`relative inline-block ${className}`}
            style={{ width: size, height: size }}
            role="status"
            aria-label="Loading"
        >
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="absolute top-0 left-1/2 w-[8%] h-[24%] rounded-full origin-[50%_208%]"
                    style={{
                        backgroundColor: color,
                        transform: `translateX(-50%) rotate(${i * 30}deg)`,
                        animation: `spinner-fade 0.8s linear infinite`,
                        animationDelay: `${-0.8 + (i * (0.8 / 12))}s`,
                    }}
                />
            ))}
        </div>
    )
}
