import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/context/ThemeContext';

interface GlassHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  leftAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  transparent?: boolean;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  rightAction,
  leftAction,
  transparent = false,
}) => {
  const { isDarkMode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const HeaderContent = () => (
    <View 
      style={{ paddingTop: insets.top + 8 }}
      className="px-4 pb-3"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {(showBack || leftAction) && (
            <TouchableOpacity
              onPress={leftAction?.onPress || handleBack}
              className="p-2 -ml-2 mr-2"
              activeOpacity={0.7}
            >
              <Ionicons
                name={leftAction?.icon || "arrow-back"}
                size={24}
                color={colors.foreground}
              />
            </TouchableOpacity>
          )}
          
          <View className="flex-1">
            {title && (
              <Text 
                className="text-ios-xl font-bold"
                style={{ color: colors.foreground }}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text 
                className="text-ios-sm"
                style={{ color: colors.muted }}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            className="p-2 -mr-2"
            activeOpacity={0.7}
          >
            <Ionicons
              name={rightAction.icon}
              size={24}
              color={colors.foreground}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (transparent) {
    return <HeaderContent />;
  }

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={30}
        tint={isDarkMode ? 'dark' : 'light'}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <HeaderContent />
      </BlurView>
    );
  }

  // Fallback for Android
  return (
    <View
      style={{
        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.95)' : 'rgba(242,242,247,0.95)',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <HeaderContent />
    </View>
  );
};

