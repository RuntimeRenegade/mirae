import React, { useState } from 'react';
import { TextInput, View, TouchableOpacity, StyleSheet, ViewStyle, Text } from 'react-native';

export interface GlassInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  variant?: 'default' | 'search' | 'password';
  style?: ViewStyle;
  disabled?: boolean;
  secureTextEntry?: boolean;
}

/**
 * GlassInput Component - Traditional React Native Styling
 * 
 * A reusable input component with glass morphism effects, focus states,
 * and icon support. Uses traditional React Native StyleSheet instead of NativeWind.
 */
export const GlassInput: React.FC<GlassInputProps & {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  returnKeyType?: 'done' | 'next' | 'search' | 'go';
  onSubmitEditing?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
}> = ({
  placeholder,
  value,
  onChangeText,
  variant = 'default',
  iconLeft,
  iconRight,
  style,
  disabled = false,
  secureTextEntry = false,
  onFocus,
  onBlur,
  autoFocus = false,
  keyboardType = 'default',
  returnKeyType = 'done',
  onSubmitEditing,
  multiline = false,
  numberOfLines = 1,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Get variant-specific container styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'search':
        return styles.searchVariant;
      case 'password':
        return styles.passwordVariant;
      default:
        return styles.defaultVariant;
    }
  };

  // Get focus styles
  const getFocusStyle = () => {
    return isFocused ? styles.focused : styles.unfocused;
  };

  const containerStyle = [
    styles.container,
    getVariantStyle(),
    getFocusStyle(),
    disabled ? styles.disabled : null,
    multiline ? styles.multiline : styles.singleline,
    style
  ];

  const inputStyle = [
    styles.input,
    {
      paddingLeft: iconLeft || variant === 'search' ? 40 : 16,
      paddingRight: iconRight || variant === 'password' ? 40 : 16,
      textAlignVertical: multiline ? 'top' as const : 'center' as const,
    }
  ];

  return (
    <View style={styles.wrapper}>
      <View style={containerStyle}>
        {/* Left icon */}
        {(iconLeft || variant === 'search') && (
          <View style={styles.iconLeft}>
            {iconLeft || (variant === 'search' && (
              <View style={styles.searchIcon}>
                <Text style={styles.searchIconText}>🔍</Text>
              </View>
            ))}
          </View>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={variant === 'password' ? !isPasswordVisible : secureTextEntry}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={inputStyle}
          placeholderTextColor="#9CA3AF"
          selectionColor="#7c3aed"
          accessible={true}
          accessibilityLabel={placeholder}
          accessibilityHint={disabled ? 'Input is disabled' : undefined}
          {...props}
        />

        {/* Right icon or password toggle */}
        {(iconRight || variant === 'password') && (
          <TouchableOpacity
            onPress={variant === 'password' ? togglePasswordVisibility : undefined}
            disabled={variant !== 'password'}
            style={styles.iconRight}
            accessible={variant === 'password'}
            accessibilityLabel={variant === 'password' ? 'Toggle password visibility' : undefined}
            activeOpacity={variant === 'password' ? 0.7 : 1}
          >
            {iconRight || (variant === 'password' && (
              <View style={styles.eyeIcon}>
                <Text style={[
                  styles.eyeIconText,
                  { color: isPasswordVisible ? '#7c3aed' : '#6B7280' }
                ]}>
                  {isPasswordVisible ? '👁️' : '🙈'}
                </Text>
              </View>
            ))}
          </TouchableOpacity>
        )}
      </View>

      {/* Focus indicator line */}
      {isFocused && (
        <View style={styles.focusIndicator} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  // Variant styles
  defaultVariant: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchVariant: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  passwordVariant: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Focus styles
  focused: {
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  unfocused: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Size styles
  singleline: {
    height: 44,
  },
  multiline: {
    minHeight: 88,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  // Input styles
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Metamorphous',
    color: '#1F2937',
    paddingVertical: 0,
  },
  // Icon styles
  iconLeft: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
  },
  iconRight: {
    position: 'absolute',
    right: 12,
    zIndex: 10,
  },
  searchIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconText: {
    fontSize: 16,
    opacity: 0.6,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIconText: {
    fontSize: 16,
  },
  // State styles
  disabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  // Focus indicator
  focusIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#7c3aed',
    borderRadius: 1,
  },
});

/**
 * GlassInput Variants
 * 
 * Pre-configured input components for common use cases
 */

// Default glass input
export const GlassInputDefault: React.FC<Omit<GlassInputProps, 'variant'> & {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}> = (props) => (
  <GlassInput variant="default" {...props} />
);

// Search glass input with built-in search icon
export const GlassInputSearch: React.FC<Omit<GlassInputProps, 'variant'> & {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}> = (props) => (
  <GlassInput variant="search" returnKeyType="search" {...props} />
);

// Password glass input with visibility toggle
export const GlassInputPassword: React.FC<Omit<GlassInputProps, 'variant'> & {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}> = (props) => (
  <GlassInput variant="password" secureTextEntry={true} {...props} />
);

export default GlassInput;
