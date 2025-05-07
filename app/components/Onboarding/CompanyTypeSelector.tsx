import React from 'react';
import { Building, Building as BuildingCommunity, ChevronRight } from 'lucide-react';
import './CompanyTypeSelector.css';

export type CompanyType = 'llc' | 'corporation';

interface CompanyTypeSelectorProps {
  selectedType: CompanyType;
  onSelectType: (type: CompanyType) => void;
}

const CompanyTypeSelector: React.FC<CompanyTypeSelectorProps> = ({ 
  selectedType, 
  onSelectType 
}) => {
  return (
    <div className="company-type-container">
      <div 
        className={`company-type-card ${selectedType === 'llc' ? 'selected' : ''}`}
        onClick={() => onSelectType('llc')}
        role="button"
        tabIndex={0}
      >
        <div className="company-type-icon">
          <Building size={24} />
        </div>
        <div className="company-type-info">
          <h3>LLC</h3>
          <p>Owned by Individuals</p>
        </div>
        <ChevronRight className="company-type-arrow" size={20} />
      </div>
      
      <div 
        className={`company-type-card ${selectedType === 'corporation' ? 'selected' : ''}`}
        onClick={() => onSelectType('corporation')}
        role="button"
        tabIndex={0}
      >
        <div className="company-type-icon">
          <BuildingCommunity size={24} />
        </div>
        <div className="company-type-info">
          <h3>CORPORATION</h3>
          <p>Owned by Stakeholders</p>
        </div>
        <ChevronRight className="company-type-arrow" size={20} />
      </div>
    </div>
  );
};

export default CompanyTypeSelector;