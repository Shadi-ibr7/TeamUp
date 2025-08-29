import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/context/ThemeContext';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  helper,
  icon,
  rightIcon,
  onRightIconPress,
  containerClassName = '',
  className = '',
  style,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getInputStyles = () => {
    if (error) {
      return isDarkMode
        ? 'border-destructive-dark bg-red-900/10'
        : 'border-destructive bg-red-50/50';
    }
    if (isFocused) {
      return isDarkMode
        ? 'border-primary-dark bg-white/5'
        : 'border-primary bg-black/5';
    }
    return isDarkMode
      ? 'border-glass-border-dark bg-white/5'
      : 'border-glass-border-light bg-black/5';
  };

  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const placeholderColor = isDarkMode ? '#98989D' : '#8E8E93';
  const iconColor = isDarkMode ? '#98989D' : '#8E8E93';

  return (
    <View className={`${containerClassName}`}>
      {label && (
        <Text className={`text-ios-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          {label}
        </Text>
      )}
      
      <View className={`relative`}>
        {icon && (
          <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
        )}
        
        <TextInput
          className={`
            rounded-ios px-4 py-3 text-ios-base
            border
            ${icon ? 'pl-11' : ''}
            ${rightIcon ? 'pr-11' : ''}
            ${getInputStyles()}
            ${className}
          `.trim()}
          style={[
            {
              color: textColor,
              minHeight: 48,
            },
            style,
          ]}
          placeholderTextColor={placeholderColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            className="absolute right-3 top-0 bottom-0 justify-center z-10"
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className={`text-ios-sm mt-1 ${isDarkMode ? 'text-destructive-dark' : 'text-destructive'}`}>
          {error}
        </Text>
      )}
      
      {helper && !error && (
        <Text className={`text-ios-sm mt-1 ${isDarkMode ? 'text-muted-dark' : 'text-muted'}`}>
          {helper}
        </Text>
      )}
    </View>
  );
};

