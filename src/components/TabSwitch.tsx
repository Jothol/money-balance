'use client';

interface TabSwitchProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export default function TabSwitch({ options, selected, onSelect }: TabSwitchProps) {
  const selectedIndex = options.findIndex((opt) => opt === selected);
  const tabCount = options.length;
  const knobWidth = 100 / tabCount; // % width per tab

  return (
    <div className="relative flex w-full max-w-sm mx-auto h-10 rounded-full bg-white text-sm font-bold text-black backdrop-blur overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
      {/* Sliding knob */}
      <div
        className="absolute inset-y-[2px] left-[2px] rounded-full bg-blue-500 text-white font-bold z-10 transition-transform duration-300 ease-in-out"
        style={{
          width: `${knobWidth - 0.5}%`,
          transform: `translateX(${selectedIndex * 100}%)`,
        }}
      >
        <div className="flex items-center justify-center h-full relative overflow-hidden">
          {options.map((option, i) => (
            <span
              key={option}
              className={`absolute transition-opacity duration-200 ease-linear w-full text-center ${
                selectedIndex === i ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {option}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      {options.map((option, i) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className="flex-1 relative z-20"
        >
          <span
            className={`block text-center transition-colors duration-200 ${
              selectedIndex === i ? 'text-transparent' : 'text-black/70'
            }`}
          >
            {option}
          </span>
        </button>
      ))}
    </div>
  );
}
