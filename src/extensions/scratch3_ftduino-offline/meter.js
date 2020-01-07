const PARENT_CLASS = "controls_controls-container_2xinB"

class Meter {
	constructor(id, min, optimum, high, max, title) {
		this.id = id;
		this.min = min;
		this.optimum = optimum;
		this.high = high;
		this.max = max;
		this.title = title;
		this.addMeter();
		this.keepMeter();
	}

	keepMeter() {
		// the scratch3 gui will remove our meter e.g. when the
		// language is being changed. We need to restore it then
		setInterval(() => this.addMeter(), 1000);
	}

	addMeter() {
	    //  check if the meter already exists
		let meter = document.getElementById(this.id);

		if (meter == undefined) {
			let x = document.getElementsByClassName(PARENT_CLASS);
			if (x.length > 0) {
				hdrdiv = x[0];

				let meterElement;

				if(meter == undefined) {
					meterElement = document.createElement("METER");
					meterElement.classList.add("green-flag_green-flag_1kiAo");
					meterElement.setAttribute("draggable", false);
					hdrdiv.appendChild(meterElement);
				} else {
					meterElement = meter;
				}
				meterElement.setAttribute("id", this.id);
				meterElement.setAttribute("min", this.min);
				meterElement.setAttribute("optimum", this.optimum);
				meterElement.setAttribute("high", this.high);
				meterElement.setAttribute("max", this.max);
				meterElement.setAttribute("title", this.title);
				meterElement.style.width = "unset";
				meterElement.style.cursor = "unset"
			} else
				alert("ftDuino: controls-container class not found!");
		}
	}

	getMeter() {
		this.addMeter(); // make sure there is a meter available
		let meter = document.getElementById(this.id);
		return meter;
	}

	setTitle(title) {
		this.title = title;
		let meter = this.getMeter();
		meter.setAttribute("title", this.title);
	}

	setValue(value) {
		this.value = value;
		let meter = this.getMeter();
		meter.setAttribute("value", this.value);
	}
}


module.exports = Meter;