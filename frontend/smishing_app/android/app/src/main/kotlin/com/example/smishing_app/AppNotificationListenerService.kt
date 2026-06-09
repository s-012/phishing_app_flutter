package com.example.smishing_app

import android.app.Notification
import android.os.Build
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.concurrent.Executors

class AppNotificationListenerService : NotificationListenerService() {
    private val worker = Executors.newSingleThreadExecutor()

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "Listener connected")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d(TAG, "Listener disconnected")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return

        val extras: Bundle = sbn.notification.extras ?: Bundle.EMPTY
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
        val messageText = collectNotificationText(extras)

        if (messageText.isEmpty()) return

        val urls = extractUrls(messageText)
        if (urls.isEmpty()) {
            Log.d(TAG, "No URL pkg=${sbn.packageName} title=$title")
            return
        }

        Log.d(TAG, "URL detected pkg=${sbn.packageName} title=$title urls=$urls")

        urls.forEach { url ->
            worker.execute {
                sendToNas(
                    url = url,
                    sourceApp = sbn.packageName ?: "unknown",
                    messageText = messageText.take(MAX_MESSAGE_LENGTH),
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        worker.shutdownNow()
    }

    private fun collectNotificationText(extras: Bundle): String {
        val chunks = mutableListOf<String>()

        fun add(raw: CharSequence?) {
            val text = raw?.toString()?.trim().orEmpty()
            if (text.isNotEmpty()) chunks.add(text)
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
            val parcelables = extras.getParcelableArray(Notification.EXTRA_MESSAGES)
            if (!parcelables.isNullOrEmpty()) {
                val messages = Notification.MessagingStyle.Message.getMessagesFromBundleArray(parcelables)
                messages.forEach { add(it.text) }
            }
        }

        return chunks.joinToString(separator = "\n").trim()
    }

    private fun extractUrls(content: String): List<String> {
        return URL_REGEX.findAll(content)
            .map { normalizeDetectedUrl(it.value) }
            .filter { it.isNotBlank() }
            .distinct()
            .toList()
    }

    private fun normalizeDetectedUrl(value: String): String {
        val trimmed = value.trim().trimEnd('.', ',', ';', ':', ')', ']', '}', '>', '!', '?')
        return if (trimmed.startsWith("www.", ignoreCase = true)) {
            "https://$trimmed"
        } else {
            trimmed
        }
    }

    private fun sendToNas(url: String, sourceApp: String, messageText: String) {
        var connection: HttpURLConnection? = null
        try {
            Log.d(TAG, "Sending to NAS url=$url sourceApp=$sourceApp")
            connection = (URL(NAS_URL_CHECK_API).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10_000
                readTimeout = 10_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                setRequestProperty("Accept", "application/json")
            }

            val payload = JSONObject()
                .put("url", url)
                .put("sourceApp", sourceApp)
                .put("messageText", messageText)
                .toString()

            OutputStreamWriter(connection.outputStream, StandardCharsets.UTF_8).use { writer ->
                writer.write(payload)
            }

            val status = connection.responseCode
            val body = readResponseBody(connection, status)
            Log.d(TAG, "NAS check success status=$status url=$url body=$body")
        } catch (e: Exception) {
            Log.e(TAG, "NAS check failed url=$url error=${e.message}", e)
        } finally {
            connection?.disconnect()
        }
    }

    private fun readResponseBody(connection: HttpURLConnection, status: Int): String {
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream
        if (stream == null) return ""
        return stream.bufferedReader().use(BufferedReader::readText)
    }

    companion object {
        private const val TAG = "AppNotifListener"
        private const val NAS_URL_CHECK_API = "https://api.maknae.synology.me/api/url/check"
        private const val MAX_MESSAGE_LENGTH = 4000
        private val URL_REGEX = Regex("""(?:https?://|www\.)[^\s<>"']+""", RegexOption.IGNORE_CASE)
    }
}
