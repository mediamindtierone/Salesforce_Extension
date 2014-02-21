var sfmod_interval = setInterval(function() {
	var SFMOD_ExtUtil;
	SFMOD_ExtUtil = chrome.runtime;
	if(typeof(SFMOD_ExtUtil)!="undefined") {
		clearInterval(sfmod_interval);
		var sfmod = document.createElement("script");
		sfmod.src="https://secure-ds.serving-sys.com/BurstingRes/CustomScripts/sfmod_plugin.js?rnd="+(Math.random()*1000000);
		document.head.appendChild(sfmod);
	}
}, 1000); 