const PARENT_CLASS = "controls_controls-container_2xinB"

class Button {
	constructor(id, handler, icon, title) {
		this.id = id;
		this.handler = handler;
		this.icon = icon;
		this.title = title;
		this.addButton();
		this.keepButton();
	}

	keepButton() {
		// the scratch3 gui will remove our button e.g. when the
		// language is being changed. We need to restore it then
		setInterval(() => this.addButton(), 1000);
	}

	addButton() {
	    //  check if the button already exists
		let button = document.getElementById(this.id);

		if (button == undefined) {
			let x = document.getElementsByClassName(PARENT_CLASS);
			if (x.length > 0) {
				hdrdiv = x[0];

				let img;

				if(button == undefined) {
					img = document.createElement("IMG");
					img.classList.add("green-flag_green-flag_1kiAo");
					img.setAttribute("draggable", false);
					hdrdiv.appendChild(img);
				} else {
					img = button;
				}
				img.setAttribute("id", this.id);
				img.setAttribute("src", this.icon);
				img.setAttribute("title", this.title);
               
				img.onclick = this.handler;
			} else
				alert("ftDuino: controls-container class not found!");
		}
	}

	getButton() {
		this.addButton(); // make sure there is a button available
		let button = document.getElementById(this.id);
		return button;
	}

	setIcon(icon) {
		this.icon = icon;
		let button = this.getButton();
		button.setAttribute("src", this.icon);
	}

	setTitle(title) {
		this.title = title;
		let button = this.getButton();
		button.setAttribute("title", this.title);
	}
}


module.exports = Button;