const { ipcRenderer, shell } = require('electron');

// Since nodeIntegration is enabled and contextIsolation is disabled,
// we expose APIs directly on window object for backward compatibility
window.electronAPI = {
	// IPC communication
	send: (data) => ipcRenderer.send('send', data),
	connect: (site) => ipcRenderer.send('connect', site),
	onData: (callback) => ipcRenderer.on('data', (event, data) => callback(data)),
	
	// Shell operations
	openExternal: (url) => shell.openExternal(url)
};

