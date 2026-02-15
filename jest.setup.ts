// Setup native modules before any test runs
import { NativeModules } from 'react-native';

NativeModules.FileIntentModule = {
    getInitialIntent: jest.fn().mockRejectedValue(new Error('No intent')),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
};

NativeModules.MediaStoreModule = {
    saveFile: jest.fn().mockResolvedValue('content://saved-uri'),
    getFileName: jest.fn().mockResolvedValue('saved-file.txt'),
    checkFileExists: jest.fn().mockResolvedValue(false),
};
