# App Resources

## Icon Requirements

Place your app icon as `icon.png` in this folder with the following specifications:

- **Format**: PNG with transparency
- **Size**: 1024x1024 pixels
- **Design**: Simple, recognizable, works at small sizes
- **Background**: Transparent (Android) or solid color (iOS)

## Splash Screen Requirements

Place your splash screen as `splash.png` in this folder:

- **Format**: PNG
- **Size**: 2732x2732 pixels (will be cropped for different devices)
- **Design**: Center your logo/branding in the middle 1200x1200 area
- **Background**: Solid color that matches your app theme

## Generating Assets

After placing your icon and splash screen, run:

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```

This will automatically generate all required icon and splash screen sizes for Android and iOS.
