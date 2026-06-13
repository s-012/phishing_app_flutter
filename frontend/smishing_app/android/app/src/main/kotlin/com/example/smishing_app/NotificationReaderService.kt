package com.example.smishing_app

import android.app.Notification
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.text.TextUtils
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.util.Log
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.Locale
import java.util.concurrent.Executors
import kotlin.math.roundToInt

class NotificationReaderService : NotificationListenerService() {
    private val worker = Executors.newSingleThreadExecutor()
    private val recentScanCache = mutableMapOf<String, Long>()
    private val mainHandler = Handler(Looper.getMainLooper())
    private var overlayView: View? = null

    override fun onCreate() {
        super.onCreate()
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "listener connected")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d(TAG, "listener disconnected")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return
        Log.d(TAG, "received packageName=${sbn.packageName}")
        if (shouldSkipNotification(sbn)) return

        val extras = sbn.notification.extras ?: Bundle.EMPTY
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
        val content = collectNotificationContent(extras).take(MAX_CONTENT_LENGTH)

        if (content.length < MIN_CONTENT_LENGTH) {
            Log.d(TAG, "skipped packageName=${sbn.packageName}, reason=short_content")
            return
        }
        if (isDuplicateScan(sbn.packageName, content)) {
            Log.d(TAG, "skipped packageName=${sbn.packageName}, reason=duplicate")
            return
        }

        Log.d(TAG, "scanning packageName=${sbn.packageName}, title=$title, content=$content")

        worker.execute {
            sendToBackend(
                content = content,
                sender = sbn.packageName.ifBlank { title.ifBlank { "notification" } },
            )
        }
    }

    override fun onDestroy() {
        mainHandler.post { removeOverlayWarning() }
        worker.shutdownNow()
        super.onDestroy()
    }

    private fun shouldSkipNotification(sbn: StatusBarNotification): Boolean {
        val sourcePackage = sbn.packageName
        if (sourcePackage == packageName) {
            Log.d(TAG, "skipped packageName=$sourcePackage, reason=self")
            return true
        }
        if (sourcePackage !in ALLOWED_PACKAGES) {
            Log.d(TAG, "skipped packageName=$sourcePackage, reason=not_allowed")
            return true
        }

        val notification = sbn.notification
        if ((notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0) {
            Log.d(TAG, "skipped packageName=$sourcePackage, reason=group_summary")
            return true
        }

        val isSystemCategory = notification.category == Notification.CATEGORY_SYSTEM ||
            notification.category == Notification.CATEGORY_SERVICE ||
            notification.category == Notification.CATEGORY_STATUS

        if (isSystemCategory && sourcePackage != ADB_TEST_PACKAGE) {
            Log.d(TAG, "skipped packageName=$sourcePackage, reason=system_category")
            return true
        }
        return false
    }

    private fun collectNotificationContent(extras: Bundle): String {
        val chunks = mutableListOf<String>()

        fun add(raw: CharSequence?) {
            val text = raw?.toString()?.trim().orEmpty()
            if (text.isNotEmpty() && !chunks.contains(text)) {
                chunks.add(text)
            }
        }

        add(extras.getCharSequence(Notification.EXTRA_TITLE))
        add(extras.getCharSequence(Notification.EXTRA_TEXT))
        add(extras.getCharSequence(Notification.EXTRA_BIG_TEXT))
        add(extras.getCharSequence(Notification.EXTRA_SUB_TEXT))
        add(extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT))
        add(extras.getCharSequence(Notification.EXTRA_INFO_TEXT))

        extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
            ?.forEach { add(it) }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            @Suppress("DEPRECATION")
            val rawMessages = extras.getParcelableArray(Notification.EXTRA_MESSAGES)
            if (!rawMessages.isNullOrEmpty()) {
                val messages =
                    Notification.MessagingStyle.Message.getMessagesFromBundleArray(rawMessages)
                messages.forEach { add(it.text) }
            }
        }

        return chunks.joinToString(separator = "\n").trim()
    }

    private fun isDuplicateScan(packageName: String, content: String): Boolean {
        val now = System.currentTimeMillis()
        recentScanCache.entries.removeAll { now - it.value > DUPLICATE_WINDOW_MS }

        val key = "$packageName|$content"
        val lastScannedAt = recentScanCache[key]
        if (lastScannedAt != null && now - lastScannedAt <= DUPLICATE_WINDOW_MS) {
            return true
        }

        recentScanCache[key] = now
        return false
    }

    private fun sendToBackend(content: String, sender: String) {
        var connection: HttpURLConnection? = null

        try {
            connection = (URL(SCAN_TEXT_URL).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10_000
                readTimeout = 10_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                setRequestProperty("Accept", "application/json")
            }

            val payload = JSONObject()
                .put("device_id", DEVICE_ID)
                .put("content", content)
                .put("source_app", "notification")
                .put("sender", sender)
                .toString()

            OutputStreamWriter(connection.outputStream, StandardCharsets.UTF_8).use { writer ->
                writer.write(payload)
            }

            val status = connection.responseCode
            val body = readResponseBody(connection, status)
            if (status !in 200..299) {
                Log.w(TAG, "scan failed status=$status body=$body")
                return
            }

            val response = JSONObject(body)
            val grade = response
                .optString("final_risk_grade", "")
                .uppercase(Locale.US)
            val score = readRiskScore(response)

            Log.d(TAG, "scan result grade=$grade score=$score")

            if (shouldShowRiskAlert(grade, score)) {
                showRiskWarning(grade, score, content)
            }
        } catch (e: Exception) {
            Log.e(TAG, "scan request failed: ${e.message}", e)
        } finally {
            connection?.disconnect()
        }
    }

    private fun readResponseBody(connection: HttpURLConnection, status: Int): String {
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream
        if (stream == null) return ""
        return stream.bufferedReader().use(BufferedReader::readText)
    }

    private fun readRiskScore(response: JSONObject): Int {
        val raw = response.opt("final_risk_score") ?: return 0
        return when (raw) {
            is Number -> raw.toDouble().roundToInt()
            is String -> raw.toDoubleOrNull()?.roundToInt() ?: 0
            else -> 0
        }
    }

    private fun shouldShowRiskAlert(grade: String, score: Int): Boolean {
        return when (grade) {
            "MALICIOUS", "DANGER" -> true
            "SUSPICIOUS" -> score >= MIN_ALERT_SCORE
            else -> false
        }
    }

    private fun showRiskWarning(grade: String, score: Int, content: String) {
        mainHandler.post {
            if (canShowOverlay()) {
                showOverlayWarning(score, content)
            } else {
                showRiskWarningDialog(grade, score, content)
            }
        }
    }

    private fun canShowOverlay(): Boolean {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)
    }

    private fun showOverlayWarning(score: Int, content: String) {
        try {
            removeOverlayWarning()

            val view = createOverlayView(score, content)
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                overlayWindowType(),
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                android.graphics.PixelFormat.TRANSLUCENT,
            ).apply {
                gravity = Gravity.CENTER
            }

            windowManager.addView(view, params)
            overlayView = view
            mainHandler.postDelayed({ removeOverlayWarning() }, OVERLAY_AUTO_CLOSE_MS)
            Log.d(TAG, "overlay warning shown")
        } catch (e: Exception) {
            Log.e(TAG, "failed to show overlay warning", e)
        }
    }

    private fun createOverlayView(score: Int, content: String): View {
        return LinearLayout(this).apply {
            gravity = Gravity.CENTER
            setPadding(dp(22), dp(22), dp(22), dp(22))
            setBackgroundColor(Color.argb(110, 0, 0, 0))

            addView(
                LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dp(22), dp(20), dp(22), dp(18))
                    background = GradientDrawable().apply {
                        setColor(Color.WHITE)
                        cornerRadius = dp(20).toFloat()
                    }

                    addView(
                        TextView(context).apply {
                            text = "스미싱 의심 알림"
                            setTextColor(Color.rgb(198, 40, 40))
                            textSize = 22f
                            typeface = Typeface.DEFAULT_BOLD
                        },
                    )
                    addView(
                        TextView(context).apply {
                            text = "위험도 ${score}점"
                            setTextColor(Color.rgb(33, 33, 33))
                            textSize = 18f
                            typeface = Typeface.DEFAULT_BOLD
                            setPadding(0, dp(12), 0, 0)
                        },
                    )
                    addView(
                        TextView(context).apply {
                            text = "이 알림은 스미싱 위험이 있습니다. 링크를 열지 마세요."
                            setTextColor(Color.rgb(66, 66, 66))
                            textSize = 15f
                            setPadding(0, dp(10), 0, 0)
                        },
                    )
                    addView(
                        TextView(context).apply {
                            text = content
                            setTextColor(Color.rgb(97, 97, 97))
                            textSize = 14f
                            maxLines = 3
                            ellipsize = TextUtils.TruncateAt.END
                            setPadding(0, dp(12), 0, 0)
                        },
                    )
                    addView(
                        Button(context).apply {
                            text = "닫기"
                            setOnClickListener { removeOverlayWarning() }
                        },
                    )
                },
                LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                ).apply {
                    leftMargin = dp(14)
                    rightMargin = dp(14)
                },
            )
        }
    }

    private fun removeOverlayWarning() {
        val view = overlayView ?: return
        try {
            windowManager.removeView(view)
        } catch (_: Exception) {
        } finally {
            overlayView = null
        }
    }

    private fun overlayWindowType(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }
    }

    private val windowManager: WindowManager
        get() = getSystemService(Context.WINDOW_SERVICE) as WindowManager

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }

    private fun showRiskWarningDialog(grade: String, score: Int, content: String) {
        val intent = Intent(this, RiskWarningActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(RiskWarningActivity.EXTRA_GRADE, grade)
            putExtra(RiskWarningActivity.EXTRA_SCORE, score)
            putExtra(RiskWarningActivity.EXTRA_CONTENT, content)
        }
        startActivity(intent)
        Log.d(TAG, "risk warning dialog shown")
    }

    companion object {
        private const val TAG = "NotificationReader"
        private const val DEVICE_ID = "android-notification-listener"
        private const val SCAN_TEXT_URL = "https://api.maknae.synology.me/api/scans/text"
        private const val MAX_CONTENT_LENGTH = 4000
        private const val MIN_CONTENT_LENGTH = 8
        private const val MIN_ALERT_SCORE = 65
        private const val DUPLICATE_WINDOW_MS = 60_000L
        private const val OVERLAY_AUTO_CLOSE_MS = 15_000L
        private const val ADB_TEST_PACKAGE = "com.android.shell"

        private val ALLOWED_PACKAGES = setOf(
            "com.samsung.android.messaging",
            "com.google.android.apps.messaging",
            "com.kakao.talk",
            "com.ktcs.whowho",
            ADB_TEST_PACKAGE, // 테스트용
        )
    }
}
