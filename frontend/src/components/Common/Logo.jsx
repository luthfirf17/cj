import React from 'react';
import logoImage from '../../assets/images/logo.png';

const Logo = ({ size = 'md', showText = true, variant = 'default' }) => {
  // Size variants
  const sizes = {
    sm: { circle: 'w-8 h-8', text: 'text-sm', logo: 'text-base', gap: 'gap-2' },
    md: { circle: 'w-10 h-10', text: 'text-base', logo: 'text-lg', gap: 'gap-2.5' },
    lg: { circle: 'w-14 h-14', text: 'text-xl', logo: 'text-2xl', gap: 'gap-3' },
    xl: { circle: 'w-20 h-20', text: 'text-3xl', logo: 'text-3xl', gap: 'gap-4' }
  };

  const currentSize = sizes[size] || sizes.md;

  // Variant styles
  const variants = {
    default: 'from-[#2c3e63] to-[#1a2744]',
    light: 'from-[#3d5a8c] to-[#2c3e63]',
    gold: 'from-[#c9a961] to-[#b8934d]'
  };

  return (
    <div className={`flex items-center ${currentSize.gap}`}>
      {/* Logo Circle */}
      <div className={`${currentSize.circle} rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105`}>
        <img src={logoImage} alt="CatatJasamu Logo" className="w-full h-full object-cover" />
      </div>

      {/* Brand Text - Modern Clean White Gradient */}
      {showText && (
        <div className="flex flex-col">
          {/* "Catat" - White to light gray gradient */}
          <span 
            className={`${currentSize.text} font-bold leading-tight tracking-tight`}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Catat
          </span>
          
          {/* "Jasamu" - Gold gradient untuk accent */}
          <span 
            className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-xl'} font-semibold leading-tight -mt-1 tracking-wide`}
            style={{
              background: 'linear-gradient(180deg, #e6c97a 0%, #c9a961 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Jasamu
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
