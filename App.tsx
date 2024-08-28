import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Switch,
    StyleSheet,
    Alert,
    ScrollView,
    Image,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { NativeModules, NativeEventEmitter } from 'react-native';
import Rate, { AndroidMarket } from 'react-native-rate';

import Link from './components/Link';


const { FileIntentModule, MediaStoreModule } = NativeModules;

const FileEditor = () => {
    const [ fileUri, setFileUri ] = useState( null );
    const [ fileName, setFileName ] = useState( '' );
    const [ fileContent, setFileContent ] = useState( '' );
    const [ currentFileName, setCurrentFileName ] = useState( '' );
    const [ isEnabled, setIsEnabled ] = useState( true );

    const inputRef = useRef<TextInput>( null );

    useEffect( () => {
        const handleFileIntentReceived = ( event ) => {
            setFileUri( event.uri );
            setFileName( event.name );
            setCurrentFileName( event.name );
            setFileContent( event.content );
        };

        const eventEmitter = new NativeEventEmitter( NativeModules.FileIntentModule );
        const subscription = eventEmitter.addListener( 'onFileIntentReceived', handleFileIntentReceived );

        return () => subscription.remove();
    }, [] );

    useEffect( () => {
        FileIntentModule.getInitialIntent()
            .then( ( data ) => {
                setFileUri( data.uri );
                setFileName( data.name );
                setCurrentFileName( data.name );
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
                    'text/html',
                    'text/css',
                    'application/javascript',
                    'text/x-python',
                    'text/x-perl',
                    'text/x-c++src',
                ],
            } );
            const file = res[ 0 ];
            setFileUri( file.uri );
            setFileName( file.name );
            setCurrentFileName( file.name );
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

    const saveFileContent = () => {
        if ( !fileName ) {
            Alert.alert( "You must give a file name" );
            inputRef.current?.focus();
            return;
        }

        MediaStoreModule.saveFile( fileName, fileContent ).then( uri => {
            MediaStoreModule.getFileName( uri ).then( fileName => {
                Alert.alert( 'File successfully saved as: ' + fileName );
                setFileName( fileName );
                setCurrentFileName( fileName );
                console.log( 'File saved at URI:', uri );
            } ).catch( error => {
                Alert.alert( 'Error retrieving file name' );
                console.error( 'Error retrieving file name:', error );
            } );
        } ).catch( error => {
            Alert.alert( 'Error saving file' );
            console.error( 'Error saving file:', error );
        } );
    };

    const newFile = function () {
        setFileName( '' );
        setCurrentFileName( '' );
        setFileContent( '' );
        setFileUri( null );
        setIsEnabled( true );
    };

    const toggleSwitch = () => setIsEnabled( previousState => !previousState );

    const rateApp = () => {
        const options = {
            GooglePackageName: "com.totalplaintextreader",
            preferredAndroidMarket: AndroidMarket.Google,
            preferInApp: false,
            openAppStoreIfInAppFails: true,
            fallbackPlatformURL: "https://plain-text-total-editor.com/404.html"
        };

        Rate.rate( options, success => {
            if ( success ) {
                console.log( 'User Rated.' );
            }
        } );
    };

    return (
        <View style={ styles.container }>
            <View style={ styles.menu }>
                <TouchableOpacity style={ [ styles.button, { flex: 1 } ] } onPress={ openFile } activeOpacity={ 0.8 }>
                    <Text style={ styles.buttonText }>Select file</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ styles.add } onPress={ newFile } activeOpacity={ 0.8 }>
                    <Text style={ styles.buttonText }>+</Text>
                </TouchableOpacity>
            </View>
            <View style={ styles.menu }>
                <Text style={ styles.fileName }>File: { currentFileName }</Text>
                <TouchableOpacity style={ styles.add } onPress={ rateApp } activeOpacity={ 0.8 }>
                    <Image source={ require( './img/comments.png' ) } style={ styles.image } />
                </TouchableOpacity>
            </View>
            <ScrollView
                style={ styles.scrollView }
                showsVerticalScrollIndicator={ true } >
                <TextInput
                    style={ styles.textInput }
                    multiline={ true }
                    editable={ isEnabled }
                    value={ fileContent }
                    onChangeText={ setFileContent }
                    placeholder={ isEnabled ? "Write your notes..." : "Read only" }
                    placeholderTextColor="#555"
                    scrollEnabled={ false }
                />
            </ScrollView>
            <View style={ styles.menu }>
                <Text style={ styles.label }>Set the file name:</Text>
                <View style={ { flexDirection: 'row' } }>
                    <Text style={ [ styles.label, { marginRight: 3 } ] }>Edit:</Text>
                    <Switch
                        trackColor={ { false: '#767577', true: '#FF6347' } }
                        thumbColor={ isEnabled ? '#FF6347' : '#f4f3f4' }
                        onValueChange={ toggleSwitch }
                        value={ isEnabled }
                    />
                </View>
            </View>
            <TextInput
                ref={ inputRef }
                style={ styles.input }
                onChangeText={ setFileName }
                value={ fileName }
                placeholder="Enter the file name..."
                placeholderTextColor="#555"
            />
            <TouchableOpacity style={ styles.button } onPress={ saveFileContent } activeOpacity={ 0.8 }>
                <Text style={ styles.buttonText }>Save Changes</Text>
            </TouchableOpacity>

            <View style={ { justifyContent: 'center', alignItems: 'center' } }>
                <Text style={ styles.label }>
                    <Link url="https://plain-text-total-editor.com">
                        © { new Date().getFullYear() } Plain Text Total Editor
                    </Link>
                </Text>
            </View>

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
    menu: {
        flexDirection: 'row', // Alinea los hijos en una fila
        justifyContent: 'space-between', // Espacia los elementos al máximo
        alignItems: 'center'
    },
    fileName: {
        marginTop: 3,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        width: '80%',
    },
    scrollView: {
        flex: 1,
        width: '100%',
        borderWidth: 1,
        marginTop: 10,
        backgroundColor: '#fff',
    },
    textInput: {
        flex: 1,
        minHeight: '100%',
        padding: 5,
        fontSize: 16,
        backgroundColor: '#fff',
        textAlignVertical: 'top',
        color: '#333',
    },
    input: {
        width: '100%',
        marginBottom: 3,
        padding: 3,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 3,
        fontSize: 12,
        color: '#333',
        backgroundColor: 'white',
    },
    label: {
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 3,
        marginTop: 3,
        color: '#333',
    },
    button: {
        backgroundColor: '#FF6347',  // Un color vistoso, Tomate
        padding: 5,                 // Espaciado interno para que el botón sea más grande y cómodo
        borderRadius: 3,             // Bordes redondeados
        alignItems: 'center',        // Alinea el texto al centro horizontalmente
        justifyContent: 'center',    // Alinea el texto al centro verticalmente
        marginVertical: 3,
        resizeMode: 'contain',           // Margen vertical para separar de otros elementos si es necesario
    },
    add: {
        backgroundColor: '#FF6347',
        paddingVertical: 5,
        paddingHorizontal: 20,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 3,
        marginLeft: 3,
        width: 50,
    },
    buttonText: {
        fontSize: 16,                // Tamaño de texto
        color: 'white',              // Color del texto
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    image: {
        width: 20,
        height: 20,
    }
} );

export default FileEditor;
