import React from 'react';

export const StatCard = ({ title, value, icon: Icon, colorGradient, subtext }) => {
  return (
    <div className="glass-panel stat-card">
      <div className="stat-icon-wrapper" style={{ background: colorGradient }}>
        <Icon size={26} />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
        {subtext && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{subtext}</div>}
      </div>
    </div>
  );
};
