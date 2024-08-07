package com.totalplaintextreader

import android.content.ContentUris
import android.content.ContentValues
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MediaStoreModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    private val BUFFER_SIZE = 1024

    override fun getName(): String = "MediaStoreModule"

    private fun getMimeTypeFromExtension(fileName: String): String {
        val extension = fileName.substringAfterLast('.', "")
        return when (extension.toLowerCase()) {
            "json" -> "application/json"
            "xml" -> "application/xml"
            "csv" -> "text/csv"
            "html" -> "text/html"
            "css" -> "text/css"
            "js" -> "application/javascript"
            "ts" -> "application/typescript"
            "py" -> "text/x-python"
            "sh" -> "application/x-sh"
            "bat" -> "application/x-bat"
            "ini" -> "text/x-ini"
            "conf" -> "text/x-conf"
            else -> "text/plain" // Default MIME type
        }
    }

    @ReactMethod
    fun saveFile(
        fileName: String,
        fileContent: String,
        callback: Callback,
    ) {
        try {
            val fileUri = checkIfFileExists(fileName)

            if (fileUri != null) {
                writeContentToFile(fileUri, fileContent)
                callback.invoke(null, "File saved successfully.")
            } else {
                val uri = createFileUri(fileName)
                writeContentToFile(uri, fileContent)
                callback.invoke(null, "File saved successfully.")
            }
        } catch (e: Exception) {
            callback.invoke(e.toString(), null)
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
        val values =
            ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, getMimeTypeFromExtension(fileName))
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            }
        return reactContext.contentResolver.insert(MediaStore.Files.getContentUri("external"), values)
    }

    private fun writeContentToFile(
        uri: Uri?,
        content: String,
    ) {
        uri?.let {
            reactContext.contentResolver.openOutputStream(it)?.use { outputStream ->
                outputStream.bufferedWriter().use { writer ->
                    writer.write(content)
                }
            }
        } ?: run {
            Log.e("MediaStoreModule", "Failed to get URI for writing content.")
        }
    }
}
