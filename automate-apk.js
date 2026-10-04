import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Define paths
const HOME = process.env.HOME || '/root';
const bubblewrapConfigDir = path.join(HOME, '.bubblewrap');
const configFilePath = path.join(bubblewrapConfigDir, 'config.json');

console.log('Starting automated APK generation...');

// 1. Check if config.json already exists or if we should write a default one
// If JDK is installed by bubblewrap, it usually downloads to /root/.bubblewrap/jdk
// Let's first run 'doctor' to trigger JDK/Android SDK setup

function runCommand(command, args, interactionMap) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_OPTIONS: '--require ' + path.resolve('./intercept.cjs')
      }
    });
    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdoutData += output;
      process.stdout.write(output);

      // Check if any prompt in the interaction map matches the output
      for (const [prompt, response] of Object.entries(interactionMap)) {
        if (output.includes(prompt)) {
          console.log(`\n[AUTO-RESPOND] Found prompt: "${prompt}", writing response: "${response.trim()}"`);
          child.stdin.write(response);
          // Delete from map so we don't respond multiple times to the same instance if it repeats, except for generic ones like "Accept?"
          if (prompt !== 'Accept?') {
            delete interactionMap[prompt];
          }
          break;
        }
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderrData += output;
      process.stderr.write(output);
    });

    child.on('close', (code) => {
      console.log(`Command finished with code ${code}`);
      resolve({ code, stdout: stdoutData, stderr: stderrData });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

let manifestBackup = null;
const manifestPath = 'public/manifest.json';

async function main() {
  try {
    // Write twa-manifest.json
    const twaManifest = {
      packageId: "com.minesgame.app",
      host: "ais-pre-3xyvj7flkzhpm4jtclhmm6-28634364797.asia-southeast1.run.app",
      name: "Mines Game",
      launcherName: "Mines Game",
      display: "standalone",
      themeColor: "#0f172a",
      navigationColor: "#0f172a",
      navigationColorDark: "#0f172a",
      navigationDividerColor: "#00000000",
      navigationDividerColorDark: "#00000000",
      backgroundColor: "#0f172a",
      enableNotifications: false,
      startUrl: "/",
      iconUrl: "http://localhost:3000/icon-512.png",
      maskableIconUrl: "http://localhost:3000/icon-512.png",
      splashFadeOutDuration: 300,
      splashScreenFadeOutDuration: 300,
      signingKey: {
        path: "./minesgame-release-key.keystore",
        alias: "minesgame"
      },
      appVersionName: "1.0.2",
      appVersionCode: 3,
      shortcuts: [],
      generatorApp: "bubblewrap-cli",
      webManifestUrl: "http://localhost:3000/manifest.json",
      fallbackType: "customtabs",
      features: {},
      alphaDependencies: {}
    };

    fs.writeFileSync('twa-manifest.json', JSON.stringify(twaManifest, null, 2));
    console.log('Saved twa-manifest.json');

    // Backup and temporarily modify manifest.json to use absolute localhost paths for icons
    // This bypasses bubblewrap attempting to download from the unauthenticated/restricted preview URL,
    // which results in 302 redirects / HTML pages instead of valid PNG buffers.
    try {
      if (fs.existsSync(manifestPath)) {
        manifestBackup = fs.readFileSync(manifestPath, 'utf8');
        const updatedManifest = manifestBackup.replace(/"\/icon-/g, '"http://localhost:3000/icon-');
        fs.writeFileSync(manifestPath, updatedManifest);
        console.log('Temporarily modified public/manifest.json for local icon resolution');
      }
    } catch (e) {
      console.error('Failed to update public/manifest.json:', e.message);
    }

    // Run doctor to setup JDK and SDK
    const setupInteractions = {
      'Do you want Bubblewrap to install the JDK': 'Y\n',
      'Do you want Bubblewrap to install the Android SDK': 'Y\n',
      'terms and conditions': 'y\n'
    };

    console.log('Installing dependencies via doctor...');
    await runCommand('npx', ['@bubblewrap/cli', 'doctor'], setupInteractions);

    // Build the project (which compiles the APK)
    // The build process will ask for keystore details if not found
    const buildInteractions = {
      'Accept?': 'y\n',
      'apply them to the project': 'Y\n',
      'apply them to': 'Y\n',
      'would you like to regenerate your': 'Y\n',
      'Signing Key file not found': 'Y\n',
      'create one now': 'Y\n',
      'versionName for the new': '1.0.2\n',
      'versionCode for the new': '3\n',
      'Password for the Key Store': 'minesgame123\n',
      'Password for the Key': 'minesgame123\n',
      'First and Last name': 'Mines Game\n',
      'Organizational Unit': 'Mines Game\n',
      'Organization': 'Mines Game\n',
      'Country Code': 'IN\n'
    };

    console.log('Building APK...');
    const result = await runCommand('npx', ['@bubblewrap/cli', 'build'], buildInteractions);

    if (result.code === 0) {
      console.log('APK build successful!');
      // Check for compiled apk files
      const files = fs.readdirSync('.');
      const apkFiles = files.filter(f => f.endsWith('.apk'));
      console.log('Generated APK files:', apkFiles);
      
      // Let's find files inside any subdirectories (bubblewrap usually outputs to local dir or build dir)
      if (fs.existsSync('app-release-signed.apk')) {
        fs.copyFileSync('app-release-signed.apk', 'minesgame.apk');
        fs.copyFileSync('app-release-signed.apk', 'public/minesgame.apk');
        console.log('Copied app-release-signed.apk to root and public/minesgame.apk');
      }
    } else {
      console.log('APK build failed with code', result.code);
    }
  } catch (err) {
    console.error('Error during automated APK generation:', err);
  } finally {
    if (manifestBackup && fs.existsSync(manifestPath)) {
      try {
        fs.writeFileSync(manifestPath, manifestBackup);
        console.log('Successfully restored public/manifest.json relative paths');
      } catch (e) {
        console.error('Failed to restore public/manifest.json:', e.message);
      }
    }
  }
}

main();
