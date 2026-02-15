import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, NativeModules } from 'react-native';

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children }: any) => children,
    SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('react-native-document-picker', () => ({
    __esModule: true,
    default: {
        pick: jest.fn(),
        isCancel: (err: any) => err?.message === 'cancel',
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

jest.spyOn(Alert, 'alert');

// ── Import after mocks ────────────────────────────────────────────────────────

import FileEditor from '../Pages/FileEditor/FileEditor';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

// Get references to actual mocked functions
const mockPick = DocumentPicker.pick as jest.Mock;
const mockReadFile = RNFS.readFile as jest.Mock;

// Shorthand refs to the native module mocks
const { FileIntentModule, MediaStoreModule } = NativeModules;

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('FileEditor', () => {
    beforeEach(() => {
        mockPick.mockReset();
        mockReadFile.mockReset();
        FileIntentModule.getInitialIntent
            .mockRejectedValue(new Error('No intent'));
        MediaStoreModule.saveFile
            .mockResolvedValue('content://saved-uri');
        MediaStoreModule.getFileName
            .mockResolvedValue('saved-file.txt');
        MediaStoreModule.checkFileExists
            .mockResolvedValue(false);
        (Alert.alert as jest.Mock).mockClear();
    });

    // ── Rendering ──

    it('renders all main UI elements', () => {
        const { getByText, getByPlaceholderText } = render(<FileEditor />);

        expect(getByText('Select file')).toBeTruthy();
        expect(getByText('+')).toBeTruthy();
        expect(getByText('Save Changes')).toBeTruthy();
        expect(getByText('Edit:')).toBeTruthy();
        expect(getByPlaceholderText('Enter the file name...')).toBeTruthy();
        expect(getByPlaceholderText('Write your notes...')).toBeTruthy();
    });

    it('shows empty file name initially', () => {
        const { getByText } = render(<FileEditor />);
        expect(getByText('File:')).toBeTruthy();
    });

    // ── New file ──

    it('clears all fields when + button is pressed', async () => {
        const { getByText, getByPlaceholderText } = render(<FileEditor />);

        const fileNameInput = getByPlaceholderText('Enter the file name...');
        const contentInput = getByPlaceholderText('Write your notes...');
        fireEvent.changeText(fileNameInput, 'test.txt');
        fireEvent.changeText(contentInput, 'Some content');

        fireEvent.press(getByText('+'));

        expect(fileNameInput.props.value).toBe('');
        expect(contentInput.props.value).toBe('');
    });

    // ── Save validation ──

    it('shows alert when saving without file name', () => {
        const { getByText } = render(<FileEditor />);

        fireEvent.press(getByText('Save Changes'));

        expect(Alert.alert).toHaveBeenCalledWith('You must give a file name');
    });

    it('saves directly when file does not exist', async () => {
        const { getByText, getByPlaceholderText } = render(<FileEditor />);

        fireEvent.changeText(
            getByPlaceholderText('Enter the file name...'),
            'new-file.txt',
        );
        fireEvent.changeText(
            getByPlaceholderText('Write your notes...'),
            'Hello world',
        );

        await act(async () => {
            fireEvent.press(getByText('Save Changes'));
        });

        await waitFor(() => {
            expect(MediaStoreModule.checkFileExists).toHaveBeenCalledWith('new-file.txt');
            expect(MediaStoreModule.saveFile).toHaveBeenCalledWith('new-file.txt', 'Hello world');
        });
    });

    // ── Overwrite confirmation ──

    it('shows overwrite confirmation when file exists', async () => {
        MediaStoreModule.checkFileExists.mockResolvedValue(true);

        const { getByText, getByPlaceholderText } = render(<FileEditor />);

        fireEvent.changeText(
            getByPlaceholderText('Enter the file name...'),
            'existing.txt',
        );
        fireEvent.changeText(
            getByPlaceholderText('Write your notes...'),
            'Updated content',
        );

        await act(async () => {
            fireEvent.press(getByText('Save Changes'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'File already exists',
                '"existing.txt" already exists in Downloads/notes. Do you want to overwrite it?',
                expect.arrayContaining([
                    expect.objectContaining({ text: 'Cancel' }),
                    expect.objectContaining({ text: 'Overwrite' }),
                ]),
            );
        });
    });

    // ── Edit toggle ──

    it('starts with editable content area', () => {
        const { getByPlaceholderText } = render(<FileEditor />);
        const contentInput = getByPlaceholderText('Write your notes...');
        expect(contentInput.props.editable).toBe(true);
    });

    // ── Open file ──

    it('opens a file and displays its content', async () => {
        mockPick.mockResolvedValue([
            { uri: 'content://test-file', name: 'hello.txt' },
        ]);
        mockReadFile.mockResolvedValue('File content here');

        const { getByText, getByPlaceholderText } = render(<FileEditor />);

        await act(async () => {
            fireEvent.press(getByText('Select file'));
        });

        await waitFor(() => {
            const contentInput = getByPlaceholderText('Write your notes...');
            expect(contentInput.props.value).toBe('File content here');
            expect(getByText('File: hello.txt')).toBeTruthy();
        });
    });

    it('handles file selection cancellation', async () => {
        mockPick.mockRejectedValue({ message: 'cancel' });

        const { getByText } = render(<FileEditor />);

        await act(async () => {
            fireEvent.press(getByText('Select file'));
        });

        expect(Alert.alert).not.toHaveBeenCalledWith('Error', expect.anything());
    });

    it('shows error alert on file open failure', async () => {
        mockPick.mockRejectedValue(new Error('Permission denied'));

        const { getByText } = render(<FileEditor />);

        await act(async () => {
            fireEvent.press(getByText('Select file'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Unable to open file');
        });
    });

    // ── Intent handling ──

    it('loads file from initial intent', async () => {
        FileIntentModule.getInitialIntent.mockResolvedValue({
            uri: 'content://intent-file',
            name: 'from-intent.txt',
            content: 'Intent file content',
        });

        const { getByText, getByPlaceholderText } = render(<FileEditor />);

        await waitFor(() => {
            expect(getByText('File: from-intent.txt')).toBeTruthy();
            const contentInput = getByPlaceholderText('Write your notes...');
            expect(contentInput.props.value).toBe('Intent file content');
        });
    });

    // ── Save success ──

    it('shows success alert with saved file name', async () => {
        const { getByText, getByPlaceholderText } = render(<FileEditor />);

        fireEvent.changeText(
            getByPlaceholderText('Enter the file name...'),
            'test.txt',
        );
        fireEvent.changeText(
            getByPlaceholderText('Write your notes...'),
            'Content',
        );

        await act(async () => {
            fireEvent.press(getByText('Save Changes'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'File successfully saved as: saved-file.txt',
            );
        });
    });
});
