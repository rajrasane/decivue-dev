'use client'

interface ConfidenceGaugeProps {
    value: number
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    customColor?: string
}

export function ConfidenceGauge({
    value,
    size = 'md',
    showLabel = true,
    customColor
}: ConfidenceGaugeProps) {
    const sizes = {
        sm: { width: 80, stroke: 6, fontSize: 'text-lg' },
        md: { width: 120, stroke: 8, fontSize: 'text-2xl' },
        lg: { width: 180, stroke: 10, fontSize: 'text-4xl' },
    }

    const { width, stroke, fontSize } = sizes[size]
    const radius = (width - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const progress = Math.max(0, Math.min(100, value))
    const offset = circumference - (progress / 100) * circumference

    // Color based on value
    const getColor = () => {
        if (customColor) return customColor
        if (value >= 70) return 'var(--fresh)'
        if (value >= 40) return 'var(--stable)'
        return 'var(--at-risk)'
    }

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={width} height={width} className="-rotate-90">
                {/* Background circle */}
                <circle
                    cx={width / 2}
                    cy={width / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--bg-secondary)"
                    strokeWidth={stroke}
                />
                {/* Progress circle */}
                <circle
                    cx={width / 2}
                    cy={width / 2}
                    r={radius}
                    fill="none"
                    stroke={getColor()}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="gauge-circle"
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-bold ${fontSize}`} style={{ color: getColor() }}>
                        {value}%
                    </span>
                    <span className="text-xs text-(--text-muted) uppercase tracking-wider">
                        Confidence
                    </span>
                </div>
            )}
        </div>
    )
}
