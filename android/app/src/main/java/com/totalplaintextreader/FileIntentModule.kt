package com.totalplaintextreader

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments

import android.content.ContentResolver
import android.net.Uri
import android.provider.OpenableColumns

class FileIntentModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "FileIntentModule"
    }

    fun getFileNameFromUri(contentResolver: ContentResolver, uri: Uri): String? {
        if (uri.scheme == "content") {
            val cursor = contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                if (it.moveToFirst()) {
                    val displayNameColumnIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (displayNameColumnIndex != -1) {
                        return it.getString(displayNameColumnIndex)
                    }
                }
            }
        }
        return null
    }

    @ReactMethod
    fun getInitialIntent(promise: Promise) {
        val currentActivity = currentActivity ?: return promise.reject("NO_ACTIVITY", "Activity doesn't exist")
        val intent = currentActivity.intent
        val action = intent.action
        val type = intent.type

        if (Intent.ACTION_VIEW == action && type != null) {
            val fileUri = intent.data
            if (fileUri != null) {
                val contentResolver = reactApplicationContext.contentResolver
                val fileName = getFileNameFromUri(contentResolver, fileUri)
                val fileInputStream = contentResolver.openInputStream(fileUri)
                val fileContent = fileInputStream?.bufferedReader().use { it?.readText() } ?: "" // Leer el contenido

                val map = Arguments.createMap()
                map.putString("uri", fileUri.toString())
                map.putString("name", fileName)
                map.putString("content", fileContent)
                promise.resolve(map)
            } else {
                promise.reject("NO_URI", "No URI found in intent")
            }
        } else {
            promise.reject("NO_ACTION_VIEW", "Intent action is not ACTION_VIEW")
        }
    }
}
