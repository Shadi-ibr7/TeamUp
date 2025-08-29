import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, View, ViewProps } from 'react-native';
import { useTheme } from '../../lib/context/ThemeContext';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 20,
  className = '',
  variant = 'default',
  style,
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return isDarkMode 
          ? 'shadow-glass-dark border-glass-border-dark' 
          : 'shadow-glass border-glass-border-light';
      case 'subtle':
        return isDarkMode
          ? 'border-glass-border-dark'
          : 'border-glass-border-light';
      default:
        return isDarkMode
          ? 'shadow-ios border-glass-border-dark'
          : 'shadow-ios border-glass-border-light';
    }
  };

  const baseClasses = `
    rounded-ios-lg 
    overflow-hidden 
    ${getVariantStyles()}
    ${className}
  `.trim();

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={isDarkMode ? 'dark' : 'light'}
        className={baseClasses}
        style={[
          {
            backgroundColor: isDarkMode 
              ? 'rgba(28,28,30,0.6)' 
              : 'rgba(255,255,255,0.6)',
            borderWidth: 1,
            borderColor: isDarkMode 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(255,255,255,0.3)',
          },
          style,
        ]}
        {...props}
      >
        {children}
      </BlurView>
    );
  }

  // Fallback for Android and Web
  return (
    <View
      className={baseClasses}
      style={[
        {
          backgroundColor: isDarkMode 
            ? 'rgba(28,28,30,0.85)' 
            : 'rgba(255,255,255,0.85)',
          borderWidth: 1,
          borderColor: isDarkMode 
            ? 'rgba(255,255,255,0.1)' 
            : 'rgba(255,255,255,0.3)',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

