let formData = {
		cardData: null,
		purpose: null,
		equipment: [],
		name: null,
		email: null,
		major: null,
		classification: null
};

//ideally move this to a separate file in the future
let values = {
	"equipment": [
		{"name": "Laser Cutter", "value": "laserCutter"},
		{"name": "3D Printer", "value": "3DPrinter"},
		{"name": "PCB Mill", "value": "PCBMill"},
		{"name": "CNC Mill", "value": "CNCMill"},
		{"name": "Plasma Cutter", "value": "plasmaCutter"},
		{"name": "Soldering Iron", "value": "solderingIron"},
		{"name": "Sewing Machine", "value": "sewingMachine"},
		{"name": "Tools", "value": "tools"},
		{"name": "Other", "value": "other"}
	],
	"purpose": [
		{"name": "Fun", "value": "fun"},
		{"name": "Class", "value": "class"},
		{"name": "Training", "value": "training"},
		{"name": "Research", "value": "research"}
	],
	"classification": ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"]
};

let vm = new Vue({
	el: "#container",
	data: {
		form: formData,
		values: values,
		manualEntryOpen: false,
		modalOpen: false,
		modalText: null,
		modalAltBtn: false,
		modalAltFunc: ()=>{}
	},
	methods: {
		submit: function(manual=false) {
			let data = {};
			let fail = false;
			Object.keys(vm.form).forEach(field => {
				data[field] = vm.form[field];
				if (typeof data[field] === "array")
					data[field] = data[field].join("|");

				if (/^\s*$/.test(data[field])) {
					fail = true;
					showMessage("Please complete all fields.", true);
				}
			});
			if (fail) {
				return;
			}
			showMessage("Please wait...");
			post(manual ? "/store-manual" : "/store", data, function(data) {
				let obj = JSON.parse(data);
				handleLoad(obj);
			}, true);
		}
	}
})