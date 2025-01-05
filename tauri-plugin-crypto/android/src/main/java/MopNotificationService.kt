package com.plugin.crypto

import android.R
import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.support.v4.media.session.MediaControllerCompat
import android.support.v4.media.session.MediaSessionCompat
import androidx.core.app.NotificationCompat
import android.os.Binder as AndroidBinder


class MopNotificationService: Service() {
    private var mediaSession: MediaSessionCompat? = null
    private var mediaController: MediaControllerCompat? = null
    private var mopNotificationManager: MopNotificationManager? = null

    // 创建一个 Binder 对象
    val binder = Binder()

    inner class Binder : AndroidBinder() {
        fun getService(): MopNotificationService = this@MopNotificationService
    }

    override fun onBind(intent: Intent?): IBinder {
        mopNotificationManager = MopNotificationManager(this)
        mopNotificationManager?.createNotificationChannel()
        mediaSession = MediaSessionCompat(this, "mopMediaSession")
        mediaController = mediaSession?.controller
        // 设置媒体会话为活动状态
        mediaSession?.isActive = true
        // 设置媒体会话回调，监听媒体控制
        mediaSession?.setCallback(object : MediaSessionCompat.Callback() {
            override fun onPlay() {
//                trigger("onPlay", JSObject())
                mediaController?.transportControls?.play()
            }

            override fun onPause() {
//                trigger("onPause", JSObject())
                mediaController?.transportControls?.pause()
            }

            override fun onSkipToNext() {
//                trigger("onSkipToNext", JSObject())
                mediaController?.transportControls?.skipToNext()
            }

            override fun onSkipToPrevious() {
//                trigger("onSkipToPrevious", JSObject())
                mediaController?.transportControls?.skipToPrevious()
            }
        })
        updateNotification()
        return binder
    }

    override fun onDestroy() {
        super.onDestroy()
        stopForeground(true) // 停止前台服务并移除通知
    }

//   fun notification(): Notification? {
//       val prevIntent = Intent(this, YourActivity::class.java)
//       prevIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
//       val pendingIntent =
//           PendingIntent.getActivity(this, 0, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT)
//
//       val action: Notification.Action = Notification.Action.Builder(
//           R.drawable.play_skip_back,  // 图标
//           "Skip back",  // 文本
//           pendingIntent // 意图
//       ).build()
//
//        val builder = if (isAtLeastAndroid8) {
//            Notification.Builder(applicationContext, NotificationChannelId)
//        } else {
//            Notification.Builder(applicationContext)
//        }
//            .setContentTitle("Playing")
//            .setContentText("Artist Name")
////            .setSubText(player.playerError?.message)
////            .setLargeIcon(bitmapProvider.bitmap)
//            .setAutoCancel(false)
//            .setOnlyAlertOnce(true)
//            .setShowWhen(false)
//            .setSmallIcon(R.drawable.add)
////            .setSmallIcon(player.playerError?.let { R.drawable.alert_circle }
////                ?: R.drawable.app_icon)
//            .setOngoing(false)
////            .setContentIntent(activityPendingIntent<MainActivity>(
////                flags = PendingIntent.FLAG_UPDATE_CURRENT
////            ) {
////                putExtra("expandPlayerBottomSheet", true)
////            })
////            .setDeleteIntent(broadCastPendingIntent<NotificationDismissReceiver>())
//            .setVisibility(Notification.VISIBILITY_PUBLIC)
//            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
//            .setStyle(
//                Notification.MediaStyle()
//                    .setShowActionsInCompactView(0, 1, 2)
//                    .setMediaSession(mediaSession?.sessionToken)
//            )
//            .addAction(R.drawable.play_skip_back, "Skip back", prevIntent)
//            .addAction(
//                if (player.shouldBePlaying) R.drawable.pause else R.drawable.play,
//                if (player.shouldBePlaying) "Pause" else "Play",
//                if (player.shouldBePlaying) pauseIntent else playIntent
//            )
//            .addAction(R.drawable.play_skip_forward, "Skip forward", nextIntent)
//
////        bitmapProvider.load(mediaMetadata.artworkUri) { bitmap ->
////            maybeShowSongCoverInLockScreen()
////            notificationManager?.notify(NotificationId, builder.setLargeIcon(bitmap).build())
////        }
//
//        return builder.build()
//    }


    fun updateNotification() {
        var notification: Notification?
        val actionIntent = Intent(this, MopPlayerReceiver::class.java)
        actionIntent.setAction("PLAY")
        val actionPlayIntent =
            PendingIntent.getBroadcast(
                this, 0, actionIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        val builder: NotificationCompat.Builder =
            NotificationCompat.Builder(this, NotificationChannelId)
                .setSmallIcon(R.drawable.ic_input_add)
                .setContentTitle("Playing")
                .setContentText("Artist Name")
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setStyle(
                    androidx.media.app.NotificationCompat.MediaStyle()
                        .setMediaSession(mediaSession?.sessionToken)
                )
//            .addAction(
//                NotificationCompat.Action(
//                    R.drawable.ic_previous,
//                    "Previous",
//                    prevPendingIntent
//                )
//            )
                .addAction(NotificationCompat.Action(R.drawable.ic_media_play, "", actionPlayIntent))
//            .addAction(NotificationCompat.Action(R.drawable.ic_next, "Next", nextPendingIntent))
        notification = builder.build()
//        }

        startForeground(1, notification)
    }

    private companion object {
        const val NotificationId = 1001
        const val NotificationChannelId = "mop_channel_id"

        const val SleepTimerNotificationId = 1002
        const val SleepTimerNotificationChannelId = "sleep_timer_channel_id"
    }
}