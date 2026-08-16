package au.com.futuret3ch.mtgames

import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import kotlin.math.hypot
import kotlin.random.Random

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = FrameLayout(this)
        root.setBackgroundColor(0xFF0A0A0A.toInt())
        root.addView(TapGameView(this), FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
        setContentView(root)
    }
}

private class Orb(var x: Float, var y: Float, var r: Float, var vx: Float, var vy: Float)

class TapGameView(private val host: MainActivity) : View(host) {
    private val orbs = mutableListOf<Orb>()
    private val tick = Handler(Looper.getMainLooper())
    private val rnd = Random(System.currentTimeMillis())
    private var score = 0
    private var rockets = 0
    private var running = true
    private var w = 0f
    private var h = 0f

    private val title = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0xFF00FF99.toInt()
        textSize = 42f
        typeface = Typeface.DEFAULT_BOLD
    }
    private val body = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0xFFCDE8DC.toInt()
        textSize = 28f
    }
    private val muted = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0x99FFFFFF.toInt()
        textSize = 22f
    }
    private val orbPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF00FF99.toInt() }
    private val orbCore = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF062113.toInt() }

    private val loop = object : Runnable {
        override fun run() {
            if (!running) return
            step()
            invalidate()
            tick.postDelayed(this, 16L)
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        tick.post(loop)
    }

    override fun onDetachedFromWindow() {
        running = false
        tick.removeCallbacksAndMessages(null)
        super.onDetachedFromWindow()
    }

    override fun onSizeChanged(nw: Int, nh: Int, ow: Int, oh: Int) {
        w = nw.toFloat()
        h = nh.toFloat()
        if (orbs.isEmpty()) repeat(6) { spawn() }
    }

    private fun spawn() {
        if (w < 10 || h < 10) return
        orbs += Orb(
            x = rnd.nextFloat() * w,
            y = 140f + rnd.nextFloat() * (h - 280f),
            r = 36f + rnd.nextFloat() * 28f,
            vx = (rnd.nextFloat() - 0.5f) * 7f,
            vy = (rnd.nextFloat() - 0.5f) * 7f,
        )
    }

    private fun step() {
        for (o in orbs) {
            o.x += o.vx
            o.y += o.vy
            if (o.x < o.r || o.x > w - o.r) o.vx *= -1
            if (o.y < 120f + o.r || o.y > h - 160f) o.vy *= -1
        }
        while (orbs.size < 6) spawn()
    }

    override fun onDraw(canvas: Canvas) {
        canvas.drawColor(0xFF0A0A0A.toInt())
        canvas.drawText("MT GAMES", 40f, 70f, title)
        canvas.drawText("Android developer build 0.1", 40f, 104f, muted)
        canvas.drawText("Score  $score", 40f, 150f, body)
        canvas.drawText("Rockets  $rockets", 40f, 186f, body)
        for (o in orbs) {
            canvas.drawCircle(o.x, o.y, o.r, orbPaint)
            canvas.drawCircle(o.x, o.y, o.r * 0.45f, orbCore)
        }
        canvas.drawText("Tap orbs to score. Ecosystem client — Android first.", 40f, h - 90f, muted)
        canvas.drawText("Open site  ·  memetorrent.futuret3ch.com.au/software", 40f, h - 54f, muted)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action != MotionEvent.ACTION_DOWN) return true
        if (event.y > h - 80f) {
            host.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://memetorrent.futuret3ch.com.au/software/games")))
            return true
        }
        val hit = orbs.indexOfLast { hypot(event.x - it.x, event.y - it.y) <= it.r }
        if (hit >= 0) {
            orbs.removeAt(hit)
            score += 10
            if (score % 50 == 0) rockets += 1
            spawn()
            invalidate()
        }
        return true
    }
}
