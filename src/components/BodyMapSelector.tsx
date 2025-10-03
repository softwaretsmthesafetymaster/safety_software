import React, { useState, useRef, useEffect } from 'react';

interface BodyMapSelectorProps {
  selectedBodyParts: string[];
  onBodyPartsChange: (parts: string[]) => void;
}

const BodyMapSelector: React.FC<BodyMapSelectorProps> = ({ selectedBodyParts = [], onBodyPartsChange }) => {
  const bodyParts = [
    'Head', 'Neck', 'Left Shoulder', 'Right Shoulder', 'Left Arm', 'Right Arm', 'Left Elbow', 'Right Elbow',
    'Left Wrist', 'Right Wrist', 'Left Hand', 'Right Hand', 'Chest', 'Upper Back', 'Lower Back', 'Abdomen',
    'Left Hip', 'Right Hip', 'Left Thigh', 'Right Thigh', 'Left Knee', 'Right Knee', 'Left Shin', 'Right Shin',
    'Left Ankle', 'Right Ankle', 'Left Foot', 'Right Foot'
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleBodyPart = (part: string) => {
    if (selectedBodyParts.includes(part)) {
      onBodyPartsChange(selectedBodyParts.filter((p: string) => p !== part));
    } else {
      onBodyPartsChange([...selectedBodyParts, part]);
    }
  };

  // Close dropdown on outside click or Esc
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [dropdownOpen]);

  return (
    <div className="space-y-4">
      {/* Simple Body Diagram */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="text-center">
          <div className="inline-block">
            {/* Head */}
            <div className="relative mb-2">
              <button
                type="button"
                onClick={() => toggleBodyPart('Head')}
                className={`w-16 h-16 rounded-full border-2 ${
                  selectedBodyParts.includes('Head')
                    ? 'bg-red-200 border-red-500'
                    : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                }`}
                title="Head"
              >
                Head
              </button>
            </div>

            {/* Torso */}
            <div className="relative mb-2">
              <div className="flex justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Left Shoulder')}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedBodyParts.includes('Left Shoulder')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Left Shoulder"
                />
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Chest')}
                  className={`w-16 h-20 rounded-lg border-2 ${
                    selectedBodyParts.includes('Chest')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Chest"
                >
                  Chest
                </button>
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Right Shoulder')}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedBodyParts.includes('Right Shoulder')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Right Shoulder"
                />
              </div>
            </div>

            {/* Arms */}
            <div className="flex justify-center space-x-16 mb-2">
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Left Arm')}
                  className={`w-6 h-12 rounded border-2 ${
                    selectedBodyParts.includes('Left Arm')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Left Arm"
                />
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Left Hand')}
                  className={`w-6 h-8 rounded border-2 ${
                    selectedBodyParts.includes('Left Hand')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Left Hand"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Right Arm')}
                  className={`w-6 h-12 rounded border-2 ${
                    selectedBodyParts.includes('Right Arm')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Right Arm"
                />
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Right Hand')}
                  className={`w-6 h-8 rounded border-2 ${
                    selectedBodyParts.includes('Right Hand')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Right Hand"
                />
              </div>
            </div>

            {/* Legs */}
            <div className="flex justify-center space-x-4">
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Left Thigh')}
                  className={`w-8 h-16 rounded border-2 ${
                    selectedBodyParts.includes('Left Thigh')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Left Thigh"
                />
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Left Shin')}
                  className={`w-8 h-16 rounded border-2 ${
                    selectedBodyParts.includes('Left Shin')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Left Shin"
                />
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Left Foot')}
                  className={`w-8 h-6 rounded border-2 ${
                    selectedBodyParts.includes('Left Foot')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Left Foot"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Right Thigh')}
                  className={`w-8 h-16 rounded border-2 ${
                    selectedBodyParts.includes('Right Thigh')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Right Thigh"
                />
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Right Shin')}
                  className={`w-8 h-16 rounded border-2 ${
                    selectedBodyParts.includes('Right Shin')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Right Shin"
                />
                <button
                  type="button"
                  onClick={() => toggleBodyPart('Right Foot')}
                  className={`w-8 h-6 rounded border-2 ${
                    selectedBodyParts.includes('Right Foot')
                      ? 'bg-red-200 border-red-500'
                      : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                  }`}
                  title="Right Foot"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-select Dropdown for detailed selection */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or select from list:
        </label>
        <button
          type="button"
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex flex-wrap gap-1 min-h-[40px]"
          onClick={() => setDropdownOpen((open) => !open)}
        >
          {selectedBodyParts.length === 0 ? (
            <span className="text-gray-400">Select body parts...</span>
          ) : (
            selectedBodyParts.map((part) => (
              <span key={part} className="inline-flex items-center bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs mr-1 mb-1">
                {part}
                <button
                  type="button"
                  className="ml-1 text-blue-600 hover:text-blue-800 text-xs"
                  onClick={e => { e.stopPropagation(); toggleBodyPart(part); }}
                  tabIndex={-1}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </button>
        {dropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
            {bodyParts.map((part: string) => (
              <label key={part} className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBodyParts.includes(part)}
                  onChange={() => toggleBodyPart(part)}
                  className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{part}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {selectedBodyParts.length > 0 && (
        <div className="mt-2 p-2 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            Selected: {selectedBodyParts.map(part => (
              <span key={part} className="inline-flex items-center mr-2">
                <strong>{part}</strong>
                <button
                  type="button"
                  onClick={() => toggleBodyPart(part)}
                  className="ml-1 text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  ×
                </button>
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
};

export default BodyMapSelector;