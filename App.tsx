import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import {NativeModules} from 'react-native';

const { MediaStoreModule } = NativeModules;

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

    if(fileName === ""){
        Alert.alert("You must give a file name");
        return;
    }

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
      <TouchableOpacity style={styles.button} onPress={openFile}>
        <Text style={styles.buttonText}>Select file</Text>
      </TouchableOpacity>

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
            <Text style={styles.label}>Overwrite File: </Text>
            <Switch
                value={overwrite}
                onValueChange={setOverwrite}
                trackColor={{ false: "#767577", true: "#767577" }}
                thumbColor={overwrite ? "#FF6347" : "#d2ba32"}
            />
          </View>
          <Text style={styles.label}>Modify the file name:</Text>
          <TextInput
            style={styles.input}
            onChangeText={setFileName}
            value={fileName}
            placeholder="Enter new name"
          />
          <TouchableOpacity style={styles.button} onPress={saveFileContent}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    fontSize: 20,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: '#f0f0f0',
  },
  fileName: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
  },
  input: {
    width: '100%',
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    fontSize: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    justifyContent: 'flex-start',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#FF6347',  // Un color vistoso, Tomate
    padding: 12,                 // Espaciado interno para que el botón sea más grande y cómodo
    borderRadius: 8,             // Bordes redondeados
    alignItems: 'center',        // Alinea el texto al centro horizontalmente
    justifyContent: 'center',    // Alinea el texto al centro verticalmente
    width: '100%',               // Ocupa el 100% del ancho del contenedor padre
    marginVertical: 5,           // Margen vertical para separar de otros elementos si es necesario
  },
  buttonText: {
    fontSize: 20,                // Tamaño de texto
    color: 'white',              // Color del texto
    textTransform: 'uppercase',  // Texto en mayúsculas
  },
});

export default FileEditor;
