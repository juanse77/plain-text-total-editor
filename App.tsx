import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import {NativeModules} from 'react-native';

const FileEditor = () => {
  const [fileUri, setFileUri] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  async function openFile() {
    /* trunk-ignore(eslint/prettier/prettier) */
    try {
      const res = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.plainText,
          'text/markdown',
          'application/json',
          'application/xml',
          'text/csv',
          'text/html',
          'text/css',
          'application/javascript',
          'application/typescript',
          'text/x-python',
          'application/x-sh',
          'application/x-bat',
          'text/x-ini',
          'text/x-conf',
        ],
      });
      const file = res[0];
      setFileUri(file.uri);
      setFileName(file.name);
      const content = await RNFS.readFile(file.uri, 'utf8');
      setFileContent(content);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('File selection cancelled');
      } else {
        console.error('Error selecting file:', err);
        Alert.alert('Error', 'Unable to open file');
      }
    }
  }

  const saveFileContent = async () => {
    try {
      const result = await NativeModules.MediaStoreModule.saveFile(
        fileName,
        fileContent,
        overwrite,
        (error, success) => {
          if (error) {
            console.error('Failed to save file:', error);
          } else {
            console.log('File saved successfully:', success);
          }
        },
      );
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Select File" onPress={openFile} />
      {fileUri && (
        <>
          <Text style={styles.fileName}>File: {fileName}</Text>
          <TextInput
            style={styles.textInput}
            multiline
            value={fileContent}
            onChangeText={setFileContent}
          />
          <View style={styles.switchContainer}>
            <Text>Overwrite File:</Text>
            <Switch value={overwrite} onValueChange={setOverwrite} />
          </View>
          <Button title="Save Changes" onPress={saveFileContent} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: '#f0f0f0',
  },
  fileName: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
  textInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});

export default FileEditor;
