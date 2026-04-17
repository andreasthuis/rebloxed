import { useState, useRef, useEffect, useMemo } from "react";

const CustomDropdown = ({ label, options, value, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter((opt: any) =>
      opt.optionDisplayName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  const selectedOption = options.find((opt: any) => opt.optionId === value);

  return (
    <div ref={dropdownRef} className="dropdown">
      <label>{label}</label>

      <div onClick={() => setIsOpen(!isOpen)} className="dropdown-span">
        <span>{selectedOption?.optionDisplayName || "Select..."}</span>
        <span
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </div>

      {isOpen && (
        <div className="dropdown-open">
          {options.length > 20 && (
            <div className="dropdown-input">
              <input
                type="text"
                placeholder="Search..."
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          <div className="dropdown-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option: any) => (
                <div
                  className={`dropdown-option ${value === option.optionId ? "selected" : ""}`}
                  key={option.optionId}
                  onClick={() => {
                    onChange(option.optionId);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {option.optionDisplayName}
                </div>
              ))
            ) : (
              <div className="dropdown-no-results">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
