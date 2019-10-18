/*
  scratch3_ftduino/index.js

  WebUSB based ftDuino extension for scratch3

  (c) 2019 by Till Harbaum <till@harbaum.org>

  http://ftduino.de

  IoServer sketch versions supported:
  0.9.0 - inputs I1-I8, outputs O1-O8, motors M1-M4
  0.9.1 - -"-, counters C1-C4
*/

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');

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

const ftduinoDisconnectedIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CjxtZXRhZGF0YT4KPHJkZjpSREY+CjxjYzpXb3JrIHJkZjphYm91dD0iIj4KPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz4KPGRjOnRpdGxlLz4KPC9jYzpXb3JrPgo8L3JkZjpSREY+CjwvbWV0YWRhdGE+CjxzdHlsZT4uc3Qye2ZpbGw6cmVkfS5zdDN7ZmlsbDojZTBlMGUwfS5zdDR7ZmlsbDpub25lO3N0cm9rZTojNjY2O3N0cm9rZS13aWR0aDouNTtzdHJva2UtbWl0ZXJsaW1pdDoxMH08L3N0eWxlPgo8cGF0aCBkPSJtMjAuMjAyIDAuOTQ3NWMtMC43NDcwNyAwLTEuNTAzNCAwLjI5MDU2LTIuMTAxMiAwLjg5MDQ1bC0yLjI0MTIgMi4yNDk2LTEuNDk0Mi0xLjQ5OTctMi4xMDEyIDIuMTA4OSAzLjQ1NTIgMy40NjgxLTMuOTIyMSAzLjg4OTggMi4xMDEyIDIuMTA4OSAzLjg3NTQtMy45MzY3IDMuOTIyMSAzLjkzNjctMy45MjIxIDMuODg5OCAyLjEwMTIgMi4xMDg5IDMuODc1NC0zLjkzNjcgMy40NTUyIDMuNDY4MSAyLjEwMTItMi4xMDg5LTEuNDk0Mi0xLjQ5OTcgMi4yNDEyLTIuMjQ5NmMxLjE5NTQtMS4xOTk3IDEuMTk1NC0yLjk3MTIgMC00LjE3MTFsLTIuODQ4Mi0yLjg1ODggMy43MzU0LTMuNzQ5Mi0yLjEwMTItMi4xMDg5LTMuNzM1NCAzLjc0OTItMi44NDgyLTIuODU4OGMtMC41OTc2NS0wLjU5OTg4LTEuMzA3NC0wLjg5MDQ1LTIuMDU0NC0wLjg5MDQ1em0tMTUuNTQ5IDExLjM4OC0yLjEwMTIgMi4xMDg5IDEuNDk0MiAxLjQ5OTctMi4xMDEyIDIuMTA4OWMtMS4xOTUzIDEuMTk5Ny0xLjE5NTMgMi45NzEyIDAgNC4xNzExbDIuODQ4MiAyLjg1ODgtMy43MzU0IDMuNzQ5MiAyLjEwMTIgMi4xMDg5IDMuNzM1NC0zLjc0OTIgMi44NDgyIDIuODU4OGMxLjE5NTQgMS4xOTk3IDIuOTYwMiAxLjE5OTcgNC4xNTU2IDBsMi4xMDEyLTIuMTA4OSAxLjQ5NDIgMS40OTk3IDIuMTAxMi0yLjEwODl6IiBmaWxsPSIjZmZiNDE0IiBzdHJva2U9IiM5MTYzMDAiIHN0cm9rZS13aWR0aD0iMS40OTY5IiBzdHlsZT0idGV4dC1pbmRlbnQ6MDt0ZXh0LXRyYW5zZm9ybTpub25lIi8+Cjwvc3ZnPgo=';

const ftduinoConnectedIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CjxtZXRhZGF0YT4KPHJkZjpSREY+CjxjYzpXb3JrIHJkZjphYm91dD0iIj4KPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz4KPGRjOnRpdGxlLz4KPC9jYzpXb3JrPgo8L3JkZjpSREY+CjwvbWV0YWRhdGE+CjxzdHlsZT4uc3Qye2ZpbGw6cmVkfS5zdDN7ZmlsbDojZTBlMGUwfS5zdDR7ZmlsbDpub25lO3N0cm9rZTojNjY2O3N0cm9rZS13aWR0aDouNTtzdHJva2UtbWl0ZXJsaW1pdDoxMH08L3N0eWxlPgo8cGF0aCBkPSJtMjguODQyIDEuMDU2Ny01LjIzMDIgNS4yMzAyLTIuODQ4Ni0yLjg0ODZjLTEuMTk1NS0xLjE5NTUtMi45NjA3LTEuMTk1NS00LjE1NjEgMGwtMy43MzU4IDMuNzM1OC0xLjQ5NDMtMS40OTQzLTIuMTAxNCAyLjEwMTQgMTQuOTQzIDE0Ljk0MyAyLjEwMTQtMi4xMDE0LTEuNDk0My0xLjQ5NDMgMy43MzU4LTMuNzM1OGMxLjE5NTUtMS4xOTU1IDEuMTk1NS0yLjk2MDYgMC00LjE1NjFsLTIuODQ4Ni0yLjg0ODYgNS4yMzAyLTUuMjMwMnptLTIxLjIwMSA4LjM1ODktMi4xMDE0IDIuMTAxNCAxLjQ5NDMgMS40OTQzLTMuNTk1NyAzLjU5NTdjLTEuMTk1NSAxLjE5NTUtMS4xOTU1IDIuOTYwNyAwIDQuMTU2MWwyLjg0ODYgMi44NDg2LTUuMjMwMiA1LjIzMDIgMi4xMDE0IDIuMTAxNCA1LjIzMDItNS4yMzAyIDIuODQ4NiAyLjg0ODZjMS4xOTU1IDEuMTk1NSAyLjk2MDcgMS4xOTU1IDQuMTU2MSAwbDMuNTk1Ny0zLjU5NTcgMS40OTQzIDEuNDk0MyAyLjEwMTQtMi4xMDE0eiIgZmlsbD0iIzFhZmYxNCIgb3ZlcmZsb3c9InZpc2libGUiIHN0cm9rZT0iIzAyOTEwMCIgc3Ryb2tlLXdpZHRoPSIxLjQ5NDMiIHN0eWxlPSJ0ZXh0LWluZGVudDowO3RleHQtdHJhbnNmb3JtOm5vbmUiLz4KPC9zdmc+Cg==';

const ftduinoNoWebUSBIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CjxtZXRhZGF0YT4KPHJkZjpSREY+CjxjYzpXb3JrIHJkZjphYm91dD0iIj4KPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz4KPGRjOnRpdGxlLz4KPC9jYzpXb3JrPgo8L3JkZjpSREY+CjwvbWV0YWRhdGE+CjxzdHlsZT4uc3Qye2ZpbGw6cmVkfS5zdDN7ZmlsbDojZTBlMGUwfS5zdDR7ZmlsbDpub25lO3N0cm9rZTojNjY2O3N0cm9rZS13aWR0aDouNTtzdHJva2UtbWl0ZXJsaW1pdDoxMH08L3N0eWxlPgo8cGF0aCBkPSJtMjQuOTg3IDEuMjMwMi05LjA4MTggOS4yMDU5LTkuMDIyOC05LjE5ODItNS41NTg0IDUuNDgwOCA5LjA5OSA5LjI3NDYtOS4xNTggOS4yODIyIDUuNTQ1IDUuNDk2IDkuMDc5OS05LjIwNTkgOS4wODk1IDkuMjY1IDUuNTU4NC01LjQ4MDgtOS4xNjM3LTkuMzQxNCA5LjE1NjEtOS4yODIyeiIgY29sb3I9IiMwMDAwMDAiIGNvbG9yLXJlbmRlcmluZz0iYXV0byIgZG9taW5hbnQtYmFzZWxpbmU9ImF1dG8iIGZpbGw9IiNmZjE0MTQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgaW1hZ2UtcmVuZGVyaW5nPSJhdXRvIiBzaGFwZS1yZW5kZXJpbmc9ImF1dG8iIHNvbGlkLWNvbG9yPSIjMDAwMDAwIiBzdHJva2U9IiM3MDAwMDAiIHN0cm9rZS13aWR0aD0iMS40NjM4IiBzdHlsZT0iZm9udC1mZWF0dXJlLXNldHRpbmdzOm5vcm1hbDtmb250LXZhcmlhbnQtYWx0ZXJuYXRlczpub3JtYWw7Zm9udC12YXJpYW50LWNhcHM6bm9ybWFsO2ZvbnQtdmFyaWFudC1saWdhdHVyZXM6bm9ybWFsO2ZvbnQtdmFyaWFudC1udW1lcmljOm5vcm1hbDtmb250LXZhcmlhbnQtcG9zaXRpb246bm9ybWFsO2lzb2xhdGlvbjphdXRvO21peC1ibGVuZC1tb2RlOm5vcm1hbDtzaGFwZS1wYWRkaW5nOjA7dGV4dC1kZWNvcmF0aW9uLWNvbG9yOiMwMDAwMDA7dGV4dC1kZWNvcmF0aW9uLWxpbmU6bm9uZTt0ZXh0LWRlY29yYXRpb24tc3R5bGU6c29saWQ7dGV4dC1pbmRlbnQ6MDt0ZXh0LW9yaWVudGF0aW9uOm1peGVkO3RleHQtdHJhbnNmb3JtOm5vbmU7d2hpdGUtc3BhY2U6bm9ybWFsIi8+Cjwvc3ZnPgo=';

/**
 * Class for the ftDuino blocks in Scratch 3.0
 * @constructor
 */

const MINIMAL_VERSION = "0.9.0"
const COUNTER_VERSION = "0.9.1"

const STATE = { NOWEBUSB:0, DISCONNECTED:1, CONNECTED:2 };
const MODE = { UNSPEC:"unspecified",
	       SWITCH:"switch", VOLTAGE:"voltage", RESISTANCE:"resistance", COUNTER:"counter" };

const FTDUINO_BUTTON_ID = "ftDuino_connect_button";
const PARENT_CLASS = "controls_controls-container_2xinB"
const EXTENSION_ID = 'ftduino';

class Scratch3FtduinoBlocks {

    // ----- handle clicks onto the status icon next to the stop icon -----
    onConnectClicked() {
	this.manualConnect();
    }
    
    onDisconnectClicked() {
	this.port.disconnect();
	this.port = null;
	this.setButton(STATE.DISCONNECTED);
    }
    
    onNoWebUSBClicked() {
	alert("No ftDuino available:\n\n" + this.error_msg);
    }
	
    setButton(state, msg=null) {
	button = document.getElementById(FTDUINO_BUTTON_ID);
	if(button != undefined) {
	    if(state == STATE.NOWEBUSB) {
		this.error_msg = msg
		icon = ftduinoNoWebUSBIcon;
		title = "No WebUSB support available";
		handler = this.onNoWebUSBClicked.bind(this);
	    }	    
	    if(state == STATE.DISCONNECTED) {
		this.error_msg = ""
		icon = ftduinoDisconnectedIcon;
		title = "ftDuino not connected. Click icon to connect.";
		handler = this.onConnectClicked.bind(this);
	    }	    
	    if(state == STATE.CONNECTED) {
		this.error_msg = ""
		icon = ftduinoConnectedIcon;
		title = "ftDuino " + msg + " connected. Click icon to disconnect.";
		handler = this.onDisconnectClicked.bind(this);
	    }

	    // set button parameters
	    this.button_state = state;
	    button.src = icon;
	    button.title = title;
	    button.onclick = handler;
	}
    }
    
    addButton(initial = true) {
	//  check if the button already exists
	button = document.getElementById(FTDUINO_BUTTON_ID);

	if(button == undefined) {
	    x = document.getElementsByClassName(PARENT_CLASS);
	    if(x.length > 0) {
		hdrdiv = x[0];
	    
		img = document.createElement("IMG");
		img.classList.add("green-flag_green-flag_1kiAo");
		img.setAttribute("draggable", false);
		img.setAttribute("id", FTDUINO_BUTTON_ID);
		img.setAttribute("src", ftduinoNoWebUSBIcon);
		
		hdrdiv.appendChild(img);

		// the scratch3 gui will remove our button e.g. when the
		// language is being changed. We need to restore it then
		if(initial)
		    setInterval(() => this.addButton(false), 1000);
		else
		    this.setButton(this.button_state, this.error_msg);
	    } else
		alert("ftDuino: controls-container class not found!");
	}
    }
    
    constructor (runtime) {
	this.debug = false;
	this.port = null;
	this.version = null;
	this.state = STATE.NOWEBUSB;

	// place icon
	this.addButton();

	if(navigator.usb) {
	    this.textEncoder = new TextEncoder();   
	    console.log("WebUSB supported!");
	    navigator.usb.addEventListener('connect', event => {
		this.autoConnect();
	    });
	    
	    navigator.usb.addEventListener('disconnect', event => {
		this.port.disconnect();
		this.port = null;
		this.setButton(STATE.DISCONNECTED);
	    });

	    // try to autoconnect first
	    this.autoConnect();

	} else
	    this.setButton(STATE.NOWEBUSB, "No USB support on this browser. "+
			   "Please use Google Chrome or a related browser.");

        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

	// this.runtime.registerPeripheralExtension(EXTENSION_ID, this);
    }

    manualConnect() {
	serial.requestPort().then(selectedPort => {
            console.log("ftDuino: User selected:" + selectedPort);
            this.connect(selectedPort);
	}).catch(error => {
	    // don't bug user if he selected "cancel"
	    if((error instanceof DOMException) && (error.code == DOMException.NOT_FOUND_ERR))
		return;		
	    
            alert('Connection error: ' + error);
	});
    }

    // send a request to the ftDuino 
    ftdReq(req) {
	if (this.port == null) return Promise.reject(new Error('No port'));
        return this.port.send(this.textEncoder.encode(req));
    }

    // send a get request to the ftDuino
    ftdGet(item) {
	this.replyTimeout = setTimeout(() => {
	    this.ftdReq(JSON.stringify({ get: item }));
	}, 100);
	return this.ftdReq(JSON.stringify({ get: item }));
    }

    // send a set request to the ftDuino
    ftdSet(item) {
	return this.ftdReq(JSON.stringify({ set: item })).then(reply => {
	    return;
	});
    };
    
    ftdSetLed(state) {
	return this.ftdSet({ port: "led", value: state });
    }
    
    ftdSetMode(port,mode) {
	// check if requested mode is already set, never change mode for counter inputs
	if((port[0] == 'c') || (this.input_mode[port] == mode)) {
	    // console.log("mode already matches or counter");
	    return new Promise(resolve => { resolve(); });
	}

	this.input_mode[port] = mode;
	return this.ftdSet({ port: port, mode: mode });
    }

    // We want to make sure that only one request/reply transfer is in progress
    // when doing input requests. This may happen due to the fact that we cannot
    // block hats by yielding or the use of promises. Thus hats may interfere with
    // other hats and regular input operations. The wait for input promise blocks
    // as long as an input oeration is in progress.
    ftdWait4Input() {
	// no input in progress, resolve immediately and create "expect" object which
	// indicates that a new reuqest/reply operation is now in progress
	if(this.expect === undefined) {
	    // console.log("wait immediately ok");
	    this.expect = {};
	    return new Promise(resolve => { resolve(); });
	}

	return new Promise(resolve => {
	    // it must never happend that wait4input_resolve is set
	    // at this time as this means that the previous request has
	    // not been resolved.
	    if(this.expect.wait4input_resolve != undefined)
		console.log("COLLISION!");
	    
	    this.expect.wait4input_resolve = resolve;
	}).then(() => {
	    // we are done waiting for a transfer to end
	    this.expect = {};
	    return new Promise(resolve => { resolve(); });
	});
    }

    // once a reply is being received the reply timeout running in the
    // background needs to be cancelled
    cancelReplyTimeout() {
	if(this.replyTimeout != undefined) {
	    clearTimeout(this.replyTimeout);
	    this.replyTimeout = undefined;
	}	
    }
    
    // expect the reply for an input request
    ftdExpectInputReply(port) {
	return new Promise(resolve => {
	    // save information required by receiver to parse reply 
	    this.expect.resolve = resolve;
	    this.expect.entries = { "port": port };
	    this.expect.value = "value";
	});
    }
    
    ftdGetInput(port, mode) {
	parms = { "port": port };	
	if(mode == MODE.COUNTER) parms["type"] = "counter";

	// return the promise
	return this.ftdGet( parms ).then(() => {
	    return this.ftdExpectInputReply(port);
	});
    }
      
    ftdSetOutput(port,pwm)      { return this.ftdSet({ port: port, mode: "HI", value: pwm }); }
    ftdClearCounter(port)       { return this.ftdSet({ port: port }); }
    ftdSetMotor(port,dir,pwm)   { return this.ftdSet({ port: port, mode: dir, value: pwm }); }
   
    versionParse(ver) {
	lv = ver.split('.')
	lv.forEach(function(item, index) {
	    lv[index] = parseInt(item);
	});

	// fill up with trailing zeros if required (e.g. vesion 1.0 becomes 1.0.0)
	while(lv.length < 3)
	    lv.push(0);
	
	return lv;
    }

    versionCheck(ver) {
	s = null;
	refver = this.versionParse(ver);
	refver.forEach(function(item, index) {
	    if((s == null) && (this.version[index] > item)) s = true;
	    if((s == null) && (this.version[index] < item)) s = false;
	}.bind(this));

	if(s != null) return s;    
	return true; // equal
    }
    
    version_str() {
	return "V"+this.version.map(String).join('.');
    }
	
    ftdCheckVersionReply(ver) {
	// enable run button after successful connection
	console.log("ftDuino setup completed, version:", ver);

	this.input_count = 0;
	// try to parse the version
	this.version = this.versionParse(ver);

	if(this.versionCheck(MINIMAL_VERSION))
	    // make button indicate that we are now connected
	    this.setButton(STATE.CONNECTED, this.version_str());
	else
	    alert("Warning: Version check failed with " + this.version_str());
	    
	// some features require a certain sketch version
	this.counter_supported = this.versionCheck(COUNTER_VERSION);
	if(!this.counter_supported) console.log("Counters not supported by ftDuino");

	// current input modes is "switch requested", counters inputs have two values:
	// cX for the state of the counter input and cXc for the counter value
	this.input_mode = {
	    "i1":MODE.UNSPEC,   "i2":MODE.UNSPEC,   "i3":MODE.UNSPEC,   "i4":MODE.UNSPEC,
	    "i5":MODE.UNSPEC,   "i6":MODE.UNSPEC,   "i7":MODE.UNSPEC,   "i8":MODE.UNSPEC };
    }
    
    ftdExpectVersionReply(port) {
	return new Promise(resolve => {
	    // save information required by receiver to parse reply 
	    this.expect = {};
	    this.expect.resolve = resolve;
	    this.expect.entries = { };
	    this.expect.value = "version";
	});
    }
    
    ftdCheckVersion() {
	console.log("Checking for version");
	
	// send ESC (for parser reset)
	this.port.send(this.textEncoder.encode("\x1b"));
	
	return this.ftdGet( "version" ).then(() => {
	    return this.ftdExpectVersionReply();
	});
	
    }

    parse(msg) {
	// run result through json decoder
	result = JSON.parse(msg);

	if(this.expect !== undefined) {
	    this.cancelReplyTimeout();

	    // there _must_ be some entries in this.expect
	    if(this.expect.entries ===  undefined)
		console.log("No entries???");
	    else {
		// check if the result contains the expected keys
		var reply_ok = true;
		var keys = Object.keys(this.expect.entries);
		for(var i=0; i < keys.length ; i++)
		    if(result[keys[i]].toLowerCase() !==
		       this.expect.entries[keys[i]].toLowerCase()) {
			console.log("Missing expected reply parameter:",
				keys[i], ":", this.expect.entries["expect"][keys[i]], "-",msg);
			reply_ok = false;
		    }
	    
		if(result[this.expect.value] === undefined)
		    reply_ok = false;
	    
		if(reply_ok) {
		    this.expect.resolve(result[this.expect.value]);
		    if(this.expect.wait4input_resolve !== undefined) this.expect.wait4input_resolve();
		    this.expect = undefined;
		} else
		    console.log("reply expect failed");
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
            this.ftdCheckVersion().then(result => {
		this.ftdCheckVersionReply(result);
	    });
	    
            port.onReceive = data => {
		let textDecoder = new TextDecoder();
		// append all data received to buffer
		if(this.debug) console.log("RX:", textDecoder.decode(data));
		this.buffer = this.buffer + textDecoder.decode(data);

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
		if (ports.length == 0) {
		    console.log("ftDuino: No paired device found!");
		    this.setButton(STATE.DISCONNECTED);
		} else {
		    // at least one device found. Connect to first one
		    this.connect(ports[0]);
		}
            } ); 
	} catch (e) {
            alert("WebUSB not available: " + e);
	    this.setButton(STATE.NOWEBUSB, e);
	}
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: 'ftDuino',
            blockIconURI: blockIconURI,
	    docsURI: 'http://ftduino.de',
            blocks: [
		{
		    opcode: 'led',
		    text: 'LED [VALUE]',
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
		    text: '[INPUT]',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        INPUT: {
                            type: ArgumentType.STRING,
                            menu: 'INPUT_D',
                            defaultValue: 'i1'
                        }
                    }
		},
		{
		    opcode: 'output',
		    text: '[OUTPUT] [VALUE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        OUTPUT: {
                            type: ArgumentType.STRING,
                            menu: 'OUTPUT',
                            defaultValue: 'o1'
                        },
			VALUE: {
                            type: ArgumentType.STRING,
                            menu: 'ONOFFSTATE',
                            defaultValue: '1'
                        }
                    }
		},
		{
                    opcode: 'when_input',
                    text: 'when [INPUT]',
                    blockType: BlockType.HAT,
                    arguments: {
                        INPUT: {
                            type: ArgumentType.STRING,
                            menu: 'INPUT_D',
                            defaultValue: 'i1'
                        }
                    }
                },
		'---',
		{
		    opcode: 'input_analog',
		    text: '[INPUT] [MODE]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        INPUT: {
                            type: ArgumentType.STRING,
                            menu: 'INPUT',
                            defaultValue: 'i1'
			},
                        MODE: {
                            type: ArgumentType.STRING,
                            menu: 'MODE',
                            defaultValue: MODE.RESISTANCE
                        }
                    }
		},
		{
		    opcode: 'output_analog',
		    text: '[OUTPUT] [VALUE] %',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        OUTPUT: {
                            type: ArgumentType.STRING,
                            menu: 'OUTPUT',
                            defaultValue: 'o1'
                        },
			VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '100'
                        }
                    }
		},
		{
		    opcode: 'motor',
		    text: '[MOTOR] [DIR] [VALUE] %',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR',
                            defaultValue: 'm1'
                        },
                        DIR: {
                            type: ArgumentType.STRING,
                            menu: 'DIR',
                            defaultValue: 'left'
                        },
			VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '100'
                        }
                    }
		},
		{
		    opcode: 'motor_stop',
		    text: '[MOTOR] [STOPMODE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR',
                            defaultValue: 'm1'
                        },
                        STOPMODE: {
                            type: ArgumentType.STRING,
                            menu: 'STOPMODE',
                            defaultValue: 'off'
                        }
                    }
		},
		'---',
		{
		    opcode: 'input_counter',
		    text: '[INPUT]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        INPUT: {
                            type: ArgumentType.STRING,
                            menu: 'COUNTER',
                            defaultValue: 'c1'
			}
                    }
		},
		{
		    opcode: 'clear_counter',
		    text: 'Clear [INPUT]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        INPUT: {
                            type: ArgumentType.STRING,
                            menu: 'COUNTER',
                            defaultValue: 'c1'
			}
                    }
		}
            ],
            menus: {
                ONOFFSTATE: [
		    { text: 'On',  value: '1' },
		    { text: 'Off', value: '0' }
		],
                MODE: [
		    {text: '\u2126', value: MODE.RESISTANCE }, {text: 'mV', value: MODE.VOLTAGE }
		],
                INPUT: [
		    {text: 'I1', value: 'i1'}, {text: 'I2', value: 'i2'},
		    {text: 'I3', value: 'i3'}, {text: 'I4', value: 'i4'},
		    {text: 'I5', value: 'i5'}, {text: 'I6', value: 'i6'},
		    {text: 'I7', value: 'i7'}, {text: 'I8', value: 'i8'}
                ],
                COUNTER: [
		    {text: 'C1', value: 'c1'}, {text: 'C2', value: 'c2'},
		    {text: 'C3', value: 'c3'}, {text: 'C4', value: 'c4'}
                ],
                INPUT_D: [
		    {text: 'I1', value: 'i1'}, {text: 'I2', value: 'i2'},
		    {text: 'I3', value: 'i3'}, {text: 'I4', value: 'i4'},
		    {text: 'I5', value: 'i5'}, {text: 'I6', value: 'i6'},
		    {text: 'I7', value: 'i7'}, {text: 'I8', value: 'i8'},
		    {text: 'C1', value: 'c1'}, {text: 'C2', value: 'c2'},
		    {text: 'C3', value: 'c3'}, {text: 'C4', value: 'c4'}
                ],
                OUTPUT: [
		    {text: 'O1', value: 'o1'}, {text: 'O2', value: 'o2'},
		    {text: 'O3', value: 'o3'}, {text: 'O4', value: 'o4'},
		    {text: 'O5', value: 'o5'}, {text: 'O6', value: 'o6'},
		    {text: 'O7', value: 'o7'}, {text: 'O8', value: 'o8'}
                ],
                MOTOR: [
		    {text: 'M1', value: 'm1'}, {text: 'M2', value: 'm2'},
		    {text: 'M3', value: 'm3'}, {text: 'M4', value: 'm4'}
                ],
                DIR: [
		    {text: '\u21ba', value: 'left'}, {text: '\u21bb', value: 'right'}
                ],
                STOPMODE: [
		    {text: 'Stop', value: 'off'}, {text: 'Brake', value: 'brake'}
                ]
	    }		
        };
    }

    led (args, util) {
	return this.ftdSetLed(Cast.toBoolean(args.VALUE));
    }

    hatHandler() {
	// decrease current timeout counter. This is used since we are
	// not notified when a hat is being removed. This counter running
	// down means that the hat has probably been deleted fromt he workspace.
	this.hat.input[this.hat.next] = this.hat.input[this.hat.next] - 1;
	if(!this.hat.input[this.hat.next]) {
	    delete this.hat.input[this.hat.next];

	    // no more hats?
	    if(Object.keys(this.hat.input).length == 0) {
		clearInterval(this.hat.timer);
		this.hat = undefined;
		return;
	    }
	}

	// do the actual IO
	this.input( { "INPUT": this.hat.next}, null ).then(result => {
	    this.hat.state[this.hat.next] = result;

	    inputs = Object.keys(this.hat.input);
	    next_index = inputs.indexOf(this.hat.next);
	    if((next_index < 0) || (next_index+1 == inputs.length))
		this.hat.next = inputs[0];
	    else
		this.hat.next = inputs[next_index + 1];
	});
    }
    
    when_input (args, util) {
	// check if a hat handler is running
	if(!this.hat) {
	    this.hat = { }
	    this.hat.input = { }
	    this.hat.state = { }
	    this.hat.next = args.INPUT;

	    this.hat.timer = setInterval(this.hatHandler.bind(this), 50);
	}

	this.hat.input[args.INPUT] = 20;   // timeout counter to 1 sek

	return(this.hat.state[args.INPUT] == true);
    }
    
    input (args, util) {
	// input is like input_analog but implicitely assumes MODE.SWITCH
	return this.input_analog ({"MODE":MODE.SWITCH, "INPUT":args.INPUT}, util);
    }

    input_counter (args, util) {
	return this.input_analog({"MODE":MODE.COUNTER, "INPUT":args.INPUT}, util);
    }

    input_analog (args, util) {
	return this.ftdWait4Input().then(resolve =>  {
	    return this.ftdSetMode(args.INPUT, args.MODE).then(resolve => {
		return this.ftdGetInput(args.INPUT, args.MODE);
	    });
	});
    }

    clear_counter (args, util) {
	return this.ftdClearCounter(args.INPUT);
    }
	
    output (args, util) {
	return this.ftdSetOutput(args.OUTPUT, Cast.toBoolean(args.VALUE));
    }
    
    output_analog (args, util) {
	return this.ftdSetOutput(args.OUTPUT, Cast.toNumber(args.VALUE));
    }
    
    motor (args, util) {
	return this.ftdSetMotor(args.MOTOR, args.DIR, Cast.toNumber(args.VALUE));
    }
    
    motor_stop (args, util) {
	return this.ftdSetMotor(args.MOTOR, args.STOPMODE, 100);
    }
}

module.exports = Scratch3FtduinoBlocks;
