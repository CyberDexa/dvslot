import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Theme } from '@/constants/Theme';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function Loading({
  message = 'Loading...',
  size = 'large',
  color = Theme.colors.primary[500],
  fullScreen = false,
  style,
}: LoadingProps) {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.message, { color }]}>{message}</Text>
      )}
    </View>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    title: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.emptyContainer, style]}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && (
        <Text style={styles.emptyDescription}>{description}</Text>
      )}
      {action && (
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={action.onPress}
        >
          <Text style={styles.emptyActionText}>{action.title}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error';
  text?: string;
}

export function StatusBadge({ status, text }: StatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'active':
        return {
          backgroundColor: Theme.colors.success[100],
          borderColor: Theme.colors.success[300],
          color: Theme.colors.success[700],
        };
      case 'inactive':
        return {
          backgroundColor: Theme.colors.gray[100],
          borderColor: Theme.colors.gray[300],
          color: Theme.colors.gray[700],
        };
      case 'pending':
        return {
          backgroundColor: Theme.colors.warning[100],
          borderColor: Theme.colors.warning[300],
          color: Theme.colors.warning[700],
        };
      case 'success':
        return {
          backgroundColor: Theme.colors.success[100],
          borderColor: Theme.colors.success[300],
          color: Theme.colors.success[700],
        };
      case 'error':
        return {
          backgroundColor: Theme.colors.error[100],
          borderColor: Theme.colors.error[300],
          color: Theme.colors.error[700],
        };
      default:
        return {
          backgroundColor: Theme.colors.gray[100],
          borderColor: Theme.colors.gray[300],
          color: Theme.colors.gray[700],
        };
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeStyle.backgroundColor,
          borderColor: badgeStyle.borderColor,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: badgeStyle.color }]}>
        {text || status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.white,
  },
  message: {
    marginTop: Theme.spacing[4],
    fontSize: Theme.typography.fontSize.base,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: Theme.spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing[4],
  },
  emptyTitle: {
    fontSize: Theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: Theme.colors.gray[800],
    marginBottom: Theme.spacing[2],
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Theme.spacing[6],
    maxWidth: 280,
  },
  emptyAction: {
    backgroundColor: Theme.colors.primary[500],
    paddingHorizontal: Theme.spacing[6],
    paddingVertical: Theme.spacing[3],
    borderRadius: Theme.borderRadius.lg,
  },
  emptyActionText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.fontSize.base,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: Theme.spacing[3],
    paddingVertical: Theme.spacing[1],
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default {
  Loading,
  EmptyState,
  StatusBadge,
};
