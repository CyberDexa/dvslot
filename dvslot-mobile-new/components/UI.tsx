import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Theme } from '@/constants/Theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: Theme.borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...Theme.shadows.sm,
    };

    // Size variations
    switch (size) {
      case 'sm':
        baseStyle.paddingHorizontal = Theme.spacing[3];
        baseStyle.paddingVertical = Theme.spacing[2];
        break;
      case 'lg':
        baseStyle.paddingHorizontal = Theme.spacing[8];
        baseStyle.paddingVertical = Theme.spacing[4];
        break;
      default:
        baseStyle.paddingHorizontal = Theme.spacing[6];
        baseStyle.paddingVertical = Theme.spacing[3];
    }

    // Color variations
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = Theme.colors.gray[100];
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = Theme.colors.primary[500];
        break;
      case 'danger':
        baseStyle.backgroundColor = Theme.colors.error[500];
        break;
      case 'success':
        baseStyle.backgroundColor = Theme.colors.success[500];
        break;
      default:
        baseStyle.backgroundColor = Theme.colors.primary[500];
    }

    if (disabled) {
      baseStyle.backgroundColor = Theme.colors.gray[300];
      baseStyle.borderColor = Theme.colors.gray[300];
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
    };

    // Size variations
    switch (size) {
      case 'sm':
        baseTextStyle.fontSize = Theme.typography.fontSize.sm;
        break;
      case 'lg':
        baseTextStyle.fontSize = Theme.typography.fontSize.lg;
        break;
      default:
        baseTextStyle.fontSize = Theme.typography.fontSize.base;
    }

    // Color variations
    switch (variant) {
      case 'secondary':
        baseTextStyle.color = Theme.colors.gray[700];
        break;
      case 'outline':
        baseTextStyle.color = disabled ? Theme.colors.gray[400] : Theme.colors.primary[500];
        break;
      default:
        baseTextStyle.color = disabled ? Theme.colors.gray[400] : Theme.colors.white;
    }

    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'secondary' ? Theme.colors.primary[500] : Theme.colors.white}
        />
      ) : (
        <>
          {icon && (
            <Text style={[{ marginRight: Theme.spacing[2] }, getTextStyle()]}>
              {icon}
            </Text>
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Theme.spacing;
  shadow?: keyof typeof Theme.shadows;
}

export function Card({ 
  children, 
  style, 
  padding = 4, 
  shadow = 'base' 
}: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: Theme.colors.white,
          borderRadius: Theme.borderRadius.xl,
          padding: Theme.spacing[padding],
          ...Theme.shadows[shadow],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: keyof typeof Theme.colors;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary' 
}: StatCardProps) {
  return (
    <Card style={styles.statCard} padding={4}>
      <View style={styles.statHeader}>
        {icon && (
          <Text style={styles.statIcon}>{icon}</Text>
        )}
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color: Theme.colors[color][500] }]}>
            {value}
          </Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.statSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
    </Card>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
}

export function Header({ 
  title, 
  subtitle, 
  backgroundColor = Theme.colors.primary[600],
  textColor = Theme.colors.white,
  icon 
}: HeaderProps) {
  return (
    <View style={[styles.header, { backgroundColor }]}>
      <View style={styles.headerContent}>
        {icon && <Text style={styles.headerIcon}>{icon}</Text>}
        <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.headerSubtitle, { color: textColor, opacity: 0.9 }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    minWidth: 150,
  },
  statHeader: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Theme.spacing[2],
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: 'bold',
    marginBottom: Theme.spacing[1],
  },
  statTitle: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.gray[600],
    fontWeight: '600',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.gray[500],
    marginTop: Theme.spacing[1],
    textAlign: 'center',
  },
  header: {
    paddingVertical: Theme.spacing[8],
    paddingHorizontal: Theme.spacing[5],
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: Theme.spacing[2],
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: 'bold',
    marginBottom: Theme.spacing[2],
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Theme.typography.fontSize.base,
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default {
  Button,
  Card,
  StatCard,
  Header,
};
