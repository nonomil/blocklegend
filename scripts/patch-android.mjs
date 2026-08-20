import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim() || '0.8.0';
const code = Number(String(version).replace(/\D/g, '') || '80');

const gradle = path.join(root, 'android', 'app', 'build.gradle');
if (fs.existsSync(gradle)) {
  let text = fs.readFileSync(gradle, 'utf8');
  text = text.replace(/versionCode\s+\d+/, 'versionCode ' + code);
  text = text.replace(/versionName\s+"[^"]+"/, 'versionName "' + version + '"');
  if (!text.includes('signingConfigs')) {
    text = text.replace(
      '    buildTypes {',
      [
        '    signingConfigs {',
        '        release {',
        '            def ks = System.getenv("ANDROID_KEYSTORE_FILE")',
        '            if (ks != null && !ks.isEmpty()) {',
        '                storeFile file(ks)',
        '                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")',
        '                keyAlias System.getenv("ANDROID_KEY_ALIAS")',
        '                keyPassword System.getenv("ANDROID_KEY_PASSWORD")',
        '            }',
        '        }',
        '    }',
        '    buildTypes {'
      ].join('\n')
    );
    text = text.replace(
      '        release {\n            minifyEnabled false',
      '        release {\n            minifyEnabled false\n            signingConfig signingConfigs.release'
    );
  }
  fs.writeFileSync(gradle, text);
}

const manifest = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifest)) {
  let text = fs.readFileSync(manifest, 'utf8');
  if (!text.includes('RECORD_AUDIO')) {
    text = text.replace(
      '<uses-permission android:name="android.permission.INTERNET" />',
      [
        '<uses-permission android:name="android.permission.INTERNET" />',
        '    <uses-permission android:name="android.permission.RECORD_AUDIO" />',
        '    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />',
        '    <uses-feature android:name="android.hardware.microphone" android:required="false" />'
      ].join('\n')
    );
    fs.writeFileSync(manifest, text);
  }
  if (!text.includes('windowSoftInputMode')) {
    text = text.replace(
      /<activity\b([^>]*)>/,
      function (_, attrs) {
        return '<activity' + attrs + ' android:windowSoftInputMode="adjustResize">';
      }
    );
    fs.writeFileSync(manifest, text);
  }
  if (!text.includes('android.speech.RecognitionService')) {
    const queries = [
      '    <queries>',
      '        <intent>',
      '            <action android:name="android.speech.RecognitionService" />',
      '        </intent>',
      '    </queries>'
    ].join('\n');
    if (text.includes('</manifest>')) {
      text = text.replace('</manifest>', queries + '\n</manifest>');
      fs.writeFileSync(manifest, text);
    }
  }
}

const strings = path.join(root, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
if (fs.existsSync(strings)) {
  let text = fs.readFileSync(strings, 'utf8');
  text = text.replace(/<string name="app_name">[^<]*<\/string>/, '<string name="app_name">我的方块学园</string>');
  text = text.replace(/<string name="title_activity_main">[^<]*<\/string>/, '<string name="title_activity_main">我的方块学园</string>');
  fs.writeFileSync(strings, text);
}

console.log('[patch-android] version', version, 'code', code);
