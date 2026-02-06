'use client'

interface ConfidenceSliderProps {
    value: number
    onChange: (value: number) => void
    id?: string
}

export function ConfidenceSlider({ value, onChange, id }: ConfidenceSliderProps) {
    const label = id?.includes('edit') ? 'Confidence Level' : 'Initial Confidence'

    return (
        <div>
            <label htmlFor={id} className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-medium text-(--text-secondary)">
                    {label}: <span className="text-white font-bold">{value}%</span>
                </span>
            </label>
            <input
                id={id}
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                style={{
                    background: `linear-gradient(to right, white ${value}%, rgba(255,255,255,0.1) ${value}%)`,
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
                    [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-white
                    [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/10
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
            />
        </div>
    )
}
