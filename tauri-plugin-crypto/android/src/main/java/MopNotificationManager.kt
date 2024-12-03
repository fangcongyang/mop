package com.plugin.crypto

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.Build.VERSION.SDK_INT

class MusicNotificationManager(
    private val context: Context,
) {
    fun createNotificationChannel() {
        if (SDK_INT >= Build.VERSION_CODES.O) {
            val name: CharSequence = "mop_name"
            val description = "Mop Channel description"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel("mop_channel", name, importance)
            channel.description = description
            val notificationManager = context.getSystemService(
                NotificationManager::class.java
            )
            notificationManager.createNotificationChannel(channel)
        }
    }
}