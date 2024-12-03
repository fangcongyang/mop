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
//    private var mopNotificationManager: MopNotificationManager? = null

    // 注册该通道
    private var notificationManager: NotificationManager? = null
    private var binder: MopNotificationService.Binder? = null

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            if (service is MopNotificationService.Binder) {
                binder = service
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            binder = null
        }
    }

    override fun load(webView: WebView) {
        notificationManager =
            activity.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
//        mopNotificationManager!!.updateNotification()
        val serviceIntent = Intent(activity, MopNotificationService::class.java)
        activity.startService(serviceIntent)
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
}
