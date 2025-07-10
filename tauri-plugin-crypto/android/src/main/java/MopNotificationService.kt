package com.plugin.crypto

import android.R
import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.media.MediaPlayer
import android.media.AudioManager
import android.media.AudioAttributes
import android.net.Uri
import androidx.media.session.MediaButtonReceiver
import androidx.media.session.MediaSessionCompat
import androidx.media.MediaSessionManager
import androidx.core.app.NotificationCompat
import androidx.media.session.PlaybackStateCompat
import androidx.media.MediaMetadataCompat
import android.os.Handler
import android.os.Looper
import android.os.Binder as AndroidBinder


class MopNotificationService: Service() {
    private var mediaSession: MediaSessionCompat? = null
    private var mopNotificationManager: MopNotificationManager? = null
    private var cryptoPlugin: CryptoPlugin? = null
    
    // MediaPlayer相关
    private var mediaPlayer: MediaPlayer? = null
    private var isPlaying = false
    private var currentTrackUri: Uri? = null
    private var currentPosition = 0L
    private var duration = 0L
    
    // 进度更新处理器
    private val handler = Handler(Looper.getMainLooper())
    private val progressUpdateRunnable = object : Runnable {
        override fun run() {
            updateProgress()
            if (isPlaying) {
                handler.postDelayed(this, 1000) // 每秒更新一次
            }
        }
    }

    // 创建一个 Binder 对象
    val binder = Binder()

    inner class Binder : AndroidBinder() {
        fun getService(): MopNotificationService = this@MopNotificationService
        
        fun setCryptoPlugin(plugin: CryptoPlugin) {
            this@MopNotificationService.cryptoPlugin = plugin
        }
        
        // 音频播放控制方法
        fun playTrack(uri: String) {
            this@MopNotificationService.playTrack(Uri.parse(uri))
        }
        
        fun play() {
            this@MopNotificationService.play()
        }
        
        fun pause() {
            this@MopNotificationService.pause()
        }
        
        fun stop() {
            this@MopNotificationService.stop()
        }
        
        fun seekTo(position: Long) {
            this@MopNotificationService.seekTo(position)
        }
        
        fun isPlaying(): Boolean {
            return this@MopNotificationService.isPlaying
        }
        
        fun getCurrentPosition(): Long {
            return this@MopNotificationService.getCurrentPosition()
        }
        
        fun getDuration(): Long {
            return this@MopNotificationService.getDuration()
        }
    }
    
    // 触发Rust事件的方法
    private fun triggerRustEvent(eventName: String) {
        try {
            cryptoPlugin?.triggerMediaEvent(eventName)
        } catch (e: Exception) {
            android.util.Log.e("MopNotificationService", "Failed to trigger Rust event: $eventName", e)
        }
    }

    override fun onBind(intent: Intent?): IBinder {
        mopNotificationManager = MopNotificationManager(this)
        mopNotificationManager?.createNotificationChannel()
        mediaSession = MediaSessionCompat(this, "mopMediaSession")
        mediaSession?.setCallback(object : MediaSessionCompat.Callback() {
            override fun onPlay() {
                // 执行真正的播放操作
                play()
                // 同时触发Rust事件
                triggerRustEvent("media_play")
            }

            override fun onPause() {
                // 执行真正的暂停操作
                pause()
                // 同时触发Rust事件
                triggerRustEvent("media_pause")
            }

            override fun onSkipToNext() {
                // 触发下一首事件（由Rust端处理音频切换）
                triggerRustEvent("media_next")
            }

            override fun onSkipToPrevious() {
                // 触发上一首事件（由Rust端处理音频切换）
                triggerRustEvent("media_previous")
            }
            
            override fun onSeekTo(pos: Long) {
                // 执行真正的跳转操作
                seekTo(pos)
                triggerRustEvent("media_seek")
            }
            
            override fun onStop() {
                // 执行真正的停止操作
                stop()
                triggerRustEvent("media_stop")
            }
        })
        mediaSession?.isActive = true
        updateNotification()
        return binder
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 处理来自广播接收器的媒体事件
        intent?.getStringExtra("media_action")?.let { action ->
            triggerRustEvent(action)
        }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        releaseMediaPlayer()
        handler.removeCallbacks(progressUpdateRunnable)
        mediaSession?.release()
        stopForeground(true) // 停止前台服务并移除通知
    }
    
    // MediaPlayer控制方法
    private fun initializeMediaPlayer() {
        if (mediaPlayer == null) {
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                
                setOnPreparedListener { mp ->
                    duration = mp.duration.toLong()
                    updateMediaSessionMetadata()
                    updatePlaybackState()
                }
                
                setOnCompletionListener {
                    isPlaying = false
                    handler.removeCallbacks(progressUpdateRunnable)
                    updatePlaybackState()
                    triggerRustEvent("media_completed")
                }
                
                setOnErrorListener { _, what, extra ->
                    android.util.Log.e("MopNotificationService", "MediaPlayer error: what=$what, extra=$extra")
                    triggerRustEvent("media_error")
                    true
                }
            }
        }
    }
    
    private fun releaseMediaPlayer() {
        mediaPlayer?.apply {
            if (isPlaying()) {
                stop()
            }
            release()
        }
        mediaPlayer = null
        isPlaying = false
    }
    
    fun playTrack(uri: Uri) {
        try {
            currentTrackUri = uri
            initializeMediaPlayer()
            
            mediaPlayer?.apply {
                reset()
                setDataSource(this@MopNotificationService, uri)
                prepareAsync()
            }
        } catch (e: Exception) {
            android.util.Log.e("MopNotificationService", "Failed to play track: $uri", e)
            triggerRustEvent("media_error")
        }
    }
    
    fun play() {
        try {
            mediaPlayer?.let { mp ->
                if (!mp.isPlaying) {
                    mp.start()
                    isPlaying = true
                    handler.post(progressUpdateRunnable)
                    updatePlaybackState()
                    updateNotification()
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("MopNotificationService", "Failed to play", e)
        }
    }
    
    fun pause() {
        try {
            mediaPlayer?.let { mp ->
                if (mp.isPlaying) {
                    mp.pause()
                    isPlaying = false
                    handler.removeCallbacks(progressUpdateRunnable)
                    updatePlaybackState()
                    updateNotification()
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("MopNotificationService", "Failed to pause", e)
        }
    }
    
    fun stop() {
        try {
            mediaPlayer?.let { mp ->
                if (mp.isPlaying) {
                    mp.stop()
                }
                isPlaying = false
                currentPosition = 0L
                handler.removeCallbacks(progressUpdateRunnable)
                updatePlaybackState()
                updateNotification()
            }
        } catch (e: Exception) {
            android.util.Log.e("MopNotificationService", "Failed to stop", e)
        }
    }
    
    fun seekTo(position: Long) {
        try {
            mediaPlayer?.let { mp ->
                mp.seekTo(position.toInt())
                currentPosition = position
                updatePlaybackState()
            }
        } catch (e: Exception) {
            android.util.Log.e("MopNotificationService", "Failed to seek", e)
        }
    }
    
    fun getCurrentPosition(): Long {
        return try {
            mediaPlayer?.currentPosition?.toLong() ?: currentPosition
        } catch (e: Exception) {
            currentPosition
        }
    }
    
    fun getDuration(): Long {
        return try {
            mediaPlayer?.duration?.toLong() ?: duration
        } catch (e: Exception) {
            duration
        }
    }
    
    private fun updateProgress() {
        currentPosition = getCurrentPosition()
        updatePlaybackState()
    }
    
    private fun updatePlaybackState() {
        val state = if (isPlaying) {
            PlaybackStateCompat.STATE_PLAYING
        } else {
            PlaybackStateCompat.STATE_PAUSED
        }
        
        val playbackState = PlaybackStateCompat.Builder()
            .setState(state, currentPosition, 1.0f)
            .setActions(
                PlaybackStateCompat.ACTION_PLAY or
                PlaybackStateCompat.ACTION_PAUSE or
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                PlaybackStateCompat.ACTION_SEEK_TO or
                PlaybackStateCompat.ACTION_STOP
            )
            .build()
            
        mediaSession?.setPlaybackState(playbackState)
    }
    
    private fun updateMediaSessionMetadata() {
        val metadata = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, "Current Track")
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, "Artist Name")
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration)
            .build()
            
        mediaSession?.setMetadata(metadata)
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