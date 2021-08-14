package com.example.datetime

import android.content.Intent
import android.content.pm.LauncherApps
import android.net.Uri
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import java.util.Date

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        clock()

        val mapbutton = findViewById<Button>(R.id.button)

    }
    fun googleMap(view: View){
        val uri = Uri.parse("geo:0,0?q=")
        val mapIntent = Intent(Intent.ACTION_VIEW, uri).setPackage("com.google.android.apps.maps")
        startActivity(mapIntent)

    }

    fun openChrome(view: View){
        val packageNames = "com.android.chrome"
        var uri = Uri.parse("https://www.google.com/")
        val search = Intent(Intent.ACTION_VIEW, uri).setPackage(packageNames)
        if (search == null) {
            uri = Uri.parse("https://play.google.com/store/apps/details?id=$packageNames")
            val search = Intent(Intent.ACTION_VIEW, uri).setPackage(packageNames)
        }
        startActivity(search)
    }

    public fun clock(){
        val thread: Thread = object : Thread() {
            override fun run() {
                val homet = findViewById<TextView>(R.id.homeTimer)
                try {
                    while (!this.isInterrupted) {
                        sleep(1000)
                        runOnUiThread {
                            homet.text = java.text.DateFormat.getTimeInstance().format(Date())
                        }
                    }
                } catch (e: InterruptedException) {
                }
            }
        }
        thread.start()
    }
}