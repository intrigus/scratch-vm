/*
  scratch3_ftduino/index.js

  WebUSB based ftDuino extension for scratch3

  (c) 2019 by Till Harbaum <till@harbaum.org>

  http://ftduino.de

  IoServer sketch versions supported:
  0.9.0 - inputs I1-I8, outputs O1-O8, motors M1-M4
  0.9.1 - -"-, counters C1-C4
*/

const formatMessage = require('format-message');
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
const IOSTATE = { IDLE:0, MODE: 1, IN:2, OUT:3, REPLY:4, DONE:5 };
const MODE = { UNSPEC:"unspecified", SWITCH:"switch", VOLTAGE:"voltage", RESISTANCE:"resistance", COUNTER:"counter" };

const FTDUINO_BUTTON_ID = "ftDuino_connect_button";
const PARENT_CLASS = "controls_controls-container_2xinB"
const EXTENSION_ID = 'ftduino';

class Scratch3FtduinoBlocks {
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
	
    removeConnectButton() {
	button = document.getElementById(FTDUINO_BUTTON_ID);
	if(button != undefined)
	    button.parentNode.removeChild(button);
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
	    button.src = icon;
	    button.title = title;
	    button.onclick = handler;
	}
    }
    
    addButton() {
	//  check if the button already exists
	button = document.getElementById(FTDUINO_BUTTON_ID);

	if(button == undefined) {
	    console.log("ftDuino: Adding connect button");
	
	    x = document.getElementsByClassName(PARENT_CLASS);
	    if(x.length > 0) {
		hdrdiv = x[0];
	    
		img = document.createElement("IMG");
		img.classList.add("green-flag_green-flag_1kiAo");
		img.setAttribute("draggable", false);
		img.setAttribute("id", FTDUINO_BUTTON_ID);
		img.setAttribute("src", ftduinoNoWebUSBIcon);
		
		hdrdiv.appendChild(img);
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
	this.addButton(STATE.NOWEBUSB);

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

    // commands sent to ftDuino
    ftdSet(item) { this.ftdReq(JSON.stringify({ set: item })); };
    
    ftdSetLed(state)            { this.ftdSet({ port: "led", value: state }); }
    ftdSetOutput(port,pwm)      { this.ftdSet({ port: port, mode: "HI", value: pwm }); }
    ftdClearCounter(port)       { this.ftdSet({ port: port }); }
    ftdSetMotor(port,dir,pwm)   { this.ftdSet({ port: port, mode: dir, value: pwm }); }
    ftdSetMode(port,mode)       { this.ftdSet({ port: port, mode: mode }); }
   
    ftdReq(req) {
	if (this.port != null) {
            if(this.debug) console.log("TX:" + req);
            p = this.port.send(this.textEncoder.encode(req));
            p.then(
		function(val) {
		    // a out transfer is now done, a in transfer expects a reply
		    if(this.iostate == IOSTATE.OUT)
			this.iostate = IOSTATE.DONE;
		    else if(this.iostate == IOSTATE.IN)
			this.iostate = IOSTATE.REPLY;
		    else if(this.iostate == IOSTATE.MODE) {
			console.log("mode changed, requesting input for", this.iostate_port);
			this.iostate = IOSTATE.IN;
			// 
			this.ftdGet({ "port": this.iostate_port },
				    { "func": this.inputCallback.bind(this),
				      "value": "value",
				      "expect": { "port": this.iostate_port } });
		    }

		    if(this.debug)
			console.log("PROMISE fulfilled: "+ val.bytesWritten + " " + val.status);
		}.bind(this)
            );
	}
    }
    
    ftdGet(item = null, callback = null) {
	if(this.port == null) return;
	
	if(item) {
            this.callback = callback;
            this.get_item = item;
	}

	this.ftdReq(JSON.stringify({ get: this.get_item }));

	// schedule retransmission
	this.reply_timeout = setTimeout(this.ftdGet.bind(this), 1000);
    }

    parse_version(ver) {
	lv = ver.split('.')
	lv.forEach(function(item, index) {
	    lv[index] = parseInt(item);
	});

	// fill up with trailing zeros of required
	while(lv.length < 3)
	    lv.push(0);
	
	return lv;
    }

    check_version(ver) {
	s = null;
	refver = this.parse_version(ver);
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
	
    ftdCheckVersionCallback(ver) {
	// enable run button after successful connection
	console.log("ftDuino setup completed, version:", ver);

	// try to parse the version
	this.version = this.parse_version(ver);

	// some features require a certain sketch version
	if(!this.check_version(MINIMAL_VERSION))
	    alert("Warning: Version check failed with " + this.version_str());
	this.counter_supported = this.check_version(COUNTER_VERSION);
	if(!this.counter_supported) console.log("Counters not supported by ftDuino");
	
	// make button indicate that we are now connected
	this.setButton(STATE.CONNECTED, this.version_str());

	// no input hat active yet
	this.hat = { }
	this.hat.polling = null;
	this.hat.timeout = null;
	this.hat.pending = [ ]
	this.hat.state = { }
	
	// no IO pending yet
	this.iostate = IOSTATE.IDLE;

	// current input modes
	this.input_mode = {
	    "i1":MODE.UNSPEC, "i2":MODE.UNSPEC, "i3":MODE.UNSPEC, "i4":MODE.UNSPEC,
	    "i5":MODE.UNSPEC, "i6":MODE.UNSPEC, "i7":MODE.UNSPEC, "i8":MODE.UNSPEC,
	    "c1":MODE.UNSPEC, "c2":MODE.UNSPEC, "c3":MODE.UNSPEC, "c4":MODE.UNSPEC }
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
				    keys[i], ":", this.callback["expect"][keys[i]], "-",msg);
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
		// console.log("parse:", textDecoder.decode(data));
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

    // ------------------------ the following will only be used if ------------------
    // ------------------------ "showStatusButton: true," is set --------------------
    
    // connect () { console.log("connect"); } 
    // disconnect () { console.log("disconnect"); } 

    scan_done() {
	// scratch-gui/src/lib/libraries/extensions/index.jsx
	// scratch-gui/src/components/connection-modal/scanning-step.jsx
	// scratch-vm/src/io/bt.js

	// this reports a dummy device 1 second after the search has been triggered
	params = {}
	params.peripheralId = "ftDuino #1";
	params.name = "ftDuino #1";
	params.rssi = 12;
	
	this.devices = { };
	this.devices[params.peripheralId] = params;

	// without webusb support we'd like to report an error. Unfortunately
	// this results in some "scratchlink not installed/bluetooth disabled" message
	// which is totally useless for webusb
	if(this.state == STATE.NOWEBUSB) {
	    this.runtime.emit(this.runtime.constructor.PERIPHERAL_REQUEST_ERROR, {
	        message: `No WebUSB support!`,
		extensionId: EXTENSION_ID
	    });
	    return;
	}
	    
	this.runtime.emit(
            this.runtime.constructor.PERIPHERAL_LIST_UPDATE, this.devices);

	// alternally emit error	
	// this.runtime.emit(this.runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
    }
    
    scan () {
	// this should trigger some kind of search
	setTimeout(this.scan_done.bind(this), 1000);	
    }
    
    isConnected () {
	// scratch-vm/node_modules/scratch-blocks/core/flyout_extension_category_header.js
	console.log("isconnected");
	return true;
    }
	
    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: 'ftDuino',
            blockIconURI: blockIconURI,
//	    showStatusButton: true,             // enable this for the status button
	    docsURI: 'http://ftduino.de',
            blocks: [
		{
		    opcode: 'led',
		    text: formatMessage({
                        id: 'ftduino.led',
                        default: 'LED [VALUE]',  // \u26ef
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
                        default: '[INPUT]',
                        description: 'read an ftDuino input'
                    }),
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
		    text: formatMessage({
                        id: 'ftduino.output',
                        default: '[OUTPUT] [VALUE]',
                        description: 'set an ftDuino output'
                    }),
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
                    text: formatMessage({
                        id: 'ftduino.when_input',
                        default: 'when [INPUT]',
                        description: 'when an input is true'
                    }),
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
		    text: formatMessage({
                        id: 'ftduino.input_analog',
                        default: '[INPUT] [MODE]',
                        description: 'read an ftDuino input'
                    }),
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
		    text: formatMessage({
                        id: 'ftduino.output_analog',
                        default: '[OUTPUT] [VALUE] %',
                        description: 'set an ftDuino output'
                    }),
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
		    text: formatMessage({
                        id: 'ftduino.motor',
                        default: '[MOTOR] [DIR] [VALUE] %',
                        description: 'set an ftDuino motor output'
                    }),
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
		    text: formatMessage({
                        id: 'ftduino.motor_stop',
                        default: '[MOTOR] [STOPMODE]',
                        description: 'stop an ftDuino motor output'
                    }),
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
		    text: formatMessage({
                        id: 'ftduino.input_counter',
                        default: '[INPUT]',
                        description: 'read an ftDuino counter'
                    }),
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
		    text: formatMessage({
                        id: 'ftduino.clear_counter',
                        default: 'Clear [INPUT]',
                        description: 'clear an ftDuino counter'
                    }),
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
		    { text: formatMessage({id: 'ftduino.on', default: 'On' }), value: '1'},
		    { text: formatMessage({id: 'ftduino.off',default: 'Off'}), value: '0' }
		],
                MODE: [
		    {text: '\u2126', value: MODE.RESISTANCE }, {text: 'V', value: MODE.VOLTAGE }
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
            },
            translation_map: {
		en: {
		    'extensionName': 'ftDuino (en)',
                    'input': '[INPUT]',
                    'ftduino.input': '[INPUT]',
		},
		de: {
		    'extensionName': 'ftDuino (de)',
                    'input': '[INPUT]',
                    'ftduino.input': '[INPUT]',
		}
	    }		
        };
    }
    
    handle_io(util) {  // handle all io commands in progress
	if((this.iostate == IOSTATE.IN) ||
	   (this.iostate == IOSTATE.OUT) ||
	   (this.iostate == IOSTATE.MODE) ||
	   (this.iostate == IOSTATE.REPLY))
	    util.yield();
	else if(this.iostate == IOSTATE.DONE) {
	    this.iostate = IOSTATE.IDLE;

	    // hat requests pending but neither a timeout
	    // in progress nor a transfer? -> Immediate transfer
	    if((this.hat.pending.length > 0) &&
	       (this.hat.timeout == null) &&
	       (this.hat.polling == null))
		this.hat_input_poll();
	}
    }
    
    led (args, util) {
	// check if ftDuino is connected at all
	if(this.port == null) return;

	if(this.iostate == IOSTATE.IDLE) {
	    this.iostate = IOSTATE.OUT;
	    this.ftdSetLed(Cast.toBoolean(args.VALUE));
	}
	this.handle_io(util);
    }
	
    inputCallback (v) {
	if(this.input_mode[this.iostate_port] == MODE.SWITCH)
	    this.input_result = Cast.toBoolean(v);
	else
	    this.input_result = Cast.toNumber(v);
	
	this.iostate = IOSTATE.DONE;
    }

    hat_input_callback(v) {
	this.hat.state[this.hat.polling] = Cast.toBoolean(v);
	this.hat.polling = null;
	
	// restart callback if there's something to request
	if((this.hat.pending.length > 0) && (this.hat.timeout == null)) 
	    this.hat.timeout = setTimeout(this.hat_input_poll.bind(this), 50);
    }
	
    hat_input_poll() {
	this.hat.timeout = null;
	 
	if(this.hat.pending.length > 0) {
	    // don't interrupt any ongoing transfer
	    if(this.iostate != IOSTATE.IDLE)
		return;
	    
	    this.hat.polling = this.hat.pending.shift();

	    // trigger actual input
	    this.ftdGet({ "port": this.hat.polling },
			{ "func": this.hat_input_callback.bind(this),
			  "value": "value",
			  "expect": { "port": this.hat.polling } });
	}
    }
    
    when_input (args, util) {
	// add this request to queue if it's not already in there
	if(!this.hat.pending.includes(args.INPUT))
	    this.hat.pending.push(args.INPUT);

	// schedule timeout if there's no timeout and no input operation in progress
	if((this.hat.timeout == null) && (this.hat.polling == null))
	    this.hat.timeout = setTimeout(this.hat_input_poll.bind(this), 50);

	// if we have no results for this input yet, then just return false
	if(this.hat.state[args.INPUT] == undefined)
	    return false;

	// we do have a result -> return it
	return this.hat.state[args.INPUT];
    }
	
    input (args, util) {
	// input is like input_analog but implicitely assumes MODE.SWITCH
	args.MODE = MODE.SWITCH;
	return this.input_analog (args, util);
    }
	
    input_counter (args, util) {
	args.MODE = MODE.COUNTER;
	return this.input_analog (args, util);
    }
	
    input_analog (args, util) {
	if(this.port == null) return false;	    // check if ftDuino is connected at all
	if(this.hat.polling != null) util.yield();  // wait for possibly ongoing polling to end
	
	if(this.iostate == IOSTATE.IDLE) {
	    if(args.INPUT.toLowerCase()[0] == 'c') {
		// counter c1-c4
		this.iostate = IOSTATE.IN;
		this.iostate_port = args.INPUT;
		this.input_mode[args.INPUT] = args.MODE;  // switch = digital input
		this.ftdGet({ "port": args.INPUT,
			      "type": (args.MODE == MODE.SWITCH)?"state":"counter" },
			    { "func": this.inputCallback.bind(this),
			      "value": "value",
			      "expect": { "port": args.INPUT } });
		if(!this.counter_supported)
		    alert("Counters not supported, please update the IoServer sketch");
	    } else {
		// input i1-i8
		if(args.MODE != this.input_mode[args.INPUT]) {
		    console.log("change mode for", args.INPUT, "from",
				this.input_mode[args.INPUT], "to", args.MODE);

		    this.iostate = IOSTATE.MODE;
		    this.iostate_port = args.INPUT;
		    this.input_mode[args.INPUT] = args.MODE;
		    this.ftdSetMode(args.INPUT, args.MODE);
		} else {
		    this.iostate = IOSTATE.IN;
		    this.iostate_port = args.INPUT;
		    this.ftdGet({ "port": args.INPUT },
				{ "func": this.inputCallback.bind(this),
				  "value": "value",
				  "expect": { "port": args.INPUT } });
		}
	    }
	}
	this.handle_io(util);

	return this.input_result;
    }

    clear_counter (args, util) {
	if(this.port == null) return;	            // check if ftDuino is connected at all
	if(this.hat.polling != null) util.yield();  // wait for possibly ongoing polling to end
	
	if(this.iostate == IOSTATE.IDLE) {
	    this.iostate = IOSTATE.OUT;
	    this.ftdClearCounter(args.INPUT);
	}
	this.handle_io(util);
    }
	
    output (args, util) {
	if(this.port == null) return;	            // check if ftDuino is connected at all
	if(this.hat.polling != null) util.yield();  // wait for possibly ongoing polling to end

	if(this.iostate == IOSTATE.IDLE) {
	    this.iostate = IOSTATE.OUT;
	    this.ftdSetOutput(args.OUTPUT, Cast.toBoolean(args.VALUE));
	}
	this.handle_io(util);
    }
    
    output_analog (args, util) {
	if(this.port == null) return;	            // check if ftDuino is connected at all
	if(this.hat.polling != null) util.yield();  // wait for possibly ongoing polling to end

	if(this.iostate == IOSTATE.IDLE) {
	    this.iostate = IOSTATE.OUT;
	    this.ftdSetOutput(args.OUTPUT, Cast.toNumber(args.VALUE));
	}
	this.handle_io(util);
    }
    
    motor (args, util) {
	if(this.port == null) return;	            // check if ftDuino is connected at all
	if(this.hat.polling != null) util.yield();  // wait for possibly ongoing polling to end

	if(this.iostate == IOSTATE.IDLE) {
	    this.iostate = IOSTATE.OUT;
	    this.ftdSetMotor(args.MOTOR, args.DIR, Cast.toNumber(args.VALUE));
	}
	this.handle_io(util);
    }
    
    motor_stop (args, util) {
	if(this.port == null) return;	            // check if ftDuino is connected at all
	if(this.hat.polling != null) util.yield();  // wait for possibly ongoing polling to end

	if(this.iostate == IOSTATE.IDLE) {
	    this.iostate = IOSTATE.OUT;
	    this.ftdSetMotor(args.MOTOR, args.STOPMODE, 100);
	}
	this.handle_io(util);
    }
}

module.exports = Scratch3FtduinoBlocks;
