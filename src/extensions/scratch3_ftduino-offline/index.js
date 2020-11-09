/*
  scratch3_ftduino-offline/index.js

  Extension that adds offline support to the ftduino extension.

  (c) 2019 by Till Harbaum <till@harbaum.org>
  (c) 2019 by TBD

  http://ftduino.de
  TBD

*/
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const Runtime = require('../../engine/runtime');
const Serialization = require('../../serialization/sb3');
const Button = require('./button');
const Meter = require('./meter');



/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CjxtZXRhZGF0YT4KPHJkZjpSREY+CjxjYzpXb3JrIHJkZjphYm91dD0iIj4KPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz4KPGRjOnRpdGxlLz4KPC9jYzpXb3JrPgo8L3JkZjpSREY+CjwvbWV0YWRhdGE+CjxzdHlsZT4uc3Qye2ZpbGw6cmVkfS5zdDN7ZmlsbDojZTBlMGUwfS5zdDR7ZmlsbDpub25lO3N0cm9rZTojNjY2O3N0cm9rZS13aWR0aDouNTtzdHJva2UtbWl0ZXJsaW1pdDoxMH08L3N0eWxlPgo8ZyB0cmFuc2Zvcm09Im1hdHJpeCguMTI1MjYgMCAwIC4xMjUyNiAtNTEuNTcyIC0xMC40ODkpIj4KPHJlY3QgeD0iNDE3LjQ4IiB5PSI4OS40OTkiIHdpZHRoPSIzMDguMjciIGhlaWdodD0iMzA4LjI3IiBmaWxsPSIjYjliOWI5IiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxMC42MyIvPgo8cmVjdCB4PSI0MjYuMTMiIHk9Ijk4LjE5OCIgd2lkdGg9IjI4OS43MyIgaGVpZ2h0PSIyODkuNzMiIGZpbGw9IiNhNmQ5YWIiLz4KPHJlY3QgeD0iNTYxLjc0IiB5PSI5Ny44OTEiIHdpZHRoPSIzNS40MzMiIGhlaWdodD0iMzUuNDMzIi8+CjxyZWN0IHg9IjQ3OC43OCIgeT0iOTguMTQxIiB3aWR0aD0iMzEuMTgxIiBoZWlnaHQ9IjMyLjAwOCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iLjcwODY2Ii8+CjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQxMi40MyAtNjYwLjEzKSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMjUuMzI5IiBjeT0iMTAzNS4yIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iMjUuMzI5IiBjeT0iMTAwOC43IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iMjUuMzI5IiBjeT0iOTgyLjA4IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iMjUuMzI5IiBjeT0iOTU1LjUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIGN4PSIyNS4zMjkiIGN5PSI5MjguOTMiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIGN4PSIyNS4zMjkiIGN5PSI5MDIuMzUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIGN4PSIyNS4zMjkiIGN5PSI4NzUuNzgiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIGN4PSIyNS4zMjkiIGN5PSI4NDkuMiIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgY3g9Ijc4LjQ3OCIgY3k9IjEwMzUuMiIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgY3g9IjUxLjkwNCIgY3k9IjEwMzUuMiIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgY3g9IjUxLjkwNCIgY3k9IjEwMDguNyIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgY3g9IjUxLjkwNCIgY3k9Ijk4Mi4wOCIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgY3g9IjUxLjkwNCIgY3k9Ijk1NS41IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iNTEuOTA0IiBjeT0iOTI4LjkzIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iNTEuOTA0IiBjeT0iOTAyLjM1IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iNTEuOTA0IiBjeT0iODc1Ljc4IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSBjeD0iNTEuOTA0IiBjeT0iODQ5LjIiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjkxLjA4IiBjeT0iMTAzNS4yIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI5MS4wOCIgY3k9IjEwMDguNyIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgdHJhbnNmb3JtPSJzY2FsZSgtMSwxKSIgY3g9Ii0yOTEuMDgiIGN5PSI5ODIuMDgiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjkxLjA4IiBjeT0iOTU1LjUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjkxLjA4IiBjeT0iOTI4LjkzIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI5MS4wOCIgY3k9IjkwMi4zNSIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgdHJhbnNmb3JtPSJzY2FsZSgtMSwxKSIgY3g9Ii0yOTEuMDgiIGN5PSI4NzUuNzgiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjkxLjA4IiBjeT0iODQ5LjIiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjM3LjkzIiBjeT0iMTAzNS4yIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI2NC41IiBjeT0iMTAzNS4yIiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI2NC41IiBjeT0iMTAwOC43IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI2NC41IiBjeT0iOTgyLjA4IiByPSI3LjA0NjkiIGZpbGw9IiNiN2I3YjciIHN0cm9rZT0iIzQ5NDk0OSIgc3Ryb2tlLXdpZHRoPSIxLjc3MTciLz4KPGNpcmNsZSB0cmFuc2Zvcm09InNjYWxlKC0xLDEpIiBjeD0iLTI2NC41IiBjeT0iOTU1LjUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjY0LjUiIGN5PSI5MjguOTMiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjY0LjUiIGN5PSI5MDIuMzUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjY0LjUiIGN5PSI4NzUuNzgiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjY0LjUiIGN5PSI4NDkuMiIgcj0iNy4wNDY5IiBmaWxsPSIjYjdiN2I3IiBzdHJva2U9IiM0OTQ5NDkiIHN0cm9rZS13aWR0aD0iMS43NzE3Ii8+CjxjaXJjbGUgdHJhbnNmb3JtPSJzY2FsZSgtMSwxKSIgY3g9Ii0yNjguMDUiIGN5PSI3NzEuMjUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGN4PSItMjM5LjciIGN5PSI3NzEuMjUiIHI9IjcuMDQ2OSIgZmlsbD0iI2I3YjdiNyIgc3Ryb2tlPSIjNDk0OTQ5IiBzdHJva2Utd2lkdGg9IjEuNzcxNyIvPgo8Y2lyY2xlIGN4PSIzNy43MyIgY3k9Ijc3MS4yNSIgcj0iNi43MzIzIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iLjcwODY2Ii8+CjwvZz4KPHJlY3QgeD0iNTQ0LjQ5IiB5PSIzNDUuODMiIHdpZHRoPSI1NS45ODQiIGhlaWdodD0iMzQuNzI0IiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyLjEyNiIvPgo8Y2lyY2xlIGN4PSI1MjQuNzMiIGN5PSIxMTIuNDMiIHI9IjYuNDIwOSIgZmlsbD0iIzBmZjQwMCIgc3Ryb2tlPSIjMDA1NDA3IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41OTQ3Ii8+CjxjaXJjbGUgY3g9IjU0NC42OSIgY3k9IjExMi4zOSIgcj0iNi40NjAyIiBmaWxsPSIjZmY2MDYwIiBzdHJva2U9IiM5YTAwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjYwNDQiLz4KPC9nPgo8L3N2Zz4K';

const ftduinoDisconnectedIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CjxtZXRhZGF0YT4KPHJkZjpSREY+CjxjYzpXb3JrIHJkZjphYm91dD0iIj4KPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz4KPGRjOnRpdGxlLz4KPC9jYzpXb3JrPgo8L3JkZjpSREY+CjwvbWV0YWRhdGE+CjxzdHlsZT4uc3Qye2ZpbGw6cmVkfS5zdDN7ZmlsbDojZTBlMGUwfS5zdDR7ZmlsbDpub25lO3N0cm9rZTojNjY2O3N0cm9rZS13aWR0aDouNTtzdHJva2UtbWl0ZXJsaW1pdDoxMH08L3N0eWxlPgo8cGF0aCBkPSJtMjAuMjAyIDAuOTQ3NWMtMC43NDcwNyAwLTEuNTAzNCAwLjI5MDU2LTIuMTAxMiAwLjg5MDQ1bC0yLjI0MTIgMi4yNDk2LTEuNDk0Mi0xLjQ5OTctMi4xMDEyIDIuMTA4OSAzLjQ1NTIgMy40NjgxLTMuOTIyMSAzLjg4OTggMi4xMDEyIDIuMTA4OSAzLjg3NTQtMy45MzY3IDMuOTIyMSAzLjkzNjctMy45MjIxIDMuODg5OCAyLjEwMTIgMi4xMDg5IDMuODc1NC0zLjkzNjcgMy40NTUyIDMuNDY4MSAyLjEwMTItMi4xMDg5LTEuNDk0Mi0xLjQ5OTcgMi4yNDEyLTIuMjQ5NmMxLjE5NTQtMS4xOTk3IDEuMTk1NC0yLjk3MTIgMC00LjE3MTFsLTIuODQ4Mi0yLjg1ODggMy43MzU0LTMuNzQ5Mi0yLjEwMTItMi4xMDg5LTMuNzM1NCAzLjc0OTItMi44NDgyLTIuODU4OGMtMC41OTc2NS0wLjU5OTg4LTEuMzA3NC0wLjg5MDQ1LTIuMDU0NC0wLjg5MDQ1em0tMTUuNTQ5IDExLjM4OC0yLjEwMTIgMi4xMDg5IDEuNDk0MiAxLjQ5OTctMi4xMDEyIDIuMTA4OWMtMS4xOTUzIDEuMTk5Ny0xLjE5NTMgMi45NzEyIDAgNC4xNzExbDIuODQ4MiAyLjg1ODgtMy43MzU0IDMuNzQ5MiAyLjEwMTIgMi4xMDg5IDMuNzM1NC0zLjc0OTIgMi44NDgyIDIuODU4OGMxLjE5NTQgMS4xOTk3IDIuOTYwMiAxLjE5OTcgNC4xNTU2IDBsMi4xMDEyLTIuMTA4OSAxLjQ5NDIgMS40OTk3IDIuMTAxMi0yLjEwODl6IiBmaWxsPSIjZmZiNDE0IiBzdHJva2U9IiM5MTYzMDAiIHN0cm9rZS13aWR0aD0iMS40OTY5IiBzdHlsZT0idGV4dC1pbmRlbnQ6MDt0ZXh0LXRyYW5zZm9ybTpub25lIi8+Cjwvc3ZnPgo=';

const ftduinoConnectedIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CjxtZXRhZGF0YT4KPHJkZjpSREY+CjxjYzpXb3JrIHJkZjphYm91dD0iIj4KPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz4KPGRjOnRpdGxlLz4KPC9jYzpXb3JrPgo8L3JkZjpSREY+CjwvbWV0YWRhdGE+CjxzdHlsZT4uc3Qye2ZpbGw6cmVkfS5zdDN7ZmlsbDojZTBlMGUwfS5zdDR7ZmlsbDpub25lO3N0cm9rZTojNjY2O3N0cm9rZS13aWR0aDouNTtzdHJva2UtbWl0ZXJsaW1pdDoxMH08L3N0eWxlPgo8cGF0aCBkPSJtMjguODQyIDEuMDU2Ny01LjIzMDIgNS4yMzAyLTIuODQ4Ni0yLjg0ODZjLTEuMTk1NS0xLjE5NTUtMi45NjA3LTEuMTk1NS00LjE1NjEgMGwtMy43MzU4IDMuNzM1OC0xLjQ5NDMtMS40OTQzLTIuMTAxNCAyLjEwMTQgMTQuOTQzIDE0Ljk0MyAyLjEwMTQtMi4xMDE0LTEuNDk0My0xLjQ5NDMgMy43MzU4LTMuNzM1OGMxLjE5NTUtMS4xOTU1IDEuMTk1NS0yLjk2MDYgMC00LjE1NjFsLTIuODQ4Ni0yLjg0ODYgNS4yMzAyLTUuMjMwMnptLTIxLjIwMSA4LjM1ODktMi4xMDE0IDIuMTAxNCAxLjQ5NDMgMS40OTQzLTMuNTk1NyAzLjU5NTdjLTEuMTk1NSAxLjE5NTUtMS4xOTU1IDIuOTYwNyAwIDQuMTU2MWwyLjg0ODYgMi44NDg2LTUuMjMwMiA1LjIzMDIgMi4xMDE0IDIuMTAxNCA1LjIzMDItNS4yMzAyIDIuODQ4NiAyLjg0ODZjMS4xOTU1IDEuMTk1NSAyLjk2MDcgMS4xOTU1IDQuMTU2MSAwbDMuNTk1Ny0zLjU5NTcgMS40OTQzIDEuNDk0MyAyLjEwMTQtMi4xMDE0eiIgZmlsbD0iIzFhZmYxNCIgb3ZlcmZsb3c9InZpc2libGUiIHN0cm9rZT0iIzAyOTEwMCIgc3Ryb2tlLXdpZHRoPSIxLjQ5NDMiIHN0eWxlPSJ0ZXh0LWluZGVudDowO3RleHQtdHJhbnNmb3JtOm5vbmUiLz4KPC9zdmc+Cg==';

const ftduinoNoWebUSBIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CjxtZXRhZGF0YT4KPHJkZjpSREY+CjxjYzpXb3JrIHJkZjphYm91dD0iIj4KPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz4KPGRjOnRpdGxlLz4KPC9jYzpXb3JrPgo8L3JkZjpSREY+CjwvbWV0YWRhdGE+CjxzdHlsZT4uc3Qye2ZpbGw6cmVkfS5zdDN7ZmlsbDojZTBlMGUwfS5zdDR7ZmlsbDpub25lO3N0cm9rZTojNjY2O3N0cm9rZS13aWR0aDouNTtzdHJva2UtbWl0ZXJsaW1pdDoxMH08L3N0eWxlPgo8cGF0aCBkPSJtMjQuOTg3IDEuMjMwMi05LjA4MTggOS4yMDU5LTkuMDIyOC05LjE5ODItNS41NTg0IDUuNDgwOCA5LjA5OSA5LjI3NDYtOS4xNTggOS4yODIyIDUuNTQ1IDUuNDk2IDkuMDc5OS05LjIwNTkgOS4wODk1IDkuMjY1IDUuNTU4NC01LjQ4MDgtOS4xNjM3LTkuMzQxNCA5LjE1NjEtOS4yODIyeiIgY29sb3I9IiMwMDAwMDAiIGNvbG9yLXJlbmRlcmluZz0iYXV0byIgZG9taW5hbnQtYmFzZWxpbmU9ImF1dG8iIGZpbGw9IiNmZjE0MTQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgaW1hZ2UtcmVuZGVyaW5nPSJhdXRvIiBzaGFwZS1yZW5kZXJpbmc9ImF1dG8iIHNvbGlkLWNvbG9yPSIjMDAwMDAwIiBzdHJva2U9IiM3MDAwMDAiIHN0cm9rZS13aWR0aD0iMS40NjM4IiBzdHlsZT0iZm9udC1mZWF0dXJlLXNldHRpbmdzOm5vcm1hbDtmb250LXZhcmlhbnQtYWx0ZXJuYXRlczpub3JtYWw7Zm9udC12YXJpYW50LWNhcHM6bm9ybWFsO2ZvbnQtdmFyaWFudC1saWdhdHVyZXM6bm9ybWFsO2ZvbnQtdmFyaWFudC1udW1lcmljOm5vcm1hbDtmb250LXZhcmlhbnQtcG9zaXRpb246bm9ybWFsO2lzb2xhdGlvbjphdXRvO21peC1ibGVuZC1tb2RlOm5vcm1hbDtzaGFwZS1wYWRkaW5nOjA7dGV4dC1kZWNvcmF0aW9uLWNvbG9yOiMwMDAwMDA7dGV4dC1kZWNvcmF0aW9uLWxpbmU6bm9uZTt0ZXh0LWRlY29yYXRpb24tc3R5bGU6c29saWQ7dGV4dC1pbmRlbnQ6MDt0ZXh0LW9yaWVudGF0aW9uOm1peGVkO3RleHQtdHJhbnNmb3JtOm5vbmU7d2hpdGUtc3BhY2U6bm9ybWFsIi8+Cjwvc3ZnPgo=';

const ftduinoUploadSketchIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgo8c3ZnCiAgICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgICB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICAgeG1sbnM6bnMxPSJodHRwOi8vc296aS5iYWllcm91Z2UuZnIiCiAgICB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIKICAgIGlkPSJzdmcyIgogICAgc29kaXBvZGk6ZG9jbmFtZT0idXAuc3ZnIgogICAgdmlld0JveD0iMCAwIDE2IDE2IgogICAgdmVyc2lvbj0iMS4xIgogICAgaW5rc2NhcGU6dmVyc2lvbj0iMC40OC4wIHI5NjU0IgogID4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgIGlkPSJiYXNlIgogICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICAgaW5rc2NhcGU6d2luZG93LXk9IjExOTIiCiAgICAgIGZpdC1tYXJnaW4tbGVmdD0iMCIKICAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI3NDgiCiAgICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgICAgIGlua3NjYXBlOnpvb209IjIuOCIKICAgICAgaW5rc2NhcGU6d2luZG93LXg9IjYzMiIKICAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgICBib3JkZXJvcGFjaXR5PSIxLjAiCiAgICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9ImxheWVyMSIKICAgICAgaW5rc2NhcGU6Y3g9IjExNy4wNTYzOCIKICAgICAgaW5rc2NhcGU6Y3k9Ii00MC4wOTU4MyIKICAgICAgZml0LW1hcmdpbi10b3A9IjAiCiAgICAgIGZpdC1tYXJnaW4tcmlnaHQ9IjAiCiAgICAgIGZpdC1tYXJnaW4tYm90dG9tPSIwIgogICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjEyNzciCiAgICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwLjAiCiAgICAgIGlua3NjYXBlOmRvY3VtZW50LXVuaXRzPSJweCIKICAvPgogIDxnCiAgICAgIGlkPSJsYXllcjEiCiAgICAgIGlua3NjYXBlOmxhYmVsPSJMYXllciAxIgogICAgICBpbmtzY2FwZTpncm91cG1vZGU9ImxheWVyIgogICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzUuMzk5IC01ODIuOTEpIgogICAgPgogICAgPHBhdGgKICAgICAgICBpZD0icmVjdDI5ODUtNiIKICAgICAgICBzdHlsZT0iZmlsbDojMDAwMDAwIgogICAgICAgIGQ9Im00MC44MzYgNTk4Ljkxdi02Ljc1aC01LjQzNzVsNC00LjYyNSA0LTQuNjI1IDQgNC42MjUgNCA0LjYyNWgtNS4wOTM4djYuNzVoLTUuNDY4OHoiCiAgICAgICAgaW5rc2NhcGU6ZXhwb3J0LXlkcGk9IjkwIgogICAgICAgIGlua3NjYXBlOmV4cG9ydC1maWxlbmFtZT0iQzpcVXNlcnNcSm9zaHVhXERvY3VtZW50c1xWaXN1YWwgU3R1ZGlvIDIwMTBcUHJvamVjdHNcVGhyZWUgb24gVGhyZWUgUm91bmQgUm9iaW4gU2NoZWR1bGVyXGFycm93dXAucG5nIgogICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICAgaW5rc2NhcGU6ZXhwb3J0LXhkcGk9IjkwIgogICAgLz4KICA8L2cKICA+CiAgPG1ldGFkYXRhCiAgICA+CiAgICA8cmRmOlJERgogICAgICA+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgPgogICAgICAgIDxkYzpmb3JtYXQKICAgICAgICAgID5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQKICAgICAgICA+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIKICAgICAgICAvPgogICAgICAgIDxjYzpsaWNlbnNlCiAgICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvcHVibGljZG9tYWluLyIKICAgICAgICAvPgogICAgICAgIDxkYzpwdWJsaXNoZXIKICAgICAgICAgID4KICAgICAgICAgIDxjYzpBZ2VudAogICAgICAgICAgICAgIHJkZjphYm91dD0iaHR0cDovL29wZW5jbGlwYXJ0Lm9yZy8iCiAgICAgICAgICAgID4KICAgICAgICAgICAgPGRjOnRpdGxlCiAgICAgICAgICAgICAgPk9wZW5jbGlwYXJ0PC9kYzp0aXRsZQogICAgICAgICAgICA+CiAgICAgICAgICA8L2NjOkFnZW50CiAgICAgICAgICA+CiAgICAgICAgPC9kYzpwdWJsaXNoZXIKICAgICAgICA+CiAgICAgICAgPGRjOnRpdGxlCiAgICAgICAgICA+VXAgQXJyb3c8L2RjOnRpdGxlCiAgICAgICAgPgogICAgICAgIDxkYzpkYXRlCiAgICAgICAgICA+MjAxMS0wOC0xMlQxNDozOTowMjwvZGM6ZGF0ZQogICAgICAgID4KICAgICAgICA8ZGM6ZGVzY3JpcHRpb24KICAgICAgICAvPgogICAgICAgIDxkYzpzb3VyY2UKICAgICAgICAgID5odHRwczovL29wZW5jbGlwYXJ0Lm9yZy9kZXRhaWwvMTU0OTY5L3VwLWFycm93LWJ5LW1pZ2h0eW1hbjwvZGM6c291cmNlCiAgICAgICAgPgogICAgICAgIDxkYzpjcmVhdG9yCiAgICAgICAgICA+CiAgICAgICAgICA8Y2M6QWdlbnQKICAgICAgICAgICAgPgogICAgICAgICAgICA8ZGM6dGl0bGUKICAgICAgICAgICAgICA+bWlnaHR5bWFuPC9kYzp0aXRsZQogICAgICAgICAgICA+CiAgICAgICAgICA8L2NjOkFnZW50CiAgICAgICAgICA+CiAgICAgICAgPC9kYzpjcmVhdG9yCiAgICAgICAgPgogICAgICAgIDxkYzpzdWJqZWN0CiAgICAgICAgICA+CiAgICAgICAgICA8cmRmOkJhZwogICAgICAgICAgICA+CiAgICAgICAgICAgIDxyZGY6bGkKICAgICAgICAgICAgICA+YXJyb3c8L3JkZjpsaQogICAgICAgICAgICA+CiAgICAgICAgICAgIDxyZGY6bGkKICAgICAgICAgICAgICA+aWNvbjwvcmRmOmxpCiAgICAgICAgICAgID4KICAgICAgICAgICAgPHJkZjpsaQogICAgICAgICAgICAgID51cDwvcmRmOmxpCiAgICAgICAgICAgID4KICAgICAgICAgICAgPHJkZjpsaQogICAgICAgICAgICAgID51cCBhcnJvdzwvcmRmOmxpCiAgICAgICAgICAgID4KICAgICAgICAgICAgPHJkZjpsaQogICAgICAgICAgICAgID51cF9hcnJvdzwvcmRmOmxpCiAgICAgICAgICAgID4KICAgICAgICAgIDwvcmRmOkJhZwogICAgICAgICAgPgogICAgICAgIDwvZGM6c3ViamVjdAogICAgICAgID4KICAgICAgPC9jYzpXb3JrCiAgICAgID4KICAgICAgPGNjOkxpY2Vuc2UKICAgICAgICAgIHJkZjphYm91dD0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvcHVibGljZG9tYWluLyIKICAgICAgICA+CiAgICAgICAgPGNjOnBlcm1pdHMKICAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyNSZXByb2R1Y3Rpb24iCiAgICAgICAgLz4KICAgICAgICA8Y2M6cGVybWl0cwogICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zI0Rpc3RyaWJ1dGlvbiIKICAgICAgICAvPgogICAgICAgIDxjYzpwZXJtaXRzCiAgICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjRGVyaXZhdGl2ZVdvcmtzIgogICAgICAgIC8+CiAgICAgIDwvY2M6TGljZW5zZQogICAgICA+CiAgICA8L3JkZjpSREYKICAgID4KICA8L21ldGFkYXRhCiAgPgo8L3N2Zwo+Cg==';
/**
 * Class for the ftDuino blocks in Scratch 3.0
 * @constructor
 */

const FTDUINO_OFFLINE_CONNECT_BUTTON_ID = "ftDuino_offline_connect_button";
const FTDUINO_OFFLINE_COMPILE_BUTTON_ID = "ftDuino_offline_compile_button";
const FTDUINO_OFFLINE_CONVERT_BUTTON_ID = "ftDuino_offline_convert_button";
const FTDUINO_OFFLINE_UPLOAD_BUTTON_ID = "ftDuino_offline_upload_button";
const FTDUINO_OFFLINE_MEMORY_METER_ID = "ftDuino_offline_memory_meter";
const FTDUINO_CONNECT_BUTTON_ID = "ftDuino_connect_button";
const FTDUINO_OFFLINE_CHECK_CONNECTION_INTERVAL = 1000;
const FTDUINO_OFFLINE_CHECK_USED_MEMORY = 10000;
const EXTENSION_ID = 'ftduinoOffline';




const noTopLevelHatBlock = "Der Sketch benötigt einen Hat-Block";
const tooManyTopLevelHatBlock = "Der Sketch darf nur genau einen Hat-Block enthalten";
const sketchIsTooBig = "Der Sketch ist zu groß für den ftduino.\nVersuche die benötigten Blöcke zu reduzieren";
const uploadError = "Der Sketch konnte nicht hochgeladen werden. Prüfe die Verbindung und versuche es erneut"
const blockNotSupportedError = "Der Sketch enthält einen Block, der nicht vom ftduino unterstützt wird"
const internalError = "Interner Fehler";

class Scratch3Offline {

	onConnectClicked() {
		console.log("Woot woot. Connecting")

		// Ideally I would not need this, but I did not find a way to exit from a promise chain early.
		// I.e. If I fail in the first catch, it would happily continue executing the next then clause
		// and fail again, as the then clause has to fail as it did not receive valid data...
		let connectionFailed = false;

		fetch('http://localhost:8888/ftduinos', {
			method: 'POST'
		})
			.catch((error) => {
				console.log(error);
				alert("Es konnte keine Verbindung zum lokalen Server aufgebaut werden");
				connectionFailed = true;
				throw error;
			})
			.then(response => response.json())
			.catch((error) => {
				if (connectionFailed) return;
				console.log(error);
				alert("Die Antwort des Servers konnte nicht ins korrekte Format umgewandelt werden");
				throw error;
			}).then(jsonResponse => {
				if (jsonResponse.status != "SUCCESS") {
					console.log(jsonResponse.errorMessage);
					alert("Interner Fehler");
				} else if (jsonResponse.status == "SUCCESS") {
					let parsingFailed;
					let serialDevices;
					try {
						console.log(jsonResponse.result);
						serialDevices = JSON.parse(jsonResponse.result);
					} catch (e) {
						console.log(e);
						parsingFailed = true;
					}
					if (parsingFailed || serialDevices === null) {
						alert("Interner Fehler");
					} else {
						if (serialDevices.length > 0) {
							this.buttons[1].setIcon(ftduinoConnectedIcon);
							this.buttons[1].setTitle("Verbunden");
							console.log(serialDevices);
							this.serialDevice = serialDevices[0];
							console.log("Picked " + this.serialDevice);
						} else {
							alert("Es wurde kein ftDuino erkannt");
						}
					}
				}
			})
	}

	onCompileClicked() {
		console.log("Woot woot. Compiling")
		let serializedJsonString = JSON.stringify(Serialization.serialize(this.runtime, this.runtime.getEditingTarget().id))

		// Ideally I would not need this, but I did not find a way to exit from a promise chain early.
		// I.e. If I fail in the first catch, it would happily continue executing the next then clause
		// and fail again, as the then clause has to fail as it did not receive valid data...
		let connectionFailed = false;

		fetch('http://localhost:8888/compile', {
			method: 'POST',
			body: serializedJsonString
		})
			.catch((error) => {
				console.log(error);
				alert("Es konnte keine Verbindung zum lokalen Server aufgebaut werden");
				connectionFailed = true;
				throw error;
			})
			.then(response => response.json())
			.catch((error) => {
				if (connectionFailed) return;
				console.log(error);
				alert("Die Antwort des Servers konnte nicht ins korrekte Format umgewandelt werden");
				throw error;
			}).then(jsonResponse => console.log);

		console.log(serializedJsonString)
	}

	onConvertClicked() {
		console.log("Woot woot. Converting")
		let serializedJsonString = JSON.stringify(Serialization.serialize(this.runtime, this.runtime.getEditingTarget().id))

		// Ideally I would not need this, but I did not find a way to exit from a promise chain early.
		// I.e. If I fail in the first catch, it would happily continue executing the next then clause
		// and fail again, as the then clause has to fail as it did not receive valid data...
		let connectionFailed = false;

		fetch('http://localhost:8888/convert', {
			method: 'POST',
			body: serializedJsonString
		})
			.catch((error) => {
				console.log(error);
				alert("Es konnte keine Verbindung zum lokalen Server aufgebaut werden");
				connectionFailed = true;
				throw error;
			})
			.then(response => response.json())
			.catch((error) => {
				if (connectionFailed) return;
				console.log(error);
				alert("Die Antwort des Servers konnte nicht ins korrekte Format umgewandelt werden");
				throw error;
			}).then(jsonResponse => console.log);

		console.log(serializedJsonString)
	}

	extractMatchingErrorMessage(errorMessage) {
		if (errorMessage.includes("ScratchNoTopLevelHatBlockException")) {
			return noTopLevelHatBlock;
		} else if (errorMessage.includes("ScratchTooManyTopLevelHatBlocksException")) {
			return tooManyTopLevelHatBlock;
		} else if (errorMessage.includes("Sketch too big")) {
			return sketchIsTooBig;
		} else if (errorMessage.includes("Error during Upload")) {
			return uploadError;
		} else if (errorMessage.includes("Cannot locate class")) {
			// this check is not a good check. It might lead to a false positive when the user
			// somehow uses a legitmite class that can't be found...
			return blockNotSupportedError;
		} else {
			return internalError;
		}
	}

	onUploadClicked() {
		console.log("Woot woot. Uploading")
		let serializedJsonString = JSON.stringify(Serialization.serialize(this.runtime, this.runtime.getEditingTarget().id))

		if (this.serialDevice === null || this.serialDevice === undefined) {
			alert("Es ist kein ftDuino verbunden");
			return;
		}
		let requestBody = JSON.stringify({
			code: serializedJsonString,
			serialPort: this.serialDevice.address
			// TODO select serial port
		});

		// Ideally I would not need this, but I did not find a way to exit from a promise chain early.
		// I.e. If I fail in the first catch, it would happily continue executing the next then clause
		// and fail again, as the then clause has to fail as it did not receive valid data...
		let connectionFailed = false;

		fetch('http://localhost:8888/upload', {
			method: 'POST',
			body: requestBody
		})
			.catch((error) => {
				console.log(error);
				alert("Es konnte keine Verbindung zum lokalen Server aufgebaut werden");
				connectionFailed = true;
				throw error;
			})
			.then(response => response.json())
			.catch((error) => {
				if (connectionFailed) return;
				console.log(error);
				alert("Die Antwort des Servers konnte nicht ins korrekte Format umgewandelt werden");
				throw error;
			}).then(jsonResponse => {
				if (jsonResponse.status != "SUCCESS") {
					console.log(jsonResponse.errorMessage);
					let appropriateErrorMessage = this.extractMatchingErrorMessage(jsonResponse.errorMessage);
					// in both cases the memory usage is sent despite there being an error
					if (appropriateErrorMessage === sketchIsTooBig || appropriateErrorMessage === uploadError) {
						let memoryUsage = this.extractMemoryUsage(jsonResponse.result);
						console.log(memoryUsage);
						this.memoryMeter.setValue(memoryUsage);
					}
					alert(appropriateErrorMessage);
				} else if (jsonResponse.status == "SUCCESS") {
					console.log(jsonResponse.result)
					let memoryUsage = this.extractMemoryUsage(jsonResponse.result);
					console.log(memoryUsage);
					this.memoryMeter.setValue(memoryUsage);
					alert("Erfolgreich hochgeladen");
				}
			});

		console.log(serializedJsonString)
	}

	checkMemoryStatus() {
		console.log("Checking memory status")
		let serializedJsonString = JSON.stringify(Serialization.serialize(this.runtime, this.runtime.getEditingTarget().id))

		// Ideally I would not need this, but I did not find a way to exit from a promise chain early.
		// I.e. If I fail in the first catch, it would happily continue executing the next then clause
		// and fail again, as the then clause has to fail as it did not receive valid data...
		let connectionFailed = false;

		fetch('http://localhost:8888/compile', {
			method: 'POST',
			body: serializedJsonString
		}).then(response => response.json()).then(jsonResponse => {
			if (jsonResponse.status != "SUCCESS") {
				console.log(jsonResponse.errorMessage);
				let memoryUsage = this.extractMemoryUsage(jsonResponse.result);
				console.log(memoryUsage);
				this.memoryMeter.setValue(memoryUsage);
			} else if (jsonResponse.status == "SUCCESS") {
				console.log(jsonResponse.result)
				let memoryUsage = this.extractMemoryUsage(jsonResponse.result);
				console.log(memoryUsage);
				this.memoryMeter.setValue(memoryUsage);
			}
		}).catch(console.log);

		console.log(serializedJsonString)
	}

	checkDeviceConnectionStatus() {
		console.log("Checking connection status")

		fetch('http://localhost:8888/ftduinosAsync', {
			method: 'POST'
		})
			.then(response => response.json()).then(jsonResponse => {
				if (jsonResponse.status != "SUCCESS") {
					console.log(jsonResponse.errorMessage);
				} else if (jsonResponse.status == "SUCCESS") {
					let parsingFailed;
					let serialDevices;
					try {
						console.log(jsonResponse.result);
						serialDevices = JSON.parse(jsonResponse.result);
					} catch (e) {
						console.log(e);
						parsingFailed = true;
					}
					if (parsingFailed || serialDevices === null) {
						return;
					} else {
						if (this.serialDevice === undefined) {
							return;
						}

						let isConnected = false;
						serialDevices.forEach(device => {
							console.log(device);
							console.log(this.serialDevice);
							if (device.address == this.serialDevice.address) {
								isConnected = true;
							}
						});
						if (!isConnected) {
							this.serialDevice = undefined;
							this.buttons[1].setIcon(ftduinoDisconnectedIcon);
							this.buttons[1].setTitle("Mit ftDuino verbinden");
						}
					}
				}
			}).catch(console.log);
	}

	extractMemoryUsage(string) {
		const regex = /Sketch\ uses\ (\d*)\ bytes.*/gm;
		let m;
		let memoryUsage = 0;

		while ((m = regex.exec(string)) !== null) {
			// This is necessary to avoid infinite loops with zero-width matches
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}

			// The result can be accessed through the `m`-variable.
			m.forEach((match, groupIndex) => {
				if (groupIndex == 1) {
					memoryUsage = match;
				}
			});
		}
		return memoryUsage;
	}

	initMemoryMeter() {
		let memoryMeter = new Meter(FTDUINO_OFFLINE_MEMORY_METER_ID, 5666, 8000, 25000, 28672, "Speicherverbrauch");
		return memoryMeter;
	}

	initButtons() {
		//compileButton = new Button(FTDUINO_OFFLINE_COMPILE_BUTTON_ID, this.onCompileClicked.bind(this));
		//convertButton = new Button(FTDUINO_OFFLINE_CONVERT_BUTTON_ID, this.onConvertClicked.bind(this));
		let uploadButton = new Button(FTDUINO_OFFLINE_UPLOAD_BUTTON_ID, this.onUploadClicked.bind(this), ftduinoUploadSketchIcon, "Auf ftDuino hochladen");
		let connectButton = new Button(FTDUINO_OFFLINE_CONNECT_BUTTON_ID, this.onConnectClicked.bind(this), ftduinoDisconnectedIcon, "Mit ftDuino verbinden");
		return [ /*compileButton, convertButton, */ uploadButton, connectButton];
	}

	/**
	 * Removes/hides the original ftduino connect button.
	 */
	removeOriginalFtduinoButton() {
		let ftduinoOriginalConnectButton = document.getElementById(FTDUINO_CONNECT_BUTTON_ID);
		if (ftduinoOriginalConnectButton) {
			ftduinoOriginalConnectButton.style.display = 'none';
			clearInterval(this.removeOriginalFtduinoButtonCheck);
		}
	}

	addTemporaryStyleSheetToHighlightSupportedBlocks() {
		const style = document.createElement('style');
		document.head.append(style);
		style.textContent = `
		g .blocklyBlockBackground {
			opacity: 40%; 
		}

		g:where(
		[data-id="event_whenflagclicked"] .blocklyBlockBackground,
		[data-id="control_wait"] .blocklyBlockBackground,
		[data-id="control_repeat"] .blocklyBlockBackground,
		[data-id="forever"] .blocklyBlockBackground,
		[data-id="control_if"] .blocklyBlockBackground,
		[data-id="control_if_else"] .blocklyBlockBackground,
		[data-id="wait_until"] .blocklyBlockBackground,
		[data-id="repeat_until"] .blocklyBlockBackground,
		[data-id="operator_add"] .blocklyBlockBackground,
		[data-id="operator_subtract"] .blocklyBlockBackground,
		[data-id="operator_multiply"] .blocklyBlockBackground,
		[data-id="operator_divide"] .blocklyBlockBackground,
		[data-id="operator_random"] .blocklyBlockBackground,
		[data-id="operator_gt"] .blocklyBlockBackground,
		[data-id="operator_lt"] .blocklyBlockBackground,
		[data-id="operator_equals"] .blocklyBlockBackground,
		[data-id="operator_and"] .blocklyBlockBackground,
		[data-id="operator_or"] .blocklyBlockBackground,
		[data-id="operator_not"] .blocklyBlockBackground,
		[data-id="ftduino_led"] .blocklyBlockBackground,
		[data-id="ftduino_input"] .blocklyBlockBackground,
		[data-id="ftduino_output"] .blocklyBlockBackground,
		[data-id="ftduino_when_input"] .blocklyBlockBackground,
		[data-id="ftduino_input_analog"] .blocklyBlockBackground,
		[data-id="ftduino_output_analog"] .blocklyBlockBackground,
		[data-id="ftduino_motor"] .blocklyBlockBackground,
		[data-id="ftduino_motor_stop"] .blocklyBlockBackground,
		[data-id="ftduino_input_counter"] .blocklyBlockBackground,
		[data-id="ftduino_clear_counter"] .blocklyBlockBackground {
			opacity: 100%; 
		}`;
	}

	constructor(runtime) {
		this.runtime = runtime;
		this.buttons = this.initButtons();
		this.memoryMeter = this.initMemoryMeter();
		setInterval(() => this.checkDeviceConnectionStatus(), FTDUINO_OFFLINE_CHECK_CONNECTION_INTERVAL);
		setInterval(() => this.checkMemoryStatus(), FTDUINO_OFFLINE_CHECK_USED_MEMORY);
		this.removeOriginalFtduinoButtonCheck = setInterval(() => this.removeOriginalFtduinoButton(), 1000);
		this.addTemporaryStyleSheetToHighlightSupportedBlocks();
	}

	/**
	 * @returns {object} metadata for this extension and its blocks.
	 */
	getInfo() {
		return {
			id: EXTENSION_ID,
			name: 'ftDuino-offline'
		};
	}
}

module.exports = Scratch3Offline;