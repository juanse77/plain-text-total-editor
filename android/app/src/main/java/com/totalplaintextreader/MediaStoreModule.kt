package com.totalplaintextreader

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Callback
import java.io.OutputStream

class MediaStoreModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val BUFFER_SIZE = 1024

    override fun getName(): String {
        return "MediaStoreModule"
    }

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
    fun saveFile(fileName: String, fileContent: String, callback: Callback) {
        try {
            // Crear y obtener el URI del archivo
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, getMimeTypeFromExtension(fileName))
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            }
            val uri: Uri? = reactContext.contentResolver.insert(MediaStore.Files.getContentUri("external"), values)
            
            if (uri == null) {
                callback.invoke("Failed to create a new MediaStore record.", null)
                return
            }

            // Escribir contenido en el archivo
            reactContext.contentResolver.openOutputStream(uri)?.use { outputStream ->
                outputStream.writer().use { writer ->
                    writer.write(fileContent)
                }
            }

            callback.invoke(null, "File saved successfully.")
        } catch (e: Exception) {
            callback.invoke(e.toString(), null)
        }
    }

}
