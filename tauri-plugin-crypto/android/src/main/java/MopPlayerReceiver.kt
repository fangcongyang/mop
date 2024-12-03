package com.plugin.crypto

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import app.tauri.plugin.JSObject

class MopPlayerReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if ("PLAY" == intent.action) {
//            trigger("onPlay", JSObject())
        }
    }
}