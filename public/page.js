let formData = {
		cardData: null,
		purpose: null,
		equipment: [],
		name: null,
		email: null,
		major: null,
		classification: null
};
let vm = new Vue({
	el: "#container",
	data: {
		form: formData,
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