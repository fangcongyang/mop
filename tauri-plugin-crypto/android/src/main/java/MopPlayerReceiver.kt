package com.plugin.crypto

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class MopPlayerReceiver : BroadcastReceiver() {
    companion object {
        const val ACTION_PLAY = "com.plugin.crypto.PLAY"
        const val ACTION_PAUSE = "com.plugin.crypto.PAUSE"
        const val ACTION_NEXT = "com.plugin.crypto.NEXT"
        const val ACTION_PREVIOUS = "com.plugin.crypto.PREVIOUS"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("MopPlayerReceiver", "Received action: ${intent.action}")
        
        when (intent.action) {
            ACTION_PLAY -> {
                // 处理播放事件
                handleMediaAction(context, "media_play")
            }
            ACTION_PAUSE -> {
                // 处理暂停事件
                handleMediaAction(context, "media_pause")
            }
            ACTION_NEXT -> {
                // 处理下一首事件
                handleMediaAction(context, "media_next")
            }
            ACTION_PREVIOUS -> {
                // 处理上一首事件
                handleMediaAction(context, "media_previous")
            }
        }
    }
    
    private fun handleMediaAction(context: Context, action: String) {
        try {
            // 通过Intent启动服务并传递媒体控制事件
            val serviceIntent = Intent(context, MopNotificationService::class.java)
            serviceIntent.putExtra("media_action", action)
            context.startService(serviceIntent)
        } catch (e: Exception) {
            Log.e("MopPlayerReceiver", "Failed to handle media action: $action", e)
        }
    }
}