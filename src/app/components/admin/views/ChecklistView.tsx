import React from 'react';
import { OrangeHeader } from '../OrangeHeader';
import { ChecklistRoadmap } from '../ChecklistRoadmap';
import type { MainSection } from '../../../AdminDashboard';
import { CheckSquare } from 'lucide-react';

interface Props {
  onNavigate: (section: MainSection) => void;
}

export function ChecklistView({ onNavigate }: Props) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={CheckSquare}
        title="Checklist & Roadmap"
        subtitle="Estado completo de todos los módulos de Charlie Marketplace Builder"
        actions={[
          { label: 'Volver', onClick: () => onNavigate('sistema') },
          { label: 'Exportar', primary: true },
        ]}
      />
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8F9FA' }}>
        <ChecklistRoadmap hideHeader />
      </div>
    </div>
  );
}