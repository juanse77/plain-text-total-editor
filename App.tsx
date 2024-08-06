import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';

const FileEditor = () => {
    const [ fileUri, setFileUri ] = useState( null );
    const [ fileName, setFileName ] = useState( '' );
    const [ fileContent, setFileContent ] = useState( '' );

    // Función para seleccionar un archivo usando SAF
    const openFile = async () => {
        try {
            const res = await DocumentPicker.pick( {
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
                copyTo: 'documentDirectory', // Copiar el archivo al directorio de documentos de la aplicación
            } );

            const file = res[ 0 ];
            setFileUri( file.uri );
            setFileName( file.name );

            const content = await RNFS.readFile( file.uri, 'utf8' );
            setFileContent( content );
        } catch ( err ) {
            if ( DocumentPicker.isCancel( err ) ) {
                console.log( 'Selección de archivo cancelada' );
            } else {
                console.error( 'Error al seleccionar archivo:', err );
                Alert.alert( 'Error', 'No se pudo abrir el archivo' );
            }
        }
    };

    const { MediaStoreModule } = NativeModules;

    const saveFileContent = async (fileName, fileContent) => {
        try {
            const result = await MediaStoreModule.saveFile(fileName, fileContent, (error, successMessage) => {
                if (error) {
                    console.error('Failed to save file:', error);
                } else {
                    console.log(successMessage);
                }
            });
        } catch (error) {
            console.error("Failed to save file:", error);
        }
    };
    
    return (
        <View style={ styles.container }>
            <Button title="Seleccionar Archivo" onPress={ openFile } />
            { fileUri && (
                <>
                    <Text style={ styles.fileName }>Archivo: { fileName }</Text>
                    <TextInput
                        style={ styles.textInput }
                        multiline
                        value={ fileContent }
                        onChangeText={ setFileContent }
                    />
                    <Button title="Guardar Cambios" onPress={() => saveFileContent(fileName, fileContent)} />
                </>
            ) }
        </View>
    );
};

const styles = StyleSheet.create( {
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
    },
    fileName: {
        marginTop: 20,
        fontSize: 16,
        fontWeight: 'bold',
    },
    textInput: {
        height: 200,
        borderColor: '#ccc',
        borderWidth: 1,
        marginTop: 20,
        padding: 10,
        backgroundColor: '#fff',
        textAlignVertical: 'top',
    },
} );

export default FileEditor;
