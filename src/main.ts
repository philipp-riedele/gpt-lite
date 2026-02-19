import { app, BrowserWindow, session, Menu, clipboard } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

// Phone User-Agent: "Mobile" token triggers ChatGPT's lightweight JS bundle
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
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Set phone UA before page loads — "Mobile" token = fast bundle
  mainWindow.webContents.setUserAgent(PHONE_UA);

  mainWindow.loadURL('https://chatgpt.com');

  mainWindow.webContents.on('did-finish-load', () => {
    // Inject floating refresh button
    mainWindow?.webContents.executeJavaScript(`
      if (!document.getElementById('electron-refresh-btn')) {
        const btn = document.createElement('button');
        btn.id = 'electron-refresh-btn';
        btn.innerHTML = '🔄';
        btn.title = 'Refresh (F5)';
        btn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 99999; background: #10a37f; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: all 0.2s;';
        btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; btn.style.background = '#0d8c6a'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.background = '#10a37f'; };
        btn.onclick = () => { location.reload(); };
        document.body.appendChild(btn);
      }
    `);
  });

  // Keep ChatGPT/auth links in-app, open everything else in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://chatgpt.com') || url.startsWith('https://auth.openai.com')) {
      return { action: 'allow' };
    }
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // Context menu — role-based items auto-translate to system language
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menuTemplate: Electron.MenuItemConstructorOptions[] = [];

    if (params.selectionText) {
      menuTemplate.push({ role: 'copy' });
    }

    if (params.isEditable) {
      if (params.selectionText) {
        menuTemplate.push({ role: 'cut' });
      }
      menuTemplate.push({ role: 'paste' });
    }

    if (menuTemplate.length > 0) {
      menuTemplate.push({ type: 'separator' });
    }
    menuTemplate.push({ role: 'selectAll' });

    // Copy current page URL (e.g. https://chatgpt.com/c/abc123)
    menuTemplate.push(
      { type: 'separator' },
      {
        label: 'Copy URL',
        click: () => {
          const url = mainWindow?.webContents.getURL();
          if (url) clipboard.writeText(url);
        }
      }
    );

    if (params.linkURL) {
      menuTemplate.push({
        label: 'Copy Link',
        click: () => {
          clipboard.writeText(params.linkURL);
        }
      });
    }

    if (params.mediaType === 'image') {
      menuTemplate.push(
        { type: 'separator' },
        { label: 'Copy Image', role: 'copyImageAt' as any }
      );
    }

    const menu = Menu.buildFromTemplate(menuTemplate);
    menu.popup();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

if (process.platform === 'win32') {
  app.setAppUserModelId('com.prmeta.gpt-lite');
}
