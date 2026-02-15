/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

import { it } from '@jest/globals';
import { render } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('react-native-document-picker', () => ({
  __esModule: true,
  default: {
    pick: jest.fn(),
    isCancel: jest.fn(),
    types: { plainText: 'text/plain' },
  },
}));

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: { readFile: jest.fn() },
}));

jest.mock('react-native-rate', () => ({
  __esModule: true,
  default: { rate: jest.fn() },
  AndroidMarket: { Google: 1 },
}));

it('renders correctly', () => {
  render(<App />);
});
