import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface FaceBoxProps {
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isDetected: boolean;
  confidence?: number;
}

const FaceBox: React.FC<FaceBoxProps> = ({ bounds, isDetected, confidence = 0 }) => {
  const borderColor = isDetected
    ? confidence > 0.9
      ? '#10B981'  // green - high confidence
      : confidence > 0.75
      ? '#F59E0B'  // yellow - medium
      : '#EF4444'  // red - low
    : '#6C63FF';   // purple - searching

  if (!bounds) {
    return (
      <View style={[styles.defaultBox, { borderColor }]}>
        <View style={[styles.corner, styles.topLeft, { borderColor }]} />
        <View style={[styles.corner, styles.topRight, { borderColor }]} />
        <View style={[styles.corner, styles.bottomLeft, { borderColor }]} />
        <View style={[styles.corner, styles.bottomRight, { borderColor }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.box,
        {
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
          borderColor,
        },
      ]}
    >
      <View style={[styles.corner, styles.topLeft, { borderColor }]} />
      <View style={[styles.corner, styles.topRight, { borderColor }]} />
      <View style={[styles.corner, styles.bottomLeft, { borderColor }]} />
      <View style={[styles.corner, styles.bottomRight, { borderColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  defaultBox: {
    position: 'absolute',
    width: 200,
    height: 240,
    borderWidth: 2,
    borderRadius: 4,
    alignSelf: 'center',
    top: '25%',
    left: '20%',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'transparent',
  },
  topLeft: { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: 2 },
  topRight: { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderRadius: 2 },
  bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: 2 },
  bottomRight: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: 2 },
});

export default FaceBox;
