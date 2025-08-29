import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../../lib/context/ThemeContext';

interface GlassButtonProps extends TouchableOpacityProps {
  variant?: 'solid' | 'glass' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'solid',
  size = 'md',
  children,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 rounded-ios-sm';
      case 'lg':
        return 'px-6 py-4 rounded-ios-lg';
      default:
        return 'px-4 py-3 rounded-ios';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-ios-sm';
      case 'lg':
        return 'text-ios-lg';
      default:
        return 'text-ios-base';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 24;
      default:
        return 20;
    }
  };

  const getVariantStyles = () => {
    if (disabled) {
      return {
        button: isDarkMode ? 'bg-gray-800 opacity-50' : 'bg-gray-200 opacity-50',
        text: isDarkMode ? 'text-gray-500' : 'text-gray-400',
      };
    }

    switch (variant) {
      case 'glass':
        return {
          button: isDarkMode
            ? 'border border-glass-border-dark shadow-ios'
            : 'border border-glass-border-light shadow-ios',
          text: isDarkMode ? 'text-white' : 'text-black',
          style: {
            backgroundColor: isDarkMode 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(0,0,0,0.05)',
          }
        };
      case 'ghost':
        return {
          button: '',
          text: isDarkMode ? 'text-primary-dark' : 'text-primary',
        };
      case 'destructive':
        return {
          button: isDarkMode ? 'bg-destructive-dark' : 'bg-destructive',
          text: 'text-white',
        };
      default: // solid
        return {
          button: isDarkMode ? 'bg-primary-dark' : 'bg-primary',
          text: 'text-white',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      className={`
        ${getSizeStyles()}
        ${fullWidth ? 'w-full' : ''}
        flex-row items-center justify-center
        ${variantStyles.button}
        ${className}
      `.trim()}
      style={[
        variantStyles.style,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variantStyles.text.includes('white') ? '#ffffff' : isDarkMode ? '#0A84FF' : '#007AFF'} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={variantStyles.text.includes('white') ? '#ffffff' : isDarkMode ? '#0A84FF' : '#007AFF'}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={`${getTextSize()} font-semibold ${variantStyles.text}`}>
            {children}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={variantStyles.text.includes('white') ? '#ffffff' : isDarkMode ? '#0A84FF' : '#007AFF'}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

