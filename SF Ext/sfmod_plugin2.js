var match, 
url = window.location.href,
regex = /[?&]([^=#]+)=([^&#]*)/g,
params = {}; 

while(match = regex.exec(url)) params[match[1]] = match[2];
console.log("sfmod.js loaded "+window.location.href);
if(params.fcf) {
	console.log(params.fcf);
	placeButtons();
}

function createDiv(id) {
	var div = document.createElement("div");
	div.id  = id;
	if(typeof(document.getElementById(id))!="undefined" && document.getElementById(id)) 
		document.getElementById(id).remove();
	return div;
}
function createImg(width,height) {
	var img = document.createElement("img");
	if(typeof(width)!="undefined" && typeof(height)!="undefined") {
		img.style.height 	= height + "px";
		img.style.width 	= width + "px";
	}
	img.align			= "top";
	img.style.cursor	= "pointer";
	return img;
}

function sf_popup(title, message) {
	var overlay = createDiv("popupOverlay");
	overlay.style.position 	= "absolute";
	overlay.style.width 	= "100%";
	overlay.style.height 	= "100%";
	overlay.style.background = "black";
	overlay.style.opacity 	= "0.5";
	overlay.style.zIndex 	= "9999";
	document.body.appendChild(overlay);
	
	var popupElem = createDiv("sf_popup");
	popupElem.style.position= "absolute";
	popupElem.style.width 	= "400px";
	popupElem.style.height 	= "auto";
	popupElem.style.background = "white";
	popupElem.style.top 	= window.innerHeight/4 + "px";
	popupElem.style.left 	= window.innerWidth/2 - parseInt(popupElem.style.width)/2 + "px";
	popupElem.style.zIndex 	= "99999";
	popupElem.style.padding = "5px";
	
	var popupHeader = createDiv("sf_popup_message");
	popupHeader.innerHTML = title;
	popupHeader.style.textAlign = "center";
	var popupMessage = createDiv("sf_popup_message");
	popupMessage.innerHTML = message;
	
	popupElem.appendChild(popupHeader);
	popupElem.appendChild(popupMessage);
	document.body.appendChild(popupElem);
}

function getActiveUser() {
	return document.getElementById("userNavLabel").innerText;
}

function getActiveTier() {
	if(typeof(document.getElementById(sfmod_params.fcf+"_listSelect"))=="undefined") return;
	return document.getElementById(sfmod_params.fcf+"_listSelect").selectedOptions[0].innerText;
}

function getUserColumn() {
	var tier = getActiveTier();
	var ownerName;
	if(tier == "Online Support Tier 1")
		ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sw");
	else if(tier == "Online Support Tier 2")
		ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sx");
	else if(tier == "Online Support Tier 3")
		ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-OWNER_NAME");
		
	return ownerName;
}

function placeButtons() {
	if(typeof(document.getElementsByClassName('multiforce')[0])!="undefined") {
		var ufb = document.getElementsByClassName('multiforce')[0];
		var et = createDiv("sfmod_et");
		et.id 				= "ext_toolbar";
		et.style.width 		= "100%";
		et.style.position 	= "absolute";
		et.style.textAlign 	= "center";
		et.style.top 		= "0px";
		
		var stats = createImg(40,40);
		stats.src="https://platform.mediamind.com/Eyeblaster.AnalyticsMM.Web/HomePage/images/Icon_Services.gif";
		stats.onclick = function() {
			sf_popup("Handled Cases", "");
		}
		var settings = createImg(30,30);
		settings.src="https://platform.mediamind.com/Eyeblaster.AnalyticsMM.Web/HomePage/images/icon_CM.gif";
		settings.onclick = function() {
		
		}
		var reset = createImg(30,30);
		reset.src="https://platform.mediamind.com/Eyeblaster.ACM.Web/Images/Icons/high.gif";
		reset.onclick = function() {
		
		}
		et.appendChild(stats);
		et.appendChild(settings);
		et.appendChild(reset);
		ufb.appendChild(et);
	}
}