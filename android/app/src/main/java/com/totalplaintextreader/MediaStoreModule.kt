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
        val extension = fileName.substringAfterLast('.', "").lowercase()
        // No extension → use text/plain so Android appends .txt
        if (extension.isEmpty() || extension == fileName.lowercase()) {
            return "text/plain"
        }
        return when (extension) {
            // Markup & documentation
            "md", "markdown" -> "text/markdown"
            "html", "htm" -> "text/html"
            "xml" -> "text/xml"
            "xhtml" -> "application/xhtml+xml"
            // Data & config formats
            "json" -> "application/json"
            "csv" -> "text/csv"
            "tsv" -> "text/tab-separated-values"
            "yaml", "yml" -> "text/yaml"
            "toml" -> "application/toml"
            "ini", "cfg" -> "text/x-ini"
            "properties" -> "text/x-properties"
            "env" -> "text/plain"
            // Stylesheets
            "css" -> "text/css"
            "scss" -> "text/x-scss"
            "sass" -> "text/x-sass"
            "less" -> "text/x-less"
            // JavaScript & TypeScript
            "js", "mjs", "cjs" -> "application/javascript"
            "ts" -> "application/typescript"
            "jsx" -> "text/jsx"
            "tsx" -> "text/tsx"
            // Scripting languages
            "py", "pyw" -> "text/x-python"
            "pl", "pm" -> "text/x-perl"
            "rb" -> "text/x-ruby"
            "lua" -> "text/x-lua"
            "sh", "bash", "zsh" -> "text/x-shellscript"
            "php" -> "application/x-httpd-php"
            // Compiled language sources
            "c" -> "text/x-c"
            "h" -> "text/x-chdr"
            "cpp", "cxx", "cc" -> "text/x-c++src"
            "hpp", "hxx", "hh" -> "text/x-c++hdr"
            "cs" -> "text/x-csharp"
            "java" -> "text/x-java-source"
            "kt", "kts" -> "text/x-kotlin"
            "go" -> "text/x-go"
            "rs" -> "text/x-rustsrc"
            "swift" -> "text/x-swift"
            // Other text types
            "sql" -> "application/sql"
            "diff", "patch" -> "text/x-diff"
            "log" -> "text/x-log"
            "tex", "latex" -> "text/x-tex"
            "rtf" -> "text/rtf"
            "r" -> "text/x-r"
            "txt", "text" -> "text/plain"
            // Default: use application/octet-stream to prevent Android
            // from appending an unwanted extension like .txt
            else -> "application/octet-stream"
        }
    }

    @ReactMethod
    fun checkFileExists(fileName: String, promise: Promise) {
        try {
            val fileUri = checkIfFileExists(fileName)
            promise.resolve(fileUri != null)
        } catch (e: Exception) {
            promise.reject("Exception", e)
        }
    }

    @ReactMethod
    fun saveFile(
        fileName: String,
        fileContent: String,
        promise: Promise
    ) {
        try {
            val cleanName = fileName.trim()
            val mimeType = getMimeTypeFromExtension(cleanName)
            Log.d("MediaStoreModule", "saveFile: name='$cleanName', mime='$mimeType'")

            var fileUri = checkIfFileExists(cleanName)

            if (fileUri != null) {
                writeContentToFile(fileUri, fileContent)
            } else {
                fileUri = createFileUri(cleanName)
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
        val notesFolder = "${Environment.DIRECTORY_DOWNLOADS}/notes"
        val fileCursor =
            reactContext.contentResolver.query(
                MediaStore.Files.getContentUri("external"),
                arrayOf(MediaStore.MediaColumns._ID),
                "${MediaStore.MediaColumns.DISPLAY_NAME} = ? AND ${MediaStore.MediaColumns.RELATIVE_PATH} = ?",
                arrayOf(fileName, "$notesFolder/"),
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
