const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateSplashAssets() {
  const iconPath = path.resolve(__dirname, '../public/icon.png');
  const resDir = path.resolve(__dirname, '../android/app/src/main/res');

  if (!fs.existsSync(iconPath)) {
    console.error('Source icon.png not found at', iconPath);
    process.exit(1);
  }

  // Target dimensions for Android splash screens
  const splashDirs = fs.readdirSync(resDir).filter((dir) => {
    return fs.existsSync(path.join(resDir, dir, 'splash.png'));
  });

  console.log(`Found ${splashDirs.length} splash directories to update.`);

  for (const dir of splashDirs) {
    const splashPath = path.join(resDir, dir, 'splash.png');
    const meta = await sharp(splashPath).metadata();
    const width = meta.width || 480;
    const height = meta.height || 800;

    // Logo size: 28% of smaller dimension, clamped between 96px and 420px
    const minDim = Math.min(width, height);
    const logoSize = Math.max(96, Math.min(420, Math.round(minDim * 0.28)));

    const resizedLogo = await sharp(iconPath)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Composite centered on deep dark background #09090b
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 9, g: 9, b: 11, alpha: 1 }, // #09090b
      },
    })
      .composite([
        {
          input: resizedLogo,
          gravity: 'center',
        },
      ])
      .png()
      .toFile(splashPath);

    console.log(`Generated ${dir}/splash.png (${width}x${height}, logo: ${logoSize}px)`);
  }

  // Also generate Android 12+ splash_icon.png with transparent padding (for windowSplashScreenAnimatedIcon)
  const splashIconPath = path.join(resDir, 'drawable', 'splash_icon.png');
  const adaptiveIconSize = 288;
  const innerLogoSize = 176; // Sits comfortably inside the 160dp circular mask of Android 12

  const resizedAdaptiveLogo = await sharp(iconPath)
    .resize(innerLogoSize, innerLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: adaptiveIconSize,
      height: adaptiveIconSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: resizedAdaptiveLogo,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(splashIconPath);

  console.log(`Generated drawable/splash_icon.png (${adaptiveIconSize}x${adaptiveIconSize}, inner: ${innerLogoSize}px)`);
}

generateSplashAssets().catch((err) => {
  console.error(err);
  process.exit(1);
});
