"use client";

type WeatherCircleProps = {
  icon: string;
  label: string;
  tooltip: string;
};

export default function WeatherCircle({
  icon,
  label,
  tooltip,
}: WeatherCircleProps) {
  return (
    <div
      className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-full bg-black/70 text-white shadow-lg backdrop-blur"
      title={tooltip}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] tracking-[0.2em] uppercase text-white/70">
        {label}
      </span>
    </div>
  );
}
