// var iconv = require('iconv-lite');
const PCMan =  require('pcman');
let pcman = null;
const u2b_table = require('./u2b.json');
const b2u_table = require('./b2u.json');

class App {
	constructor(url, _charset) {
		this.url = url;
		this.container = document.body;
		this.canvas = document.getElementById("canvas");
		this.input_proxy = document.getElementById('input_proxy');
	}
	setup() {
		pcman = new PCMan({
			view: this.canvas,
			input: this.input_proxy,
			opener: function(url) {
				fetch(url, {method: 'HEAD'}).then(function(response) {
					if (/^image\/.+/.test(response.headers.get('Content-Type'))) { //  open image viewer
						let viewer = document.getElementById("viewer");
						viewer.innerHTML = `<img src="${url}" />`;
						viewer.show();
					} else
						window.electronAPI.openExternal(url);
				}, function() {
					window.electronAPI.openExternal(url); // handle fetch error
				});
			},
			sender: window.electronAPI.send,
			encoder: function(str) {
				var data = '';
				for (var i = 0; i < str.length; ++i) {
					if (str.charAt(i) < '\x80') {
						data += str.charAt(i);
						continue;
					}
					var charCodeStr = str.charCodeAt(i).toString(16).toUpperCase();
					charCodeStr = 'x' + ('000' + charCodeStr).substr(-4);
					if (u2b_table[charCodeStr])
						data += u2b_table[charCodeStr];
					else // Not a big5 char
						data += '\xFF\xFD';
				}
				return data;
			},
			decoder: function(str) {
				var data = '';
				for (var i = 0; i < str.length; ++i) {
					if (str.charAt(i) < '\x80' || i == str.length-1) {
						data += str.charAt(i);
						continue;
					}
					var b5index = 'x' + str.charCodeAt(i).toString(16).toUpperCase() +
						str.charCodeAt(i+1).toString(16).toUpperCase();
					if (b2u_table[b5index]) {
						data += b2u_table[b5index];
						++i;
					} else { // Not a big5 char
						data += str.charAt(i);
					}
				}
				return data;
			}
		});
		window.electronAPI.connect(this.url);
		window.electronAPI.onData(pcman.receive.bind(pcman));
		document.title = this.url;
		document.addEventListener('focus', this.set_focus, false);
		this.set_focus();
		this.resize();
	}
	set_focus(_e) {
		this.input_proxy.focus();
	}
	resize(){
		pcman.resize();
	}
	finalize() {
		pcman.close();
		pcman = null;
		document.removeEventListener('focus', set_focus, false);
	}
}


function eventHandler(event) {
	switch (event.type) {
		case 'mousedown':
			return pcman.view.onMouseDown(event);
		case 'mousemove':
			return pcman.view.onMouseMove(event);
		case 'mouseup':
			return pcman.view.onMouseUp(event);
		case 'click':
			return pcman.view.onClick(event);
		case 'dblclick':
			return pcman.view.onDblClick(event);
	}
}

document.addEventListener("DOMContentLoaded", function(_event) {
	var app = new App('ptt.cc');
	window.onload = app.setup.bind(app);
	window.onunload = app.finalize.bind(app);
	window.onresize = app.resize.bind(app);
	window.onmousedown = app.set_focus.bind(app);
	window.onmouseup = app.set_focus.bind(app);
	document.body.onmousedown = eventHandler;
	document.body.onmousemove = eventHandler;
	document.body.onmouseup = eventHandler;
	document.body.onclick = eventHandler;
	document.body.ondblclick = eventHandler;
	let viewer = document.getElementById("viewer");
	viewer.onclick = function() {
		viewer.close();
	};
	viewer.onclose = function() {
		viewer.innerHTML = '';
	};
	window.addEventListener('contextmenu', function (e) {
		e.preventDefault();
		var isSel = pcman.view.selection.hasSelection();
		// Note: Context menu functionality requires implementing a custom menu
		// using HTML/CSS or using Electron's menu APIs via IPC
		// For now, we'll disable the default context menu
		// TODO: Implement custom context menu with copy/paste/select all/search functionality
	}, false);
});
