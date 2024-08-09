package com.totalplaintextreader

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments

import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter

import android.content.ContentResolver
import android.net.Uri
import android.provider.OpenableColumns

import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.modules.core.DeviceEventManagerModule

class FileIntentModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private var eventCount = 0

    override fun getName(): String {
        return "FileIntentModule"
    }

    init {
        reactContext.addLifecycleEventListener(this)
    }

    private fun sendEvent(reactContext: ReactApplicationContext, eventName: String, params: WritableMap) {
        reactContext.getJSModule(RCTDeviceEventEmitter::class.java).emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Mantener un conteo de suscriptores puede ser útil para lógica condicional basada en la cantidad de listeners
        eventCount++
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Ajustar tu lógica de conteo basada en cuántos listeners se están eliminando
        eventCount -= count
    }

    override fun onHostResume() {
        val intent = currentActivity?.intent
        if (Intent.ACTION_VIEW == intent?.action) {
            handleSendIntent(intent)
        }
    }

    override fun onHostPause() {}

    override fun onHostDestroy() {}

    private fun handleSendIntent(intent: Intent) {
        val fileUri = intent.data
        if (fileUri != null) {
            val contentResolver = reactApplicationContext.contentResolver
            val fileName = getFileNameFromUri(contentResolver, fileUri)
            val fileInputStream = contentResolver.openInputStream(fileUri)
            val fileContent = fileInputStream?.bufferedReader().use { it?.readText() } ?: ""
            
            val map = Arguments.createMap()
            map.putString("uri", fileUri.toString())
            map.putString("name", fileName)
            map.putString("content", fileContent)

            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onFileIntentReceived", map)
        }
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
                //map.putString("uri", fileUri.toString())
                map.putString("name", fileName)
                map.putString("content", fileContent)
                promise.resolve(map)
            } else {
                promise.reject("NO_URI", "No URI found in intent")
            }
        } else {
            // Manejar otros tipos de Intents o resolver la promesa sin acción
            val map = Arguments.createMap()
            map.putString("uri", "")
            map.putString("name", "")
            map.putString("content", "")
            promise.resolve(map)
        }
    }
}
