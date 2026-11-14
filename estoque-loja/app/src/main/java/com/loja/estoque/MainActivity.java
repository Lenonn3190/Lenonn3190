package com.loja.estoque;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(0xFFAD1457);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(this), "Android");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    static class Bridge {
        private final Activity act;
        private final SharedPreferences prefs;

        Bridge(Activity a) {
            act = a;
            prefs = a.getSharedPreferences("estoque", Context.MODE_PRIVATE);
        }

        @JavascriptInterface
        public void share(final String text, final String title) {
            act.runOnUiThread(new Runnable() {
                public void run() {
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("text/plain");
                    i.putExtra(Intent.EXTRA_TEXT, text);
                    act.startActivity(Intent.createChooser(i, title));
                }
            });
        }

        @JavascriptInterface
        public void save(String json) {
            prefs.edit().putString("data", json).apply();
        }

        @JavascriptInterface
        public String load() {
            return prefs.getString("data", "");
        }
    }
}
