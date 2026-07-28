'use client'

interface StampSealProps {
  label: string
  color: string
}

export default function StampSeal({ label, color }: StampSealProps) {
  return (
    <div
      className="absolute top-3 right-3.5 w-[58px] h-[58px] rounded-full flex items-center justify-center text-center opacity-80"
      style={{
        border: `2.5px solid ${color}`,
        transform: 'rotate(-11deg)',
      }}
    >
      <div
        className="absolute inset-1 rounded-full"
        style={{
          border: `1px dashed ${color}`,
        }}
      />
      <span
        className="font-serif font-bold text-[0.52rem] tracking-[0.02em] leading-[1.05]"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  )
}
