let formData = {
		cardData: null,
		purpose: null,
		equipment: []
};
let vm = new Vue({
	el: "#container",
	data: {
		form: formData,
		modalOpen: false
	}
});