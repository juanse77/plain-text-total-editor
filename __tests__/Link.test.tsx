import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import Link from '../components/Link';

// Mock Linking.openURL at module level
jest.spyOn(Linking, 'openURL');

describe('Link component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (Linking.openURL as jest.Mock).mockResolvedValue(true);
    });

    it('renders children text', () => {
        const { getByText } = render(
            <Link url="https://example.com">Click me</Link>,
        );
        expect(getByText('Click me')).toBeTruthy();
    });

    it('opens URL when pressed', () => {
        const { getByText } = render(
            <Link url="https://example.com">Click me</Link>,
        );
        fireEvent.press(getByText('Click me'));
        expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
    });

    it('does not crash when openURL fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        (Linking.openURL as jest.Mock).mockRejectedValueOnce(
            new Error('Cannot open URL'),
        );

        const { getByText } = render(
            <Link url="https://bad-url.com">Broken link</Link>,
        );
        fireEvent.press(getByText('Broken link'));

        // Wait for the async catch to run
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to open URL:',
            expect.any(Error),
        );
        consoleSpy.mockRestore();
    });
});
