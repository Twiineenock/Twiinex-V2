import React from 'react';

interface LogoProps {
  className?: string;
  theme?: 'dark' | 'light';
}

const TwiinexLogo: React.FC<LogoProps> = ({ className, theme = 'dark' }) => {
  const color = theme === 'dark' ? '#ffffff' : '#000000';
  const accent = '#10b981';

  return (
    <svg 
      viewBox="0 0 260 60" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hexagon Monogram Container */}
      <path 
        d="M30 6L51.6506 18.5V41.5L30 54L8.34937 41.5V18.5L30 6Z" 
        stroke={color} 
        strokeWidth="3.5" 
        strokeLinejoin="round"
      />
      
      {/* TX Monogram - Bold and Stylized */}
      <text 
        x="30" 
        y="39" 
        textAnchor="middle" 
        fill={color} 
        className="font-black"
        style={{ 
          fontSize: '22px', 
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.05em'
        }}
      >
        TX
      </text>

      {/* TWIINEX Wordmark - Ultra Bold */}
      <text 
        x="70" 
        y="40" 
        fill={color} 
        className="font-black"
        style={{ 
          fontSize: '38px', 
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.06em',
          textTransform: 'uppercase'
        }}
      >
        TWIINEX
      </text>
      
      {/* Decorative Brand Dot */}
      <circle cx="248" cy="34" r="4.5" fill={accent} />
    </svg>
  );
};

export default TwiinexLogo;
