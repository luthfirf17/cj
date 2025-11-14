import React from 'react';

/**
 * Reusable Card Component
 * @param {string} title - Card title
 * @param {string} subtitle - Card subtitle
 * @param {node} icon - Icon component
 * @param {boolean} hoverable - Add hover effect
 * @param {function} onClick - Click handler
 */
const Card = ({
  title,
  subtitle,
  children,
  icon,
  hoverable = false,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200
        ${hoverable ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle || icon) && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            {icon && (
              <div className="text-gray-400">
                {icon}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

/**
 * Stat Card Component (for Dashboard)
 */
export const StatCard = ({
  title,
  value,
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  trend,
  trendValue,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-6
        hover:shadow-md transition-shadow duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center text-center">
        {icon && (
          <div className={`p-3 rounded-full ${iconBgColor} mb-3`}>
            <div className={`text-2xl ${iconColor}`}>
              {icon}
            </div>
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
