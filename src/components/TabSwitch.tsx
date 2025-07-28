'use client';

interface TabSwitchProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export default function TabSwitch({ options, selected, onSelect }: TabSwitchProps) {
  return (
    <div className="flex w-full justify-center rounded-full border border-red-600 overflow-hidden">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`w-1/2 py-2 text-sm font-medium transition-colors ${
            selected === option ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
