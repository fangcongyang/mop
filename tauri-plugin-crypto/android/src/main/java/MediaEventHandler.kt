package com.plugin.crypto

import android.util.Log
import app.tauri.plugin.JSObject

/**
 * 媒体事件处理器
 * 用于处理来自Android媒体控制的事件并与Rust后端通信
 */
class MediaEventHandler {
    companion object {
        private const val TAG = "MediaEventHandler"
        
        // 媒体事件类型
        const val EVENT_PLAY = "media_play"
        const val EVENT_PAUSE = "media_pause"
        const val EVENT_NEXT = "media_next"
        const val EVENT_PREVIOUS = "media_previous"
        const val EVENT_STOP = "media_stop"
        const val EVENT_SEEK = "media_seek"
    }
    
    /**
     * 创建媒体事件数据
     */
    fun createEventData(eventType: String, extraData: Map<String, Any>? = null): JSObject {
        val data = JSObject()
        data.put("event_type", eventType)
        data.put("timestamp", System.currentTimeMillis())
        data.put("source", "android_media_session")
        
        extraData?.forEach { (key, value) ->
            data.put(key, value)
        }
        
        Log.d(TAG, "Created event data for: $eventType")
        return data
    }
    
    /**
     * 验证事件类型是否有效
     */
    fun isValidEventType(eventType: String): Boolean {
        return when (eventType) {
            EVENT_PLAY, EVENT_PAUSE, EVENT_NEXT, 
            EVENT_PREVIOUS, EVENT_STOP, EVENT_SEEK -> true
            else -> false
        }
    }
    
    /**
     * 记录媒体事件
     */
    fun logMediaEvent(eventType: String, success: Boolean = true) {
        val status = if (success) "SUCCESS" else "FAILED"
        Log.i(TAG, "Media event [$eventType] - Status: $status")
    }
}