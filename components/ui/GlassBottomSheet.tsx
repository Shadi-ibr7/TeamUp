import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/context/ThemeContext';

interface GlassBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number | 'auto';
  showHandle?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GlassBottomSheet: React.FC<GlassBottomSheetProps> = ({
  isVisible,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
}) => {
  const { isDarkMode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 0,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const SheetContent = () => (
    <Animated.View
      style={{
        transform: [{ translateY }],
        maxHeight: height === 'auto' ? SCREEN_HEIGHT * 0.9 : height,
        paddingBottom: insets.bottom,
      }}
      className="rounded-t-ios-2xl overflow-hidden"
      {...panResponder.panHandlers}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={40}
          tint={isDarkMode ? 'dark' : 'light'}
          className="flex-1"
        >
          <SheetInnerContent />
        </BlurView>
      ) : (
        <View
          style={{
            backgroundColor: isDarkMode ? 'rgba(18,18,20,0.98)' : 'rgba(255,255,255,0.98)',
          }}
          className="flex-1"
        >
          <SheetInnerContent />
        </View>
      )}
    </Animated.View>
  );

  const SheetInnerContent = () => (
    <>
      {showHandle && (
        <View className="items-center py-2">
          <View 
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: colors.muted }}
          />
        </View>
      )}
      
      {title && (
        <View className="flex-row items-center justify-between px-4 pb-3 border-b" style={{ borderColor: colors.border }}>
          <Text className="text-ios-lg font-bold" style={{ color: colors.foreground }}>
            {title}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="p-2 -mr-2"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={colors.muted} />
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {children}
        </View>
      </ScrollView>
    </>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1"
      >
        <Animated.View
          className="flex-1"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1 justify-end"
            onPress={(e) => e.stopPropagation()}
          >
            <SheetContent />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};
