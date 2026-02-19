import { app, BrowserWindow, session, Menu, clipboard } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

// Phone User-Agent: "Mobile" Token garantiert das schnelle, leichte JS-Bundle von ChatGPT
const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36';

function createWindow(): void {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    minWidth: 400,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    },
    title: 'GPT Lite',
    icon: path.join(__dirname, '../assets/icon.png'),
    autoHideMenuBar: true,
    // Zeige Fenster erst wenn bereit
    show: false
  });

  // Fenster anzeigen wenn bereit (verhindert weißen Bildschirm)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Phone User-Agent setzen bevor die Seite lädt — "Mobile" Token = schnelles Bundle
  mainWindow.webContents.setUserAgent(PHONE_UA);

  // Lade ChatGPT
  mainWindow.loadURL('https://chatgpt.com');

  mainWindow.webContents.on('did-finish-load', () => {
    // Injiziere Floating Refresh-Button
    mainWindow?.webContents.executeJavaScript(`
      // Erstelle Floating Refresh-Button (nur wenn noch nicht vorhanden)
      if (!document.getElementById('electron-refresh-btn')) {
        const btn = document.createElement('button');
        btn.id = 'electron-refresh-btn';
        btn.innerHTML = '🔄';
        btn.title = 'Aktualisieren (F5)';
        btn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 99999; background: #10a37f; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: all 0.2s;';
        btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; btn.style.background = '#0d8c6a'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.background = '#10a37f'; };
        btn.onclick = () => { location.reload(); };
        document.body.appendChild(btn);
      }
    `);
  });

  // Verhindere neue Fenster (öffne Links im gleichen Fenster)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://chatgpt.com') || url.startsWith('https://auth.openai.com')) {
      return { action: 'allow' };
    }
    // Externe Links in Standard-Browser öffnen
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // DevTools für Debugging (nur für Development)
  // mainWindow.webContents.openDevTools();

  // Rechtsklick-Kontextmenü
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menuTemplate: Electron.MenuItemConstructorOptions[] = [];

    // Kopieren (nur wenn Text ausgewählt)
    if (params.selectionText) {
      menuTemplate.push({
        label: 'Kopieren',
        role: 'copy'
      });
    }

    // Einfügen (nur in Eingabefeldern)
    if (params.isEditable) {
      if (params.selectionText) {
        menuTemplate.push({
          label: 'Ausschneiden',
          role: 'cut'
        });
      }
      menuTemplate.push({
        label: 'Einfügen',
        role: 'paste'
      });
    }

    // Alles auswählen
    if (menuTemplate.length > 0) {
      menuTemplate.push({ type: 'separator' });
    }
    menuTemplate.push({
      label: 'Alles auswählen',
      role: 'selectAll'
    });

    // URL der aktuellen Seite kopieren
    menuTemplate.push(
      { type: 'separator' },
      {
        label: 'URL kopieren',
        click: () => {
          const url = mainWindow?.webContents.getURL();
          if (url) clipboard.writeText(url);
        }
      }
    );

    // Link-spezifische Optionen
    if (params.linkURL) {
      menuTemplate.push({
        label: 'Link kopieren',
        click: () => {
          clipboard.writeText(params.linkURL);
        }
      });
    }

    // Bild-spezifische Optionen
    if (params.mediaType === 'image') {
      menuTemplate.push(
        { type: 'separator' },
        {
          label: 'Bild kopieren',
          role: 'copyImageAt' as any
        }
      );
    }

    const menu = Menu.buildFromTemplate(menuTemplate);
    menu.popup();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App Ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit wenn alle Fenster geschlossen (außer macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Setze App User Model ID für Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.prmeta.gpt-lite');
}
