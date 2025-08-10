import { Platform } from 'react-native';

// Cross-platform shadow styles
export const createShadow = (options: {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}) => {
  const {
    shadowColor = '#000',
    shadowOffset = { width: 0, height: 1 },
    shadowOpacity = 0.1,
    shadowRadius = 3,
    elevation = 3,
  } = options;

  if (Platform.OS === 'web') {
    // For web, use boxShadow
    const { width, height } = shadowOffset;
    return {
      boxShadow: `${width}px ${height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    };
  } else {
    // For mobile, use traditional shadow properties
    return {
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
      elevation, // Android
    };
  }
};

// Pre-defined shadow presets
export const shadowPresets = {
  small: createShadow({
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  }),
  medium: createShadow({
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  }),
  large: createShadow({
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  }),
};
