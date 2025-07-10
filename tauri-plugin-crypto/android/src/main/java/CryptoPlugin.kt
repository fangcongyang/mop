package com.plugin.crypto

import android.Manifest
import android.app.Activity
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import android.webkit.WebView
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin


@InvokeArg
class AesCryptoArgs {
    var text: String? = null
    var mode: String? = null
    var key: String? = null
    var iv: String? = null
    var encode: String? = null
}

@InvokeArg
class RsaCryptoRequest {
    var data: String? = null
    var key: String? = null
}

@InvokeArg
class HashEncryptRequest {
    var data: String? = null
    var algorithm: String? = null
}

@InvokeArg
class MediaPlayRequest {
    var uri: String? = null
}

@InvokeArg
class MediaSeekRequest {
    var position: Long = 0
}

@InvokeArg
class MediaMetadataRequest {
    var title: String? = null
    var artist: String? = null
    var album: String? = null
    var duration: Long = 0
}

@TauriPlugin(
    permissions = [
        Permission(
            strings = [Manifest.permission.MEDIA_CONTENT_CONTROL],
            alias = "mediaContentControl"
        )
    ]
)
class CryptoPlugin(private val activity: Activity) : Plugin(activity) {
    private val crypto = Crypto()
    private val mediaEventHandler = MediaEventHandler()

    // 注册该通道
    private var notificationManager: NotificationManager? = null
    private var binder: MopNotificationService.Binder? = null

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            if (service is MopNotificationService.Binder) {
                binder = service
                // 设置CryptoPlugin引用到服务中
                binder?.setCryptoPlugin(this@CryptoPlugin)
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            binder = null
        }
    }

    override fun load(webView: WebView) {
        notificationManager =
            activity.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val serviceIntent = Intent(activity, MopNotificationService::class.java)
        activity.startService(serviceIntent)
        
        // 绑定服务以建立连接
        activity.bindService(serviceIntent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    @Command
    fun aes_encrypt(invoke: Invoke) {
        val args = invoke.parseArgs(AesCryptoArgs::class.java)

        val ret = JSObject()
        ret.put("value", crypto.aesEncrypt(args))
        invoke.resolve(ret)
    }

    @Command
    fun rsa_encrypt(invoke: Invoke) {
        val args = invoke.parseArgs(RsaCryptoRequest::class.java)

        val ret = JSObject()
        ret.put("value", crypto.rsaEncrypt(args))
        invoke.resolve(ret)
    }

    @Command
    fun hash_encrypt(invoke: Invoke) {
        val args = invoke.parseArgs(HashEncryptRequest::class.java)

        val ret = JSObject()
        ret.put("value", crypto.hashEncrypt(args))
        invoke.resolve(ret)
    }
    
    // 媒体播放控制命令
    @Command
    fun media_play_track(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(MediaPlayRequest::class.java)
            args.uri?.let { uri ->
                binder?.playTrack(uri)
                val ret = JSObject()
                ret.put("success", true)
                invoke.resolve(ret)
            } ?: run {
                invoke.reject("URI is required")
            }
        } catch (e: Exception) {
            invoke.reject("Failed to play track: ${e.message}")
        }
    }
    
    @Command
    fun media_play(invoke: Invoke) {
        try {
            binder?.play()
            val ret = JSObject()
            ret.put("success", true)
            invoke.resolve(ret)
        } catch (e: Exception) {
            invoke.reject("Failed to play: ${e.message}")
        }
    }
    
    @Command
    fun media_pause(invoke: Invoke) {
        try {
            binder?.pause()
            val ret = JSObject()
            ret.put("success", true)
            invoke.resolve(ret)
        } catch (e: Exception) {
            invoke.reject("Failed to pause: ${e.message}")
        }
    }
    
    @Command
    fun media_stop(invoke: Invoke) {
        try {
            binder?.stop()
            val ret = JSObject()
            ret.put("success", true)
            invoke.resolve(ret)
        } catch (e: Exception) {
            invoke.reject("Failed to stop: ${e.message}")
        }
    }
    
    @Command
    fun media_seek(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(MediaSeekRequest::class.java)
            binder?.seekTo(args.position)
            val ret = JSObject()
            ret.put("success", true)
            invoke.resolve(ret)
        } catch (e: Exception) {
            invoke.reject("Failed to seek: ${e.message}")
        }
    }
    
    @Command
    fun media_get_status(invoke: Invoke) {
        try {
            val ret = JSObject()
            ret.put("is_playing", binder?.isPlaying() ?: false)
            ret.put("current_position", binder?.getCurrentPosition() ?: 0L)
            ret.put("duration", binder?.getDuration() ?: 0L)
            invoke.resolve(ret)
        } catch (e: Exception) {
            invoke.reject("Failed to get status: ${e.message}")
        }
    }
    
    // 媒体事件处理方法
    fun triggerMediaEvent(eventName: String) {
        try {
            // 验证事件类型
            if (!mediaEventHandler.isValidEventType(eventName)) {
                android.util.Log.w("CryptoPlugin", "Invalid media event type: $eventName")
                return
            }
            
            // 创建事件数据
            val eventData = mediaEventHandler.createEventData(eventName)
            
            // 触发Tauri事件到前端
            trigger("media_control", eventData)
            
            // 记录事件
            mediaEventHandler.logMediaEvent(eventName, true)
        } catch (e: Exception) {
            android.util.Log.e("CryptoPlugin", "Failed to trigger media event: $eventName", e)
            mediaEventHandler.logMediaEvent(eventName, false)
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // 解绑服务
        try {
            activity.unbindService(serviceConnection)
        } catch (e: Exception) {
            android.util.Log.e("CryptoPlugin", "Failed to unbind service", e)
        }
    }
}
