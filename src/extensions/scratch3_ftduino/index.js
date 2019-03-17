const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');

// ToDo:
// - try to connect automatically

// a set of very simple routines giving access to the ftDuinos serial USB port
var serial = {};

(function() {
    'use strict';

    serial.getPorts = function() {
	return navigator.usb.getDevices().then(devices => {
	    return devices.map(device => new serial.Port(device));
	});
    };
    
    serial.requestPort = function() {
	const filters = [
	    // ftDuino USB IDs
	    { 'vendorId': 0x1c40, 'productId': 0x0538 },
	];
	return navigator.usb.requestDevice({ 'filters': filters }).then(
	    device => new serial.Port(device)
	);
    }
    
    serial.Port = function(device) {
	this.device_ = device;
    };
    
    serial.Port.prototype.connect = function() {
	let readLoop = () => {
	    this.device_.transferIn(5, 64).then(result => {
		this.onReceive(result.data);
		readLoop();
	    }, error => {
		this.onReceiveError(error);
	    });
	};
	
	return this.device_.open()
            .then(() => {
		if (this.device_.configuration === null) {
		    return this.device_.selectConfiguration(1);
		}
            })
            .then(() => this.device_.claimInterface(2))
            .then(() => this.device_.selectAlternateInterface(2, 0))
            .then(() => this.device_.controlTransferOut({
		'requestType': 'class',
		'recipient': 'interface',
		'request': 0x22,
		'value': 0x01,
		'index': 0x02}))
            .then(() => {
		readLoop();
            });
    };
    
    serial.Port.prototype.disconnect = function() {
	return this.device_.controlTransferOut({
            'requestType': 'class',
            'recipient': 'interface',
            'request': 0x22,
            'value': 0x00,
            'index': 0x02})
            .then(() => this.device_.close());
    };
    
    serial.Port.prototype.send = function(data) {
	return this.device_.transferOut(4, data);
    };
})();


/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CjxtZXRhZGF0YT4KPHJkZjpSREY+CjxjYzpXb3JrIHJkZjphYm91dD0iIj4KPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz4KPGRjOnRpdGxlLz4KPC9jYzpXb3JrPgo8L3JkZjpSREY+CjwvbWV0YWRhdGE+CjxzdHlsZT4uc3Qye2ZpbGw6cmVkfS5zdDN7ZmlsbDojZTBlMGUwfS5zdDR7ZmlsbDpub25lO3N0cm9rZTojNjY2O3N0cm9rZS13aWR0aDouNTtzdHJva2UtbWl0ZXJsaW1pdDoxMH08L3N0eWxlPgo8ZyB0cmFuc2Zvcm09Im1hdHJpeCguMTI1MjYgMCAwIC4xMjUyNiAtNTEuNTcyIC0xMC40ODkpIj4KPHJlY3QgeD0iNDE3LjQ4IiB5PSI4OS40OTkiIHdpZHRoPSIzMDguMjciIGhlaWdodD0iMzA4LjI3IiBmaWxsPSIjYjliOWI5IiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxMC42MyIvPgo8cmVjdCB4PSI0MjYuMTMiIHk9Ijk4LjE5OCIgd2lkdGg9IjI4OS43MyIgaGVpZ2h0PSIyODkuNzMiIGZpbGw9IiNhNmQ5YWIiLz4KPHJlY3QgeD0iNTYxLjc0IiB5PSI5Ny44OTEiIHdpZHRoPSIzNS40MzMiIGhlaWdodD0iMzUuNDMzIi8+CjxyZWN0IHg9IjQ3OC43OCIgeT0iOTguMTQxIiB3aWR0aD0iMzEuMTgxIiBoZWlnaHQ9IjMyLjAwOCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iLjcwODY2Ii8+CjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQxMi40MyAtNjYwLjEzKSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMjUuMzI5IiBjeT0iMTAzNS4yIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iMjUuMzI5IiBjeT0iMTAwOC43IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iMjUuMzI5IiBjeT0iOTgyLjA4IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iMjUuMzI5IiBjeT0iOTU1LjUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIGN4PSIyNS4zMjkiIGN5PSI5MjguOTMiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIGN4PSIyNS4zMjkiIGN5PSI5MDIuMzUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIGN4PSIyNS4zMjkiIGN5PSI4NzUuNzgiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIGN4PSIyNS4zMjkiIGN5PSI4NDkuMiIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgY3g9Ijc4LjQ3OCIgY3k9IjEwMzUuMiIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgY3g9IjUxLjkwNCIgY3k9IjEwMzUuMiIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgY3g9IjUxLjkwNCIgY3k9IjEwMDguNyIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgY3g9IjUxLjkwNCIgY3k9Ijk4Mi4wOCIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgY3g9IjUxLjkwNCIgY3k9Ijk1NS41IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iNTEuOTA0IiBjeT0iOTI4LjkzIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iNTEuOTA0IiBjeT0iOTAyLjM1IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iNTEuOTA0IiBjeT0iODc1Ljc4IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iNTEuOTA0IiBjeT0iODQ5LjIiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjkxLjA4IiBjeT0iMTAzNS4yIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI5MS4wOCIgY3k9IjEwMDguNyIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgdHJhbnNmb3JtPSJzY2FsZSgtMSwxKSIgY3g9Ii0yOTEuMDgiIGN5PSI5ODIuMDgiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjkxLjA4IiBjeT0iOTU1LjUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjkxLjA4IiBjeT0iOTI4LjkzIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI5MS4wOCIgY3k9IjkwMi4zNSIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgdHJhbnNmb3JtPSJzY2FsZSgtMSwxKSIgY3g9Ii0yOTEuMDgiIGN5PSI4NzUuNzgiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjkxLjA4IiBjeT0iODQ5LjIiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjM3LjkzIiBjeT0iMTAzNS4yIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI2NC41IiBjeT0iMTAzNS4yIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI2NC41IiBjeT0iMTAwOC43IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI2NC41IiBjeT0iOTgyLjA4IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI2NC41IiBjeT0iOTU1LjUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjY0LjUiIGN5PSI5MjguOTMiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjY0LjUiIGN5PSI5MDIuMzUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjY0LjUiIGN5PSI4NzUuNzgiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjY0LjUiIGN5PSI4NDkuMiIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgdHJhbnNmb3JtPSJzY2FsZSgtMSwxKSIgY3g9Ii0yNjguMDUiIGN5PSI3NzEuMjUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjM5LjciIGN5PSI3NzEuMjUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIGN4PSIzNy43MyIgY3k9Ijc3MS4yNSIgcj0iNi43MzIzIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iLjcwODY2Ii8+CjwvZz4KPHJlY3QgeD0iNTQ0LjQ5IiB5PSIzNDUuODMiIHdpZHRoPSI1NS45ODQiIGhlaWdodD0iMzQuNzI0IiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyLjEyNiIvPgo8Y2lyY2xlIGN4PSI1MjQuNzMiIGN5PSIxMTIuNDMiIHI9IjYuNDIwOSIgZmlsbD0iIzBmZjQwMCIgc3Ryb2tlPSIjMDA1NDA3IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41OTQ3Ii8+CjxjaXJjbGUgY3g9IjU0NC42OSIgY3k9IjExMi4zOSIgcj0iNi40NjAyIiBmaWxsPSIjZmY2MDYwIiBzdHJva2U9IiM5YTAwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjYwNDQiLz4KPC9nPgo8L3N2Zz4K';

/**
 * Class for the ftDuino blocks in Scratch 3.0
 * @constructor
 */

const FTDUINO_BUTTON_ID = "ftDuino_connect_button";
const PARENT_CLASS = "controls_controls-container_2xinB"

class Scratch3FtduinoBlocks {
    connectClicked() {
	alert("Clicked connect");
	this.manualConnect();
    }
    
    removeConnectButton() {
	button = document.getElementById(FTDUINO_BUTTON_ID);
	if(button != undefined)
	    button.parentNode.removeChild(button);
    }
	
    addConnectButton() {
	//  check if the button already exists
	button = document.getElementById(FTDUINO_BUTTON_ID);

	if(button == undefined) {
	    console.log("ftDuino: Adding connect button");
	
	    x = document.getElementsByClassName(PARENT_CLASS);
	    if(x.length > 0) {
		hdrdiv = x[0];
		console.log(hdrdiv);
	    
		hdrdiv.innerHTML += '<button id="'+
		    FTDUINO_BUTTON_ID+'" type="button">Connect</button>';

		button = document.getElementById(FTDUINO_BUTTON_ID);
		button.onclick = this.connectClicked.bind(this);
	    } else
		alert("ftDuino: controls-container class not found!");
	}
    }
    
    constructor (runtime) {
	this.debug = false;

	if(navigator.usb) {
	    this.textEncoder = new TextEncoder();   
	    console.log("WebUSB supported!");
	    navigator.usb.addEventListener('connect', event => {
		alert("New USB Connect!");
//		this.autoConnect();
	    });
	    
	    navigator.usb.addEventListener('disconnect', event => {
		alert("USB connection lost");
	    });

	    // TODO: try to autoconnect first
	    // this.manualConnect();
	    this.autoConnect();

	} else
	    alert("No USB support on this browser. Please use Google Chrome or a related browser.");

        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    manualConnect() {
	serial.requestPort().then(selectedPort => {
            console.log("ftDuino: User selected:" + selectedPort);
            this.connect(selectedPort);
	}).catch(error => {
	    // this also happens if the user cancels the device
	    // selection
            alert('Connection error: ' + error);
	});
    }

    // commands sent to ftDuino
    ftdSet(item) { this.ftdReq(JSON.stringify({ set: item })); };
    
    ftdSetLed(state)            { this.ftdSet({ port: "led", value: state }); }
    ftdSetOutput(port,pwm)      { this.ftdSet({ port: port, mode: "HI", value: pwm }); }
   
    ftdReq(req) {
	if (this.port !== undefined) {
            if(this.debug) console.log("TX:" + req);
            p = this.port.send(this.textEncoder.encode(req));
            p.then(
		function(val) {
		    if(this.debug)
			console.log("PROMISE fulfilled: "+ val.bytesWritten + " " + val.status);
		}
            );
	}
    }

    ftdGet(item = null, callback = null) {
	if(item) {
            this.callback = callback;
            this.get_item = item;
	}

	this.ftdReq(JSON.stringify({ get: this.get_item }));

	// schedule retransmission
	this.reply_timeout = setTimeout(this.ftdGet.bind(this), 1000);
    }

    ftdPollerCallback(v) {
	this.poll_state_input[this.poll_count] = Cast.toBoolean(v);

	// handle next input
	this.poll_count = this.poll_count + 1
	
	// next poller run in 2ms
	setTimeout(this.ftdPoller.bind(this), 2);
    }
	
    ftdPoller() {
	// poll count runs from 0 to 16. These mean
	// 0..7 = read inputs i1-i8
	// 8..15 = update outputs o1-o8 (if needed)
	// 16 = update led if needed

	while(this.poll_count > 7) {
	    if(this.poll_count <= 15) {
		// check for pending output updates
		this.poll_count++;

		// check for pending led update, counter is
		// now 9..16
		if(this.poll_update_output[this.poll_count-9]) {
		    port = "O"+(this.poll_count-8).toString();
		    // send new state
		    this.ftdSetOutput(port, this.poll_state_output[this.poll_count-9]);
		    // clear update flag
		    this.poll_update_output[this.poll_count-9] = false;

		    // next poller run in 10ms
		    setTimeout(this.ftdPoller.bind(this), 10);
		    
		    return;
		}
	    } else {
		// next handle input i1
		this.poll_count = 0;
		
		// check for pending led update
		if(this.poll_update_led) {
		    
		    // send new state
		    this.ftdSetLed(this.poll_state_led);
		    // clear update flag
		    this.poll_update_led = false;

		    // next poller run in 10ms
		    setTimeout(this.ftdPoller.bind(this), 10);
		    
		    return;
		}
	    }
	}
	    
	if((this.poll_count >= 0) && (this.poll_count <= 7)) {	
	    port = "I"+(this.poll_count+1).toString();
	    this.ftdGet({ port: port },
			{ "func": this.ftdPollerCallback.bind(this),
			  "value": "value",
			  "expect": { "port": port } });
	}
	
	
	// TODO: start another timout so we can deal with the
	// fact that a request or reply may get lost
    }
    
    ftdCheckVersionCallback(ver) {
	// enable run button after successful connection
	console.log("ftDuino setup completed");

	// remove any connect button that may be there
	this.removeConnectButton();

	// use a timer to frequently poll the inputs and
	// update the outputs
	this.poll_state_input  = [ false,false,false,false,false,false,false,false ];
	this.poll_state_output = [ false,false,false,false,false,false,false,false ];
	this.poll_state_led = false;

	// keep state of those outputs that need to be updated
	this.poll_update_output = [ false,false,false,false,false,false,false,false ];
	this.poll_update_led = false;

	// counter running over all inputs and outputs
	this.poll_count = 0;

	// start polling in 100ms
	setTimeout(this.ftdPoller.bind(this), 100);
    }

    ftdCheckVersion() {
	console.log("Checking for version");
	
	// send ESC (for parser reset)
	this.port.send(this.textEncoder.encode("\x1b"));
	this.ftdGet("version", { "value": "version",
				 "func": this.ftdCheckVersionCallback.bind(this) } );
    }

    parse(msg) {
	// run result through json decoder
	// console.log("parse:", msg);
	result = JSON.parse(msg);

	// if there's a pending callback
	if(this.callback) {
	    var reply_ok = true;
    
	    // check if all expected entries are in this reply (e.g. correct port)
	    if(this.callback["expect"]) {
		// iterate over all expected keys
		var keys = Object.keys(this.callback["expect"]);
		for(var i=0; i < keys.length ; i++) {
		    if(result[keys[i]].toLowerCase() !==
		       this.callback["expect"][keys[i]].toLowerCase()) {
			console.log("Missing expected reply parameter:",
				    keys[i], ":", this.callback["expect"][keys[i]]);
			reply_ok = false;
		    }
		}
	    }
	    
	    if(result[this.callback["value"]] === undefined) {
		console.log("Missing value parameter: ", this.callback["value"]);
		reply_ok = false;
	    }
	    
	    if(reply_ok) {
		if(this.debug) console.log("Reply ok, cancelling timeout");
		
		// call it callback ...
		this.callback["func"](result[this.callback["value"]]);
		// ... and forget about it
		this.callback = null;
		
		// cancel any pending timeout
		clearTimeout(this.reply_timeout);
		this.reply_timeout = null;
	    }
	}
    }

    clean_buffer() {
	// buffer must begin with "{". Skip everything else
	while((this.buffer.length > 0) && (this.buffer.charAt(0) != '{'))
	    this.buffer = this.buffer.substr(1);
    }

    buffer_contains_message() {
	// check if there's a matching closing brace in buffer
	if(this.buffer.length < 2)
	    return 0;

	depth = 0;
	index = 0;
	while(index < this.buffer.length) {
	    // just increase the depth if another opening brace is found
	    if(this.buffer.charAt(index) == '{')
		depth++;
			
	    if(this.buffer.charAt(index) == '}') {
		// returning to level 0 means end of message
		depth--;
		if(depth == 0)
		    return index;
	    }
	    index++;
	}
	return 0;
    }
    
    connect(port) {   
	port.connect().then(() => {
	    this.buffer = "";
	    this.port = port;
            console.log('Connected to ' + port.device_.productName);

            // check version. A correct result will enable the GUI
            this.ftdCheckVersion();
	    
            port.onReceive = data => {
		let textDecoder = new TextDecoder();
		// append all data received to buffer
		this.buffer = this.buffer + textDecoder.decode(data);

		// console.log("Buffer: " + this.buffer);

		this.clean_buffer();
		index = this.buffer_contains_message();
		while(index > 0) {		
		    // extract the string and parse it
		    this.parse(this.buffer.substr(0, index+1));
		    
		    // and keep the rest in the buffer
		    this.buffer = this.buffer.substr(index+1);

		    // check if there's another message
		    this.clean_buffer();
		    index = this.buffer_contains_message();
		}
            }
            port.onReceiveError = error => {
		console.log('Receive error: ' + error);
            };
	}, error => {
            alert('Connection error: ' + error);
	});
    }
    
    autoConnect() {
	console.log("trying autoConnect ...");
	try {
            serial.getPorts().then(ports => {
		console.log("Ports" + ports);
		
		if (ports.length == 0) {
		    console.log("ftDuino: No paired device found!");
		    this.addConnectButton();
		} else {
		    // at least one device found. Connect to first one
		    this.connect(ports[0]);
		}
            } ); 
	} catch (e) {
            alert("WebUSB not available: " + e);
	}
    }
    
    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'ftduino',
            name: 'ftDuino',
            blockIconURI: blockIconURI,
            blocks: [
		{
		    opcode: 'led',
		    text: formatMessage({
                        id: 'ftduino.led',
                        default: 'set LED [VALUE]',
                        description: 'set the ftDuino led'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
			VALUE: {
                            type: ArgumentType.STRING,
                            menu: 'ONOFFSTATE',
                            defaultValue: 'On'
                        }
                    }
		},
		{
		    opcode: 'input',
		    text: formatMessage({
                        id: 'ftduino.input',
                        default: 'input [INPUT]',
                        description: 'read an ftDuino input'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        INPUT: {
                            type: ArgumentType.STRING,
                            menu: 'INPUT',
                            defaultValue: 'I1'
                        }
                    }
		},
		{
		    opcode: 'output',
		    text: formatMessage({
                        id: 'ftduino.output',
                        default: 'set output [OUTPUT] to [VALUE]',
                        description: 'set an ftDuino output'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        OUTPUT: {
                            type: ArgumentType.STRING,
                            menu: 'OUTPUT',
                            defaultValue: 'O1'
                        },
			VALUE: {
                            type: ArgumentType.STRING,
                            menu: 'ONOFFSTATE',
                            defaultValue: 'On'
                        }
                    }
		}
            ],
            menus: {
                ONOFFSTATE: [
		    {text: 'On', value:  '1'}, {text: 'Off', value: '0' }
		],
                INPUT: [
		    {text: 'I1', value: 'i1'}, {text: 'I2', value: 'i2'},
		    {text: 'I3', value: 'i3'}, {text: 'I4', value: 'i4'},
		    {text: 'I5', value: 'i5'}, {text: 'I6', value: 'i6'},
		    {text: 'I7', value: 'i7'}, {text: 'I8', value: 'i8'}
                ],
                OUTPUT: [
		    {text: 'O1', value: 'o1'}, {text: 'O2', value: 'o2'},
		    {text: 'O3', value: 'o3'}, {text: 'O4', value: 'o4'},
		    {text: 'O5', value: 'o5'}, {text: 'O6', value: 'o6'},
		    {text: 'O7', value: 'o7'}, {text: 'O8', value: 'o8'}
                ]
            }
        };
    }
    
    led (args) {
	new_state = Cast.toBoolean(args.VALUE);
	if(new_state != this.poll_state_led) {
	    this.poll_state_led = new_state;
	    this.poll_update_led = true;      // led needs update 
	}
    }
	
    input (args) {
	port = Cast.toNumber(args.INPUT.substr(1))-1;
	return this.poll_state_input[port];
    }
	
    output (args) {
	port = Cast.toNumber(args.OUTPUT.substr(1))-1;
	new_state = Cast.toBoolean(args.VALUE);
	if(new_state != this.poll_state_output[port]) {
	    this.poll_state_output[port] = new_state;
	    this.poll_update_output[port] = true;      // output needs update 
	}
    }

}
module.exports = Scratch3FtduinoBlocks;
