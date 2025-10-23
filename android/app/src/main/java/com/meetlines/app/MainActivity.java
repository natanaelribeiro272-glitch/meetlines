package com.meetlines.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

import com.capacitorjs.plugins.camera.CameraPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CameraPlugin.class);

        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                settings.setForceDark(WebSettings.FORCE_DARK_OFF);
            }
        }
    }
}
