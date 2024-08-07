import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Switch,
    StyleSheet,
    Alert,
    Linking,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';

const { FileIntentModule, MediaStoreModule } = NativeModules;

const FileEditor = () => {
    const [ fileUri, setFileUri ] = useState( null );
    const [ fileName, setFileName ] = useState( '' );
    const [ fileContent, setFileContent ] = useState( '' );

    useEffect( () => {
        FileIntentModule.getInitialIntent()
            .then( ( data ) => {
                setFileUri( data.uri );
                setFileName( data.name );
                setFileContent( data.content );
            } )
            .catch( ( error ) => {
                console.log( 'Error getting file intent:', error );
            } );
    }, [] );

    async function openFile() {
        /* trunk-ignore(eslint/prettier/prettier) */
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
            } );
            const file = res[ 0 ];
            setFileUri( file.uri );
            setFileName( file.name );
            const content = await RNFS.readFile( file.uri, 'utf8' );
            setFileContent( content );
        } catch ( err ) {
            if ( DocumentPicker.isCancel( err ) ) {
                console.log( 'File selection cancelled' );
            } else {
                console.error( 'Error selecting file:', err );
                Alert.alert( 'Error', 'Unable to open file' );
            }
        }
    }

    const saveFileContent = async () => {

        if ( fileName === "" ) {
            Alert.alert( "You must give a file name" );
            return;
        }

        try {
            const result = await NativeModules.MediaStoreModule.saveFile(
                fileName,
                fileContent,
                ( error, success ) => {
                    if ( error ) {
                        console.error( 'Failed to save file:', error );
                        Alert.alert("Failed to save file");
                    } else {
                        console.log( 'File saved successfully:', success );
                        Alert.alert('File saved successfully');
                    }
                },
            );
        } catch ( error ) {
            console.error( 'Failed to save file:', error );
        }
    };

    return (
        <View style={ styles.container }>
            <TouchableOpacity style={ styles.button } onPress={ openFile }>
                <Text style={ styles.buttonText }>Select file</Text>
            </TouchableOpacity>

            { fileUri && (
                <>
                    <Text style={ styles.fileName }>File: { fileName }</Text>
                    <TextInput
                        style={ styles.textInput }
                        multiline
                        value={ fileContent }
                        onChangeText={ setFileContent }
                    />
                    <Text style={ styles.label }>Modify the file name:</Text>
                    <TextInput
                        style={ styles.input }
                        onChangeText={ setFileName }
                        value={ fileName }
                        placeholder="Enter new name"
                    />
                    <TouchableOpacity style={ styles.button } onPress={ saveFileContent }>
                        <Text style={ styles.buttonText }>Save Changes</Text>
                    </TouchableOpacity>
                </>
            ) }
        </View>
    );
};

const styles = StyleSheet.create( {
    container: {
        flex: 1,
        padding: 5,
        fontSize: 12,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        backgroundColor: '#f0f0f0',
    },
    fileName: {
        marginTop: 3,
        fontSize: 12,
        fontWeight: 'bold',
    },
    textInput: {
        flex: 1,
        fontSize: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        marginTop: 10,
        padding: 5,
        backgroundColor: '#fff',
        textAlignVertical: 'top',
    },
    input: {
        width: '100%',
        marginBottom: 3,
        padding: 3,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 3,
        fontSize: 12,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
        marginBottom: 3,
        justifyContent: 'flex-start',
    },
    label: {
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 3,
        marginTop: 3,
    },
    button: {
        backgroundColor: '#FF6347',  // Un color vistoso, Tomate
        padding: 5,                 // Espaciado interno para que el botón sea más grande y cómodo
        borderRadius: 3,             // Bordes redondeados
        alignItems: 'center',        // Alinea el texto al centro horizontalmente
        justifyContent: 'center',    // Alinea el texto al centro verticalmente
        width: '100%',               // Ocupa el 100% del ancho del contenedor padre
        marginVertical: 3,           // Margen vertical para separar de otros elementos si es necesario
    },
    buttonText: {
        fontSize: 12,                // Tamaño de texto
        color: 'white',              // Color del texto
        textTransform: 'uppercase',  // Texto en mayúsculas
    },
} );

export default FileEditor;
