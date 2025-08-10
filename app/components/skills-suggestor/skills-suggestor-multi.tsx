import React, { useState, useEffect, useRef } from "react";
import skills from "../../../json/skills.json";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface SkillsSuggestionMultiProps {
  onSkillsChange?: (skills: string[]) => void;
  classes?: string;
  value?: string[];
  placeholder?: string;
}

export const SkillsSuggestionMulti: React.FC<SkillsSuggestionMultiProps> = ({
  onSkillsChange,
  classes,
  value = [],
  placeholder = "Search skills..."
}) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(value);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedSkills(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!inputValue) {
      setSuggestions([]);
      return;
    }

    const filteredSkills = skills.filter((skill) =>
      skill.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedSkills.includes(skill.name)
    );
    setSuggestions(filteredSkills as Skill[]);
  }, [inputValue, selectedSkills]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setIsOpen(true);
  };

  const handleSkillSelect = (skill: Skill) => {
    const newSkills = [...selectedSkills, skill.name];
    setSelectedSkills(newSkills);
    setInputValue("");
    setIsOpen(false);
    onSkillsChange?.(newSkills);
    inputRef.current?.focus();
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const newSkills = selectedSkills.filter(skill => skill !== skillToRemove);
    setSelectedSkills(newSkills);
    onSkillsChange?.(newSkills);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !inputValue && selectedSkills.length > 0) {
      const newSkills = selectedSkills.slice(0, -1);
      setSelectedSkills(newSkills);
      onSkillsChange?.(newSkills);
    }
  };

  const handleAddNewSkill = () => {
    if (inputValue.trim() && !selectedSkills.includes(inputValue.trim())) {
      const newSkills = [...selectedSkills, inputValue.trim()];
      setSelectedSkills(newSkills);
      setInputValue("");
      setIsOpen(false);
      onSkillsChange?.(newSkills);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      <div className={`${classes} flex flex-wrap gap-2 p-2 min-h-[48px] cursor-text`} onClick={() => inputRef.current?.focus()}>
        {selectedSkills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveSkill(skill);
              }}
              className="hover:bg-amber-200 rounded-full p-0.5 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedSkills.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[150px] bg-transparent outline-none border-none p-0 text-base font-normal text-gray-600"
        />
      </div>
      {isOpen && (suggestions.length > 0 || (inputValue.trim() && !skills.some(skill => 
        skill.name.toLowerCase() === inputValue.toLowerCase()
      ))) && (
        <div ref={dropdownRef} className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {suggestions.map((skill) => (
            <div
              key={skill.id}
              onClick={() => handleSkillSelect(skill)}
              className="px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-100 flex justify-between items-center"
            >
              <span>{skill.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {skill.category}
              </span>
            </div>
          ))}
          {inputValue.trim() && !skills.some(skill => 
            skill.name.toLowerCase() === inputValue.toLowerCase()
          ) && !selectedSkills.includes(inputValue.trim()) && (
            <div
              onClick={handleAddNewSkill}
              className="px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-100 text-blue-600 font-medium"
            >
              + Add "{inputValue}" as new skill
            </div>
          )}
        </div>
      )}
    </div>
  );
};