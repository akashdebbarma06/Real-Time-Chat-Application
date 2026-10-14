package com.aetherchat.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.VideoView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.PickVisualMediaRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.video.FallbackStrategy;
import androidx.camera.video.FileOutputOptions;
import androidx.camera.video.PendingRecording;
import androidx.camera.video.Quality;
import androidx.camera.video.QualitySelector;
import androidx.camera.video.Recorder;
import androidx.camera.video.Recording;
import androidx.camera.video.VideoCapture;
import androidx.camera.video.VideoRecordEvent;
import androidx.camera.view.PreviewView;
import androidx.cardview.widget.CardView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.google.common.util.concurrent.ListenableFuture;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CameraActivity extends AppCompatActivity {
    private static final int REQUEST_AUDIO_PERM = 2002;

    // View References
    private PreviewView viewFinder;
    private CardView videoNoteContainer;
    private PreviewView videoNoteFinder;
    private ImageView photoPreview;
    private VideoView videoPreview;
    private View flashOverlay;

    private View topBar;
    private ImageView btnClose;
    private LinearLayout timerBadge;
    private TextView tvTimer;
    private ImageView btnFlash;

    private View bottomControls;
    private TextView tabPhoto;
    private TextView tabVideo;
    private ImageView btnGallery;
    private View btnShutter;
    private View shutterInner;
    private ImageView btnSwitchCamera;

    private View reviewBar;
    private ImageView btnRetake;
    private ImageView btnSend;

    // CameraX State
    private ProcessCameraProvider cameraProvider;
    private Camera activeCamera;
    private Preview preview;
    private ImageCapture imageCapture;
    private VideoCapture<Recorder> videoCapture;
    private Recording activeRecording;

    private int lensFacing = CameraSelector.LENS_FACING_BACK;
    private int flashMode = ImageCapture.FLASH_MODE_OFF;
    private String currentMode = "photo"; // "photo", "video", "video-note"
    private boolean isRecording = false;
    private int recordingSeconds = 0;
    private Handler timerHandler = new Handler(Looper.getMainLooper());
    private Runnable timerRunnable;

    private File capturedFile = null;
    private String capturedMimeType = null;
    private ExecutorService cameraExecutor;

    private ActivityResultLauncher<PickVisualMediaRequest> galleryLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Immersive full screen dark camera mode
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        WindowCompat.setDecorFitsSystemWindows(window, false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.hide(WindowInsetsCompat.Type.navigationBars());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            controller.setAppearanceLightStatusBars(false);
        }

        setContentView(R.layout.activity_camera);
        cameraExecutor = Executors.newSingleThreadExecutor();

        initViews();
        parseIntent();
        initGalleryLauncher();
        setupListeners();

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, REQUEST_CAMERA_PERM);
        } else {
            startCamera();
        }
    }

    private static final int REQUEST_CAMERA_PERM = 2001;

    @Override
    protected void onResume() {
        super.onResume();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            if (cameraProvider == null) {
                startCamera();
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CAMERA_PERM) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startCamera();
            } else {
                Toast.makeText(this, "Camera permission is required to capture photos and videos", Toast.LENGTH_LONG).show();
                boolean rationale = ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.CAMERA);
                if (!rationale) {
                    try {
                        Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                        intent.setData(Uri.fromParts("package", getPackageName(), null));
                        startActivity(intent);
                    } catch (Exception ignored) {}
                }
                setResult(RESULT_CANCELED);
                finish();
            }
        } else if (requestCode == REQUEST_AUDIO_PERM) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                toggleVideoRecording();
            } else {
                Toast.makeText(this, "Recording without audio (microphone permission denied)", Toast.LENGTH_SHORT).show();
                toggleVideoRecording();
            }
        }
    }

    private void initViews() {
        viewFinder = findViewById(R.id.viewFinder);
        videoNoteContainer = findViewById(R.id.videoNoteContainer);
        videoNoteFinder = findViewById(R.id.videoNoteFinder);
        photoPreview = findViewById(R.id.photoPreview);
        videoPreview = findViewById(R.id.videoPreview);
        flashOverlay = findViewById(R.id.flashOverlay);

        topBar = findViewById(R.id.topBar);
        btnClose = findViewById(R.id.btnClose);
        timerBadge = findViewById(R.id.timerBadge);
        tvTimer = findViewById(R.id.tvTimer);
        btnFlash = findViewById(R.id.btnFlash);

        bottomControls = findViewById(R.id.bottomControls);
        tabPhoto = findViewById(R.id.tabPhoto);
        tabVideo = findViewById(R.id.tabVideo);
        btnGallery = findViewById(R.id.btnGallery);
        btnShutter = findViewById(R.id.btnShutter);
        shutterInner = findViewById(R.id.shutterInner);
        btnSwitchCamera = findViewById(R.id.btnSwitchCamera);

        reviewBar = findViewById(R.id.reviewBar);
        btnRetake = findViewById(R.id.btnRetake);
        btnSend = findViewById(R.id.btnSend);
    }

    private void parseIntent() {
        String reqMode = getIntent().getStringExtra("mode");
        if ("video-note".equalsIgnoreCase(reqMode)) {
            currentMode = "video-note";
            lensFacing = CameraSelector.LENS_FACING_FRONT;
            findViewById(R.id.modeSelector).setVisibility(View.GONE);
            btnGallery.setVisibility(View.INVISIBLE);
            viewFinder.setVisibility(View.GONE);
            videoNoteContainer.setVisibility(View.VISIBLE);
            shutterInner.setBackgroundResource(R.drawable.bg_shutter_video);
        } else if ("video".equalsIgnoreCase(reqMode)) {
            setMode("video");
        } else {
            setMode("photo");
        }
    }

    private void initGalleryLauncher() {
        galleryLauncher = registerForActivityResult(
            new ActivityResultContracts.PickVisualMedia(),
            uri -> {
                if (uri != null) {
                    handlePickedMediaUri(uri);
                }
            }
        );
    }

    private void setupListeners() {
        btnClose.setOnClickListener(v -> {
            setResult(RESULT_CANCELED);
            finish();
        });

        btnFlash.setOnClickListener(v -> cycleFlashMode());

        btnSwitchCamera.setOnClickListener(v -> {
            lensFacing = (lensFacing == CameraSelector.LENS_FACING_BACK)
                ? CameraSelector.LENS_FACING_FRONT
                : CameraSelector.LENS_FACING_BACK;
            bindCameraUseCases();
        });

        btnGallery.setOnClickListener(v -> {
            galleryLauncher.launch(
                new PickVisualMediaRequest.Builder()
                    .setMediaType(ActivityResultContracts.PickVisualMedia.ImageAndVideo.INSTANCE)
                    .build()
            );
        });

        tabPhoto.setOnClickListener(v -> setMode("photo"));
        tabVideo.setOnClickListener(v -> setMode("video"));

        btnShutter.setOnClickListener(v -> {
            if ("photo".equals(currentMode)) {
                takePhoto();
            } else {
                if (!isRecording && ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, REQUEST_AUDIO_PERM);
                } else {
                    toggleVideoRecording();
                }
            }
        });

        btnRetake.setOnClickListener(v -> retakeMedia());
        btnSend.setOnClickListener(v -> confirmSendMedia());
    }

    private void setMode(String mode) {
        if (isRecording) return;
        currentMode = mode;
        if ("photo".equals(mode)) {
            tabPhoto.setTextColor(0xFFFFFFFF);
            tabVideo.setTextColor(0x88FFFFFF);
            shutterInner.setBackgroundResource(R.drawable.bg_shutter_photo);
            timerBadge.setVisibility(View.GONE);
            btnFlash.setVisibility(View.VISIBLE);
        } else {
            tabPhoto.setTextColor(0x88FFFFFF);
            tabVideo.setTextColor(0xFFFFFFFF);
            shutterInner.setBackgroundResource(R.drawable.bg_shutter_video);
            btnFlash.setVisibility(View.VISIBLE);
        }
        bindCameraUseCases();
    }

    private void cycleFlashMode() {
        if (activeCamera == null || !activeCamera.getCameraInfo().hasFlashUnit()) {
            Toast.makeText(this, "Flash unavailable on this camera", Toast.LENGTH_SHORT).show();
            return;
        }

        if (flashMode == ImageCapture.FLASH_MODE_OFF) {
            flashMode = ImageCapture.FLASH_MODE_ON;
            btnFlash.setImageResource(R.drawable.ic_flash_on);
            if ("video".equals(currentMode) || "video-note".equals(currentMode)) {
                activeCamera.getCameraControl().enableTorch(true);
            }
        } else if (flashMode == ImageCapture.FLASH_MODE_ON) {
            flashMode = ImageCapture.FLASH_MODE_AUTO;
            btnFlash.setImageResource(R.drawable.ic_flash_auto);
            if ("video".equals(currentMode) || "video-note".equals(currentMode)) {
                activeCamera.getCameraControl().enableTorch(false);
            }
        } else {
            flashMode = ImageCapture.FLASH_MODE_OFF;
            btnFlash.setImageResource(R.drawable.ic_flash_off);
            if (activeCamera != null) {
                activeCamera.getCameraControl().enableTorch(false);
            }
        }

        if (imageCapture != null) {
            imageCapture.setFlashMode(flashMode);
        }
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        cameraProviderFuture.addListener(() -> {
            try {
                cameraProvider = cameraProviderFuture.get();
                bindCameraUseCases();
            } catch (Exception e) {
                Toast.makeText(this, "Camera error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void bindCameraUseCases() {
        if (cameraProvider == null) return;
        cameraProvider.unbindAll();

        CameraSelector cameraSelector = new CameraSelector.Builder()
            .requireLensFacing(lensFacing)
            .build();

        // 1. Preview
        preview = new Preview.Builder().build();
        PreviewView activeFinder = "video-note".equals(currentMode) ? videoNoteFinder : viewFinder;
        preview.setSurfaceProvider(activeFinder.getSurfaceProvider());

        // 2. Image Capture
        imageCapture = new ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .setFlashMode(flashMode)
            .build();

        // 3. Video Capture
        Recorder recorder = new Recorder.Builder()
            .setQualitySelector(QualitySelector.from(Quality.HD, FallbackStrategy.lowerQualityOrHigherThan(Quality.SD)))
            .build();
        videoCapture = VideoCapture.withOutput(recorder);

        try {
            if ("photo".equals(currentMode)) {
                activeCamera = cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture);
            } else {
                activeCamera = cameraProvider.bindToLifecycle(this, cameraSelector, preview, videoCapture);
            }
        } catch (Exception exc) {
            // Fallback: try binding photo capture if video failed on hardware
            try {
                activeCamera = cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture);
            } catch (Exception ignored) {
                Toast.makeText(this, "Camera bind failed: " + exc.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void takePhoto() {
        if (imageCapture == null) return;

        File photoFile = new File(getCacheDir(), "aether_photo_" + System.currentTimeMillis() + ".jpg");
        ImageCapture.OutputFileOptions outputOptions = new ImageCapture.OutputFileOptions.Builder(photoFile).build();

        // Flash animation
        flashOverlay.setVisibility(View.VISIBLE);
        flashOverlay.postDelayed(() -> flashOverlay.setVisibility(View.GONE), 70);

        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            new ImageCapture.OnImageSavedCallback() {
                @Override
                public void onImageSaved(@NonNull ImageCapture.OutputFileResults outputFileResults) {
                    capturedFile = photoFile;
                    capturedMimeType = "image/jpeg";
                    showPhotoPreview(photoFile);
                }

                @Override
                public void onError(@NonNull ImageCaptureException exception) {
                    Toast.makeText(CameraActivity.this, "Capture failed: " + exception.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        );
    }

    private void toggleVideoRecording() {
        if (videoCapture == null) return;

        if (isRecording) {
            // Stop recording
            if (activeRecording != null) {
                activeRecording.stop();
                activeRecording = null;
            }
            stopTimer();
            return;
        }

        // Start recording
        File videoFile = new File(getCacheDir(), "aether_video_" + System.currentTimeMillis() + ".mp4");
        FileOutputOptions outputOptions = new FileOutputOptions.Builder(videoFile).build();

        PendingRecording pending = videoCapture.getOutput().prepareRecording(this, outputOptions);
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            pending.withAudioEnabled();
        }

        activeRecording = pending.start(
            ContextCompat.getMainExecutor(this),
            recordEvent -> {
                if (recordEvent instanceof VideoRecordEvent.Start) {
                    isRecording = true;
                    shutterInner.setBackgroundResource(R.drawable.bg_shutter_recording);
                    timerBadge.setVisibility(View.VISIBLE);
                    startTimer();
                } else if (recordEvent instanceof VideoRecordEvent.Finalize) {
                    VideoRecordEvent.Finalize finalizeEvent = (VideoRecordEvent.Finalize) recordEvent;
                    isRecording = false;
                    stopTimer();
                    shutterInner.setBackgroundResource(R.drawable.bg_shutter_video);
                    timerBadge.setVisibility(View.GONE);

                    if (!finalizeEvent.hasError() && videoFile.exists()) {
                        capturedFile = videoFile;
                        capturedMimeType = "video/mp4";
                        showVideoPreview(videoFile);
                    } else {
                        Toast.makeText(this, "Recording failed or cancelled", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        );
    }

    private void startTimer() {
        recordingSeconds = 0;
        tvTimer.setText("00:00");
        timerRunnable = new Runnable() {
            @Override
            public void run() {
                recordingSeconds++;
                int mins = recordingSeconds / 60;
                int secs = recordingSeconds % 60;
                tvTimer.setText(String.format(Locale.US, "%02d:%02d", mins, secs));
                timerHandler.postDelayed(this, 1000);
            }
        };
        timerHandler.postDelayed(timerRunnable, 1000);
    }

    private void stopTimer() {
        if (timerRunnable != null) {
            timerHandler.removeCallbacks(timerRunnable);
            timerRunnable = null;
        }
    }

    private void showPhotoPreview(File file) {
        bottomControls.setVisibility(View.GONE);
        topBar.setVisibility(View.GONE);
        viewFinder.setVisibility(View.GONE);
        videoNoteContainer.setVisibility(View.GONE);

        Bitmap bitmap = BitmapFactory.decodeFile(file.getAbsolutePath());
        photoPreview.setImageBitmap(bitmap);
        photoPreview.setVisibility(View.VISIBLE);
        reviewBar.setVisibility(View.VISIBLE);
    }

    private void showVideoPreview(File file) {
        bottomControls.setVisibility(View.GONE);
        topBar.setVisibility(View.GONE);
        viewFinder.setVisibility(View.GONE);
        videoNoteContainer.setVisibility(View.GONE);

        videoPreview.setVisibility(View.VISIBLE);
        videoPreview.setVideoPath(file.getAbsolutePath());
        videoPreview.setOnPreparedListener(mp -> {
            mp.setLooping(true);
            videoPreview.start();
        });
        reviewBar.setVisibility(View.VISIBLE);
    }

    private void retakeMedia() {
        if (capturedFile != null && capturedFile.exists()) {
            capturedFile.delete();
        }
        capturedFile = null;
        capturedMimeType = null;

        if (videoPreview.isPlaying()) {
            videoPreview.stopPlayback();
        }
        videoPreview.setVisibility(View.GONE);
        photoPreview.setVisibility(View.GONE);
        reviewBar.setVisibility(View.GONE);

        if ("video-note".equals(currentMode)) {
            videoNoteContainer.setVisibility(View.VISIBLE);
        } else {
            viewFinder.setVisibility(View.VISIBLE);
        }

        topBar.setVisibility(View.VISIBLE);
        bottomControls.setVisibility(View.VISIBLE);
        bindCameraUseCases();
    }

    private void handlePickedMediaUri(Uri uri) {
        try {
            String mime = getContentResolver().getType(uri);
            if (mime == null) mime = "image/jpeg";
            boolean isVid = mime.startsWith("video/");
            String ext = isVid ? ".mp4" : ".jpg";

            File destFile = new File(getCacheDir(), "picked_media_" + System.currentTimeMillis() + ext);
            try (InputStream in = getContentResolver().openInputStream(uri);
                 OutputStream out = new FileOutputStream(destFile)) {
                byte[] buf = new byte[8192];
                int len;
                while ((len = in.read(buf)) > 0) {
                    out.write(buf, 0, len);
                }
            }

            capturedFile = destFile;
            capturedMimeType = mime;
            if (isVid) {
                showVideoPreview(destFile);
            } else {
                showPhotoPreview(destFile);
            }
        } catch (Exception e) {
            Toast.makeText(this, "Failed to load media: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void confirmSendMedia() {
        if (capturedFile == null || !capturedFile.exists()) {
            setResult(RESULT_CANCELED);
            finish();
            return;
        }

        try {
            Intent result = new Intent();
            result.putExtra("path", capturedFile.getAbsolutePath());
            result.putExtra("name", capturedFile.getName());
            result.putExtra("mimeType", capturedMimeType != null ? capturedMimeType : "image/jpeg");
            result.putExtra("size", capturedFile.length());
            result.putExtra("mode", currentMode);

            setResult(RESULT_OK, result);
            finish();
        } catch (Exception e) {
            Toast.makeText(this, "Error preparing media: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            setResult(RESULT_CANCELED);
            finish();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (isRecording && activeRecording != null) {
            activeRecording.stop();
            activeRecording = null;
        }
        stopTimer();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (activeCamera != null) {
            activeCamera.getCameraControl().enableTorch(false);
        }
        if (cameraProvider != null) {
            cameraProvider.unbindAll();
        }
        if (cameraExecutor != null) {
            cameraExecutor.shutdown();
        }
    }
}
