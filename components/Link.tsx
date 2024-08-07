import React from 'react';
import { Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';

const Link = ({ url, children }) => {
  const handlePress = () => {
    Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={ 0.8 }>
      <Text style={styles.linkText}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  linkText: {
    color: '#555',
    textDecorationLine: 'underline',
    fontSize: 13,
    textAlignVertical: 'center',
  }
});

export default Link;
