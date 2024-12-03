package com.plugin.crypto

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Build.VERSION.SDK_INT
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class MopNotificationManager(
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

    fun notification(notification: Notification) {
        val notificationManager = NotificationManagerCompat.from(context)
        notificationManager?.notify(1, notification)
    }

    fun updateNotification() {
        var notification: Notification?
        val actionIntent = Intent(context, MopPlayerReceiver::class.java)
        actionIntent.setAction("PLAY")
        val actionPlayIntent =
            PendingIntent.getBroadcast(
                context, 0, actionIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        val builder: NotificationCompat.Builder =
            NotificationCompat.Builder(context, "mop_channel")
                .setSmallIcon(R.drawable.add)
                .setContentText("Artist Name")
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
//                .setStyle(
//                    androidx.media.app.NotificationCompat.MediaStyle()
//                        .setMediaSession(mediaSession?.sessionToken)
//                        .setShowActionsInCompactView(0, 1, 2)
//                )
//            .addAction(
//                NotificationCompat.Action(
//                    R.drawable.ic_previous,
//                    "Previous",
//                    prevPendingIntent
//                )
//            )
                .addAction(NotificationCompat.Action(R.drawable.play, "", actionPlayIntent))
//            .addAction(NotificationCompat.Action(R.drawable.ic_next, "Next", nextPendingIntent))
        notification = builder.build()
//        }

        val notificationManager = NotificationManagerCompat.from(context)
        notificationManager?.notify(1, notification)
    }
}