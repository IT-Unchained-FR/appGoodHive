import React, { useState, useEffect } from "react";
import skills from "../../../json/skills.json";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface SkillsSuggestionProps {
  onSkillsChange?: (skills: string) => void;
  classes?: string;
  value?: string;
  placeholder?: string;
}

export const SkillsSuggestion: React.FC<SkillsSuggestionProps> = ({
  onSkillsChange,
  classes,
  value = "",
  placeholder = "Try Solidity, React, Rust, C++..."
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([]);
      return;
    }

    const filteredSkills = skills.filter((skill) =>
      skill.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
    );
    setSuggestions(filteredSkills as Skill[]);
  }, [debouncedQuery]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setQuery(newValue);
    onSkillsChange?.(newValue);
  };

  const handleSkillSelect = (skill: Skill) => {
    const currentSkills = query.split(',').map(s => s.trim()).filter(s => s);
    const lastSkill = currentSkills[currentSkills.length - 1] || '';
    
    if (lastSkill && skill.name.toLowerCase().includes(lastSkill.toLowerCase())) {
      currentSkills[currentSkills.length - 1] = skill.name;
    } else {
      currentSkills.push(skill.name);
    }
    
    const newSkillsString = currentSkills.join(', ');
    setQuery(newSkillsString);
    setSuggestions([]);
    setDebouncedQuery(''); // Clear debounced query to prevent suggestions reappearing
    onSkillsChange?.(newSkillsString);
  };

  const handleAddNewSkill = () => {
    const words = query.split(',').map(s => s.trim()).filter(s => s);
    const lastWord = words[words.length - 1] || '';
    
    if (lastWord && !skills.some(skill => skill.name.toLowerCase() === lastWord.toLowerCase())) {
      // Add the new skill to the current query
      const newSkillsString = query.trim();
      setQuery(newSkillsString);
      setSuggestions([]);
      setDebouncedQuery(''); // Clear debounced query to hide dropdown
      onSkillsChange?.(newSkillsString);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`${classes} relative rounded-lg block w-full px-4 py-2 text-base font-normal text-gray-600 bg-gray-100 focus:outline-none focus:ring-0`}
      />
      {(suggestions.length > 0 || (debouncedQuery.trim() && !skills.some(skill => 
        skill.name.toLowerCase() === debouncedQuery.toLowerCase()
      ))) && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {suggestions.map((skill) => (
            <li
              key={skill.id}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSkillSelect(skill);
              }}
              className="px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-100 flex justify-between items-center"
            >
              <span>{skill.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {skill.category}
              </span>
            </li>
          ))}
          {debouncedQuery.trim() && !skills.some(skill => 
            skill.name.toLowerCase().includes(debouncedQuery.toLowerCase())
          ) && (
            <li
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddNewSkill();
              }}
              className="px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-100 text-blue-600 font-medium"
            >
              + Add "{debouncedQuery}" as new skill
            </li>
          )}
        </ul>
      )}
    </div>
  );
};