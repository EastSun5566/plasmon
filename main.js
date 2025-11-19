const { app, BrowserWindow, ipcMain } = require('electron');
const { Client } = require('ssh2');
const path = require('path');

let sshClient;
let sshStream;
let sshConn = false;
let currentData = null;
let currentSite = null;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
let mainWindow = null;

function sshConnect(site) {
	currentSite = site;
	sshClient = new Client();
	
	sshClient.on('ready', function() {
		console.log('SSH CONNECTION READY');
		sshConn = true;
		
		// Open a shell session
		sshClient.shell({ term: 'vt100' }, function(err, stream) {
			if (err) {
				console.error('SSH SHELL ERROR:', err);
				sshConn = false;
				return;
			}
			
			sshStream = stream;
			console.log('SSH SHELL STARTED');
			
			stream.on('data', function(data) {
				currentData = data;
				if (mainWindow && !mainWindow.isDestroyed()) {
					mainWindow.webContents.send('data', data);
				}
			});
			
			stream.on('close', function() {
				console.log('SSH STREAM CLOSED');
				sshConn = false;
				sshClient.end();
			});
			
			stream.stderr.on('data', function(data) {
				console.error('SSH STDERR:', data.toString());
			});
		});
	});
	
	sshClient.on('error', function(err) {
		console.error('SSH CONNECTION ERROR:', err);
		sshConn = false;
	});
	
	sshClient.on('end', function() {
		console.log('SSH CONNECTION END');
		sshConn = false;
	});
	
	// Connect to SSH server
	sshClient.connect({
		host: site,
		port: 22,
		username: 'bbs',
		password: '',
		tryKeyboard: true,
		readyTimeout: 20000
	});
}

ipcMain.on('send', function(event, arg) {
	if (sshConn && sshStream) {
		sshStream.write(arg, 'binary');
	} else {
		sshConnect(currentSite);
	}
});

ipcMain.on('connect', function(event, site){
	if (!sshConn) {
		sshConnect(site);
	} else {
		if (mainWindow && currentData && !mainWindow.isDestroyed()) {
			mainWindow.webContents.send('data', currentData);
		}
	}
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		center: true,
		width: 1024,
		height: 768,
		backgroundColor: '#000000',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: false,
			nodeIntegration: true,
			sandbox: false
		}
	});

	mainWindow.maximize();

	// Load the index.html of the app.
	mainWindow.loadFile('index.html');

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	// mainWindow.webContents.openDevTools();
});

app.on('activate', function() {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		mainWindow = new BrowserWindow({
			center: true,
			width: 1024,
			height: 768,
			backgroundColor: '#000000',
			webPreferences: {
				preload: path.join(__dirname, 'preload.js'),
				contextIsolation: false,
				nodeIntegration: true,
				sandbox: false
			}
		});
		mainWindow.maximize();
		mainWindow.loadFile('index.html');
	}
});
