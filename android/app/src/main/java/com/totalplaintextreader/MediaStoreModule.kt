package com.totalplaintextreader

import android.content.ContentUris
import android.content.ContentValues
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

import android.database.Cursor
import android.provider.OpenableColumns


class MediaStoreModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    private val BUFFER_SIZE = 1024

    override fun getName(): String = "MediaStoreModule"

    private fun getMimeTypeFromExtension(fileName: String): String {
        val extension = fileName.substringAfterLast('.', "")
        return when (extension.toLowerCase()) {
            "md" -> "text/markdown"
            "json" -> "application/json"
            "html" -> "text/html"
            "css" -> "text/css"
            "js" -> "application/javascript"
            "py" -> "text/x-python"
            "pl" -> "text/x-perl"
            "pm" -> "text/x-perl"
            "cpp" -> "text/x-c++src"
            "cxx" -> "text/x-c++src"
            "cc" -> "text/x-c++src"
            "h" -> "text/x-c++src"
            "hpp" -> "text/x-c++src"
            else -> "text/plain" // Default MIME type
        }
    }

    @ReactMethod
    fun saveFile(
        fileName: String,
        fileContent: String,
        promise: Promise
    ) {
        try {
            var fileUri = checkIfFileExists(fileName)

            if (fileUri != null) {
                writeContentToFile(fileUri, fileContent)
            } else {
                fileUri = createFileUri(fileName)
                writeContentToFile(fileUri, fileContent)
            }

            if (fileUri != null) {
                promise.resolve(fileUri.toString())
            } else {
                promise.reject("File Error", "Could not create or write to file")
            }
        } catch (e: Exception) {
            promise.reject("Exception", e)
        }
    }

    @ReactMethod
    fun getFileName(uriString: String, promise: Promise) {
        val uri = Uri.parse(uriString)
        val cursor: Cursor? = reactContext.contentResolver.query(uri, null, null, null, null)
        cursor?.use {
            if (cursor.moveToFirst()) {
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (nameIndex != -1) {
                    val fileName = cursor.getString(nameIndex)
                    promise.resolve(fileName)
                } else {
                    promise.reject("File Error", "Unable to retrieve file name")
                }
            } else {
                promise.reject("File Error", "No file found")
            }
        } ?: run {
            promise.reject("File Error", "Failed to query file")
        }
    }

    private fun checkIfFileExists(fileName: String): Uri? {
        val fileCursor =
            reactContext.contentResolver.query(
                MediaStore.Files.getContentUri("external"),
                arrayOf(MediaStore.MediaColumns._ID),
                "${MediaStore.MediaColumns.DISPLAY_NAME} = ?",
                arrayOf(fileName),
                null,
            )
        fileCursor?.use { cursor ->
            if (cursor.moveToFirst()) {
                val columnIndex = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
                if (columnIndex != -1) {
                    val id = cursor.getLong(columnIndex)
                    return ContentUris.withAppendedId(MediaStore.Files.getContentUri("external"), id)
                } else {
                    Log.e("MediaStoreModule", "Column ID not found")
                }
            }
        }
        return null
    }

    private fun createFileUri(fileName: String): Uri? {
        val notesFolder = "${Environment.DIRECTORY_DOWNLOADS}/notes"
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, getMimeTypeFromExtension(fileName))
            put(MediaStore.MediaColumns.RELATIVE_PATH, notesFolder)
        }
        return reactContext.contentResolver.insert(MediaStore.Files.getContentUri("external"), values)
    }


    private fun writeContentToFile(
        uri: Uri?,
        content: String,
    ) {
        uri?.let {
            reactContext.contentResolver.openOutputStream(it, "wt")?.use { outputStream ->
                outputStream.bufferedWriter().use { writer ->
                    writer.write(content)
                }
            }
        } ?: run {
            Log.e("MediaStoreModule", "Failed to get URI for writing content.")
        }
    }

}
