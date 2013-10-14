/*
	
	This plugin is using file handling for HTML5, please see URL: http://www.html5rocks.com/en/tutorials/file/filesystem/#toc-introduction
*/

var fs 					= null,
	msg 				= "",
	state 				= "",
	tier,
	tmpColor,
	sfRefresh,
	initSettings,
	ownerName,
	caseOwner 			= document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sw"),
	datePerCase 		= document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005BOuj"),
	pubNamePerCase 		= document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8T4"),
	iterationCount 		= document.getElementsByClassName("x-grid3-col x-grid3-cell x-grid3-td-00NC0000005C8Tc"),
	productCategory 	= document.getElementsByClassName("x-grid3-col x-grid3-cell x-grid3-td-00NC0000005C8T2"),
	accountNamePerCase 	= document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-ACCOUNT_NAME"),
	definedVariables 	= [
							{variable:"#NOW", value:"new Date()"},
							{variable:"#CASESLA", value:"new Date(datePerCase[i].textContent)"},
							{variable:"#ACCOUNT", value:"accountNamePerCase[i].textContent"},
							{variable:"#PUBNAME", value:"pubNamePerCase[i].textContent"},
							{variable:"#PRODCAT", value:"productCategory[i].textContent"},
							{variable:"#ME", value:"window.top.document.getElementById('userNavLabel').textContent"},
							{variable:"#CASEOWNER", value:'alterName(caseOwner[i].innerText)'},
							{variable:"#ITERCNT", value:'alterName(iterationCount[i].innerText)'}
						],
	labels 				= "sfExtension_labels.txt",
	fileSize 			= 1024*1024,
	daysInAMonth 		= [31,28,31,30,31,30,31,31,30,31,30,31],
	persistenceType 	= window.TEMPORARY,
	regex 				= /[?&]([^=#]+)=([^&#]*)/g, 
	url 				= window.location.href, 
	params 				= {}, 
	match,
	resetStat 			= 0,
	assignedColor;
	
var _RESULT;

function createDiv() {	return document.createElement("div"); }
function createInput() { return document.createElement("input"); }
function createLabel() { return document.createElement("label"); }

window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
while(match = regex.exec(url)) params[match[1]] = match[2];
console.log("sfmod.js loaded "+window.location.href);

if(document.getElementById("IsPublished")!=undefined) { //checks the Public checkbox when creating a new comment
	var a = document.getElementById("IsPublished");
	a.checked = true;
}

if(document.getElementById("p6") != undefined) { //adds the case number when you send an email.
	var subjectField,getCase,cNum;
	if(document.getElementById("p3") != undefined) {
		getCase = document.getElementById("p3");
		cNum = getCase.value
	} else {
		getCase = document.getElementsByClassName("data2Col");
		cNum = getCase[3].textContent
	}
	subjectField = document.getElementById("p6");
	if(subjectField.value.match(cNum)) console.log("Match")
	else subjectField.value = subjectField.value+" [" + cNum+ "]"
}

if(params.fcf) {
	if(window.requestFileSystem) {
		sf_read(labels);
		setTimeout(
			function() { //wait for the file system to check
				if(typeof(_RESULT) == "undefined") {
					initialSettings();
					settingWindow("none");
				}
			}
		, 1000); 
	}
	tier = document.getElementById(params.fcf+"_listSelect").selectedOptions[0].innerText;
	statPortion();
	refreshSF();
	reminder();
} else { //for individual case view
	var scv = setInterval(singleCaseView, 1000);
	reminder();
	lfw_popup(); //popup reminder for Lead for Website
}

function lfw_popup() {
	if(document.getElementById("j_id0:onlinecase:j_id41:j_id52:j_id53") == null || typeof(document.getElementById("j_id0:onlinecase:j_id41:j_id52:j_id53")) == "undefined") return;
	if(window.location.href.match("CaseDetail") == false) return;
	
	var lfw_subject = document.getElementById("j_id0:onlinecase:j_id41:j_id52:j_id53").textContent.toLowerCase();
	if(lfw_subject.match("lead from website"))
	sf_popup("<h1>Reminder</h1>","Please be reminded that we have to follow the process indicated on this wiki article: <br><b>http://peg/wiki/index.php/lead-from-website-emails/</b><br> before handling this case.");
}

function singleCaseView() {
	if(document.getElementById("tsidLabel") == null || typeof(document.getElementById("tsidLabel")) == "undefined" || document.getElementById("tsidLabel").textContent != "Support") return;
	
	if(document.getElementById("j_id0:onlinecase:j_id41:sla_tracking:j_id127").textContent == "" || 
	document.getElementById("j_id0:onlinecase:j_id41:sla_tracking:j_id127").textContent == " " || document.getElementById("j_id0:onlinecase:j_id41:sla_tracking:j_id127").textContent == null) return;
	
	if(document.getElementById("timeLeftContainer") != null) document.getElementById("timeLeftContainer").remove();
	
	var timeLeftContainer,timeLeftCaption,timeBreakElem,timeLeftValue,caseSla,container;
	
	timeLeftContainer 						= createDiv();
	timeLeftContainer.id 					= "timeLeftContainer";
	timeLeftContainer.style.float 			= "left";
	timeLeftContainer.style.paddingLeft 	= "20px";
	
	timeLeftCaption 						= document.createElement("h1");
	timeLeftCaption.class 					= "pageType";
	timeLeftCaption.textContent 			= "Time Remaining Left";
	timeBreakElem 							= document.createElement("br");
	timeLeftValue 							= document.createElement("h2");
	timeLeftValue.style.fontSize 			= "1.8em";
	timeLeftValue.style.fontWeight 			= "normal";
	timeLeftValue.style.lineHeight 			= "1.1em";
	
	caseSla 								= getSLA_NOW(document.getElementById("j_id0:onlinecase:j_id41:sla_tracking:j_id127").textContent);
	timeLeftValue.textContent 				= caseSla + " minutes.";
	if(caseSla < 60 && caseSla > 0)	blinkDiv(timeLeftContainer, "#2c86ff");
	else if(caseSla < 0) timeLeftValue.textContent = "Exceeded.";
	
	timeLeftContainer.appendChild(timeBreakElem);
	timeLeftContainer.appendChild(timeLeftValue);
	timeLeftContainer.appendChild(timeLeftCaption);
	container = document.getElementById("container");
	container.appendChild(timeLeftContainer);
}

function refreshSF() {
	setTimeout(startSLATimerProcess, 4000);
	document.getElementById(params.fcf+"_wrapper").onmouseover = detectExceedInst;
}

function refreshRate(rate) {
	console.log("setting refresh rate to " + rate);
	clearInterval(sfRefresh);
	sfRefresh = setInterval(function() {	
		document.getElementById(params.fcf+"_refresh").click();
		detectExceedDelay();
	} , rate);
}

function detectExceedDelay() {
	var detectTimer = setInterval(function() {
		clearInterval(detectTimer);
		detectExceedInst();
	}, 3000);
}

function detectExceedInst() {
	if (window.requestFileSystem && _RESULT) insertLegend(params.fcf+"_rolodex");
	else return;
}

function setupArray() {
	Array.prototype.contains = function(v) {
		for(var i = 0; i < this.length; i++) { if(this[i] === v) return true; }
		return false;
	};
	Array.prototype.unique = function() {
		var arr = [];
		for(var i = 0; i < this.length; i++) { if(!arr.contains(this[i])) arr.push(this[i]); }
		return arr; 
	}
}

function statPortion() { //status for agents and engineers
	setupArray();
	if (!top.document.getElementById("optionButton")) {
		var imgnode 		= document.createElement('img');
		imgnode.src 		= chrome.runtime.getURL("images/stat.png");
		imgnode.id 			= "statButton";
		imgnode.onclick 	= function() {
			sf_popup("Case Status", "<div style='text-align:left;'>" + showStatFunc() + "</div>");
		}
		imgnode.style.top 		= "1px";
		imgnode.style.left 		= String((window.innerWidth/2)-40) + "px";
		imgnode.style.width 	= "30px";
		imgnode.style.align 	= "center";
		imgnode.style.cursor	= "pointer";
		imgnode.style.height 	= "30px";
		imgnode.style.position	= "absolute";
		top.document.body.appendChild(imgnode);
		
		var optnode 		= document.createElement('img');
		optnode.src 		= chrome.runtime.getURL("images/settingIcon.png");
		optnode.id 			="optionButton";
		optnode.onclick 	= function() {
			initSettings = buildInitSettings();
			settingWindow("block");
		}
		optnode.style.top 		= "1px";
		optnode.style.left 		= String((window.innerWidth/2)) + "px";
		optnode.style.width 	= "30px";
		optnode.style.align 	= "center";
		optnode.style.cursor	="pointer";
		optnode.style.height 	= "30px";
		optnode.style.position	= "absolute";
		top.document.body.appendChild(optnode);	
	}
}

function showStatFunc() {
	var nCase = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-CASES_STATUS"),
	hStat = aStat = nStat = rStat = dStat = 0, ownerArray = [];;
	for (var q=0; q<nCase.length; q++) {
		switch (nCase[q].textContent) {
			case "Handling" : hStat++; break;
			case "Assigned" : aStat++; break;
			case "New" : nStat++; break;
			case "Returned to Support" : rStat++; break;
			case "De-escalated to Tier 1" : dStat++; break;
		}
	}			
	tier = document.getElementById(params.fcf+"_listSelect").selectedOptions[0].innerText;
	ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sw");
	if(tier == "Online Support Tier 1")
		ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-OWNER_NAME");
	else if(tier == "Online Support Tier 2")
		ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sx");
	else if(tier == "Online Support Tier 3")
		ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-OWNER_NAME");
	
	for (var r=0;r<ownerName.length; r++) {	ownerArray.push(ownerName[r].textContent); }
	var owner = ownerArray.unique();
	return 'Total number of case: '+nCase.length+'<br><br>Case breakdown per status:<br>Handling: '+hStat+'<br>Assigned: '+aStat+'<br>New: '+nStat+'<br>Returned to support: '+rStat+'<br>De-escalated T1: '+ dStat+'<br><br>Handled and assigned cases per engineer: <br>'+getOwner(owner);
}

function getOwner(vals) {
	var tempStr = "", tempNum = 0, cnt = 0, nArray = [];
	for (var w=0 ; w<vals.length ; w++) {
		if (vals[w] != undefined && vals[w] != "Online Support Tier 1" && vals[w].length > 1) {
			cnt = 0;
			for (var g=0; g<ownerName.length ; g++) {
				if (ownerName[g].textContent.match(vals[w])) cnt++;
			}
			tempStr += String("\n"+vals[w]+": "+cnt + "<br>")
			cnt=0;
		}
	}
	return tempStr
}

function errorHandler(e) { //file handling starts here
	msg = "";
	switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR			: msg = "QUOTA_EXCEEDED_ERR"; break;
		case FileError.SECURITY_ERR					: msg = "SECURITY_ERR"; break;
		case FileError.INVALID_MODIFICATION_ERR		: msg = "INVALID_MODIFICATION_ERR"; break;
		case FileError.INVALID_STATE_ERR			: msg = "INVALID_STATE_ERR"; break;
		case FileError.NOT_FOUND_ERR				: msg = "NOT_FOUND_ERR";
			if(typeof(initSettings)!="undefined") //if save will fail, this will try it again
				sf_write(JSON.stringify(initSettings), true, labels);
			break;
		default										: msg = "Unknown Error"; break;
	};
	
	console.log("Error: " + msg);
}

function _CREATEFILE(filename) {
	window.requestFileSystem(persistenceType, fileSize, function(fs) {
		fs.root.getFile(filename, {create: true, exclusive: true}, function(fileEntry) {
			//
		}, errorHandler);
	}, errorHandler);
}

function _WRITETOFILE(val, filename) {
	_RESULT = val;
	window.requestFileSystem(persistenceType, fileSize, function(fs) {
		fs.root.getFile(filename, {create: true}, function(fileEntry) {
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.onwriteend = function(e) {console.log('Write completed.');};
				fileWriter.onerror = function(e) {console.log('Write failed: ' + e.toString());};
				var blob = new Blob([val], {type: 'text/plain'});
				fileWriter.write(blob);
			}, errorHandler);
		}, errorHandler);
	}, errorHandler);
}

function _APPENDTOFILE(val, filename) {
	window.requestFileSystem(persistenceType, fileSize, function(fs) {
		fs.root.getFile(filename, {create: true}, function(fileEntry) {
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.onwriteend = function(e) {console.log('Write completed.');};
				fileWriter.onerror = function(e) {console.log('Write failed: ' + e.toString());};
				fileWriter.seek(fileWriter.length);
				var blob = new Blob([val], {type: 'text/plain'});
				fileWriter.write(blob);
			}, errorHandler);
		}, errorHandler);
	}, errorHandler);
}

function _READFROMFILE(filename) {
	window.requestFileSystem(persistenceType, fileSize, function(fs) {
		fs.root.getFile(filename, {}, function(fileEntry) {
			fileEntry.file(function(file) {
				var reader = new FileReader();
				reader.onloadend = function(e) {
					_RESULT = this.result;
				};
				reader.readAsText(file);
			}, errorHandler);
		}, errorHandler);
	}, errorHandler);
}

function _DELETEFILE(filename) {
	_RESULT = undefined;
	window.requestFileSystem(persistenceType, fileSize, function(fs) {
		fs.root.getFile(filename, {create: false}, function(fileEntry) {
			fileEntry.remove(function() {
				console.log('File removed.');
			}, errorHandler);
		}, errorHandler);
	}, errorHandler);
}

function initiateFileSystem() {
	window.requestFileSystem(persistenceType, fileSize, function(filesystem) { fs = filesystem; }, errorHandler);
}

function sf_create(filename) { _CREATEFILE(filename); }
function sf_delete(filename) { _DELETEFILE(filename); }
function sf_write(val, willreplace, filename) {
	try {
		if(willreplace) {
			sf_delete(filename);
			sf_create(filename);
			setTimeout(function(){
				_WRITETOFILE(val, filename);
			},2000);
		} else {
			if(typeof(_RESULT) == "undefined") setTimeout(_WRITETOFILE(val, filename),2000);
		}
	}catch(e){}
}

function sf_append(val, filename) {	
	try {
		if(typeof(val) == "undefined" && val == null) {
			console.log("Error: sf_append : trying to save with val null or undefined."); 
			return;
		}
		if(typeof(initSettings)=="string" || typeof(initSettings)!="object") return;
		
		var itr = initSettings.settings.reserveRules;
		var temp = [];
		for(var x1=0 ; x1<itr ;x1++) { temp[x1] = initSettings.rules[initSettings.rules.length-(x1+1)]; }
		for(var x2=0 ; x2<itr ; x2++) { initSettings.rules.splice(initSettings.rules.length-1, 1); }
		initSettings.rules.push(val);
		for(var x3=itr-1 ; x3>-1 ; x3--) { initSettings.rules.push(temp[x3]); }
	} catch(e) { console.log("Error: sf_append : contact windhel"); }
}

function sf_read(filename) {
	setTimeout(_READFROMFILE(filename), 2000);
	setTimeout(function() {
		if(typeof(_RESULT) == "undefined" || _RESULT == "_RESULT") console.log("sf_read " + _RESULT);
	}, 1000);
	return _RESULT;
}

function initialSettings() { 
	//this holds the default value
	//new rules will have an editable mode of 3 and will take the caption as the account and publisher match
	//rules with editable mode of 1 will have a variable that would let the user edit that particular variable
	//planning to have an advanced mode and assigned an editable mode of 2. this would let the user be more flexible on the rules
	var sfExtension = {
		settings:{
			name:"Salesforce Extension", version:"1.0", refreshRate:"60000", assignedCase:"#2c86ff", reserveRules:"3"
		},
		rules:[
			{caption:"Case exceed in (mins)", rule:"(#CASESLA - #NOW)/60000 < #XX", color:"#FFFF00", editMode:4, variable:"#XX", value:"60"},
			{caption:"Case exceed in (#XX mins)", rule:"(#CASESLA - #NOW)/60000 < #XX", color:"#FF9700", editMode:2, variable:"#XX", value:"30"},
			{caption:"Case exceed in (#XX mins)", rule:"(#CASESLA - #NOW)/60000 < #XX", color:"#FF6200", editMode:2, variable:"#XX", value:"15"},
			{caption:"Case Exceeded", rule:"#CASESLA - #NOW < #XX", color:"#CC0000", editMode:2, variable:"#XX", value:"0"},
			{caption:"Iteration Count >", rule:"#ITERCNT > #XX", color:"#2cefff", editMode:4, variable:"#XX", value:"4"},
			{caption:"Assigned Cases", rule:"#ME.match(#CASEOWNER)", color:"#2c86ff", editMode:2, variable:"", value:""},
			{caption:"Smart Trading", rule:"#PRODCAT.match('#XX')", color:"#85ff2c", editMode:2, variable:"#XX", value:"Smart Trading"}
		]
	};
	initSettings = sfExtension;
	sf_write(JSON.stringify(sfExtension), false, labels);
}

function buildInitSettings() { //plugin settings
	setTimeout(
		function() {
			if(typeof(_RESULT)=="undefined" || _RESULT == "undefined" || _RESULT == "")	initialSettings(); 
		}
	, 1000);
	return JSON.parse(_RESULT);
}

function createButton(text) {
	var btn 					= document.createElement("a");
	btn.innerText 				= text;
	btn.style.color 			= "#444";
	btn.style.cursor 			= "pointer";
	btn.style.border 			= "1px solid rgba(0, 0, 0, 0.25)";
	btn.style.margin 			= "5px";
	btn.style.padding 			= "3px";
	btn.style.boxShadow 		= "0 1px 0 rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.75)";
	btn.style.textShadow 		= "0 1px 0 rgb(240, 240, 240)";
	btn.style.borderRadius 		= "2px";
	btn.style.textDecoration 	= "none";
	btn.style.backgroundImage 	= "-webkit-linear-gradient(#ededed, #ededed 38%, #dedede)";
	btn.style.webkitAppearance 	= "none";
	btn.style.webkitUserSelect 	= "none";
	return btn;
}

function settingWindow(e) {
	if(document.getElementById("settingsDimmer"))document.getElementById("settingsDimmer").remove();
	if(document.getElementById("settingsContainer"))document.getElementById("settingsContainer").remove();
	
	var dimmer,settingsContainer,headerContainer,logoHandler,logoCaption,refreshHolder,refreshLabel,refreshText,refreshLabel2;
	var topButtonContainer,closeButton,resetButton,bottomButtonContainer,saveButton,saveCloseButton,addButton;
	var rulesCOntainer,settings,captionLabel,ruleLabel,topSetCont,botSetCont;
	
	var captionHolder = [],valueHolder = [],textColor = [],rule = [],deleteRule = [];
	
	resetStat				= 0;
	dimmer 					= createDiv();
	dimmer.id 				= "settingsDimmer";
	dimmer.style.top 		= "0px";
	dimmer.style.width 		= "1500px";
	dimmer.style.height 	= "1500px";
	dimmer.style.zIndex 	= "9999";
	dimmer.style.display 	= e;
	dimmer.style.opacity 	= "0.5";
	dimmer.style.position 	= "fixed";
	dimmer.style.background = "black";
	top.document.body.appendChild(dimmer);
	
	settingsContainer 					= createDiv();
	settingsContainer.id 				= "settingsContainer";
	settingsContainer.style.top 		= "0px";
	settingsContainer.style.left 		= String((window.innerWidth/2)-200)+"px";
	settingsContainer.style.width 		= "400px";
	settingsContainer.style.height 		= "auto";
	settingsContainer.style.margin 		= "20px 10px 20px 10px";
	settingsContainer.style.zIndex		="99999";
	settingsContainer.style.outline 	= "2px solid rgb(183,199,207)";
	settingsContainer.style.padding 	= "30px 10px 30px 10px";
	settingsContainer.style.display 	= e;
	settingsContainer.style.position	= "absolute";
	settingsContainer.style.textAlign 	= "center";
	settingsContainer.style.background 	= "rgb(248,248,248)";
	top.document.body.appendChild(settingsContainer);
	
	headerContainer 					= createDiv();
	headerContainer.style.textAlign 	= "center";
	logoHandler 						= createDiv();
	logoHandler.style.width 			= "100%";
	logoHandler.style.height 			= "105px";
	logoHandler.style.backgroundImage 	= 'url('+chrome.runtime.getURL("images/dgLogo.png")+')';
	logoHandler.style.backgroundRepeat 	= "no-repeat";
	logoCaption 				= createDiv();
	logoCaption.innerText 		= "SF Chrome Extension Settings";
	logoCaption.style.textAlign = "center";
	headerContainer.appendChild(logoHandler);
	
	topButtonContainer 						= createDiv();
	topButtonContainer.style.width 			= "100%";
	topButtonContainer.style.textAlign 		= "right";
	topButtonContainer.style.marginBottom 	= "20px";
	closeButton = createButton("close");
	closeButton.onclick = function() { 
		settingsContainer.style.display = "none";
		dimmer.style.display = "none";
		settingsContainer.remove();
		dimmer.remove();
	}
	resetButton = createButton("Default Settings");
	if(resetStat>0) {
		resetButton.setAttribute('disabled', 'disabled');
		resetButton.style.display = "none";
	}
	resetButton.onclick = function() { 
		resetStat++;
		settingsContainer.style.display = "none";
		dimmer.style.display = "none";
		settingsContainer.remove();
		dimmer.remove();
		setTimeout(sf_delete(labels), 2000);
		setTimeout(initialSettings(), 2000);
		setTimeout(settingWindow("block"), 2000);
		refreshRate(initSettings.settings.refreshRate);
	}
	topButtonContainer.appendChild(resetButton);
	topButtonContainer.appendChild(closeButton);
	
	refreshHolder 					= createDiv();
	refreshHolder.style.float 		= "left";
	refreshHolder.style.display 	= "table";
	refreshHolder.style.textAlign 	= "left";
	refreshLabel 					= createDiv();
	refreshLabel.innerText 			= "Refresh Rate: ";
	refreshLabel.style.display 		= "table-cell";
	refreshText 				= createInput();
	refreshText.type 			= "text";
	refreshText.name 			= "caption";
	refreshText.size 			= 2;
	refreshText.value 			= initSettings.settings.refreshRate;
	refreshText.maxLength 		= 10;
	refreshText.style.display 	= "table-cell";
	refreshText.onchange = function() {
		initSettings.settings.refreshRate = this.value;
	}
	refreshLabel2 				= createDiv();
	refreshLabel2.innerText 	= "milliseconds";
	refreshLabel2.style.display = "table-cell";
	refreshHolder.appendChild(refreshLabel);
	refreshHolder.appendChild(refreshText);
	refreshHolder.appendChild(refreshLabel2);
	bottomButtonContainer 					= createDiv();
	bottomButtonContainer.style.width 		= "100%";
	bottomButtonContainer.style.textAlign 	= "right";
	bottomButtonContainer.style.marginTop 	= "20px";
	saveCloseButton = createButton("save and close");
	saveCloseButton.onclick = function() { 
		sf_write(JSON.stringify(initSettings), true, labels);
		settingsContainer.style.display = "none";
		dimmer.style.display = "none";
		settingsContainer.remove();
		dimmer.remove();
		refreshRate(initSettings.settings.refreshRate);
	}
	addButton = createButton("add");
	addButton.onclick = function() {
		settingsContainer.appendChild(buildAddLabels(settingsContainer, dimmer));
	}
	bottomButtonContainer.appendChild(refreshHolder);
	bottomButtonContainer.appendChild(addButton);
	bottomButtonContainer.appendChild(saveCloseButton);
	rulesCOntainer 					= createDiv();
	rulesCOntainer.style.overflowX 	= "scroll";
	rulesCOntainer.style.height 	= "350px";
	rulesCOntainer.style.outline 	= "2px solid rgb(183,199,207)";
	settingsContainer.appendChild(headerContainer);
	settingsContainer.appendChild(topButtonContainer);
	if(typeof(initSettings) == "undefined" || initSettings.length < 0) return;
	for(var i=0 ; i<initSettings.rules.length ; i++) {
		settings 				= createDiv();
		settings.style.width 	= "95%";
		settings.style.margin	="5px";
		settings.style.padding	="5px";
		settings.style.border 	= "1px solid #C0A2C7";
		rule[i] 				= createInput();
		textColor[i] 			= createInput();
		captionHolder[i] 		= createDiv();
		captionLabel 			= createDiv();
		captionLabel.innerText 	= initSettings.rules[i].caption.replace(initSettings.rules[i].variable, initSettings.rules[i].value);
		captionLabel.style.display 			= "inline";
		captionHolder[i].style.float 		="left";
		captionHolder[i].style.margin 		= "3px";
		captionHolder[i].style.textAlign 	= "left";
		captionHolder[i].appendChild(captionLabel);
		textColor[i].value 				= initSettings.rules[i].color;
		textColor[i].title 				= initSettings.rules[i].color;
		textColor[i].style.width 		= "100px";
		textColor[i].style.float 		= "right";
		textColor[i].style.display 		="table-cell";
		textColor[i].style.marginRight 	= "5px";
		textColor[i].setAttribute('colorid', 'sf|'+i)
		textColor[i].onchange = function() {
			var flag = this.getAttribute("colorid").split("|")[1];
			initSettings.rules[flag].color = this.value; 
		}
		textColor[i].setAttribute("type","color");
		textColor[i].setAttribute("class","color");
		rule[i] 				= createInput();
		rule[i].value 			= initSettings.rules[i].rule;
		rule[i].style.width 	= "70%";
		ruleLabel 				= createLabel();
		ruleLabel.innerText 	= "Rule: ";
		topSetCont 				= createDiv();
		topSetCont.style.display= "table";
		topSetCont.style.width 	= "100%";
		botSetCont 				= createDiv();
		botSetCont.style.display="table";
		botSetCont.style.width 	= "100%";
		botSetCont.style.textAlign = "left";
		deleteRule[i] = createButton("Delete");
		deleteRule[i].setAttribute("itemID", i);
		deleteRule[i].onclick = function() {
			initSettings.rules.splice(this.getAttribute("itemID"), 1);
			settingsContainer.style.display = "none";
			dimmer.style.display = "none";
			settingsContainer.remove();
			dimmer.remove();
			setTimeout(settingWindow("block"), 2000);
		}
		valueHolder[i] = createInput();
		if(initSettings.rules[i].editMode==1 || initSettings.rules[i].editMode==4) {
			valueHolder[i].value = initSettings.rules[i].value;
			valueHolder[i].id = "valueHolder";
			valueHolder[i].maxLength = 15;
			valueHolder[i].style.display = "inline";
			valueHolder[i].size = 1;
			valueHolder[i].setAttribute('valId', i)
			valueHolder[i].onchange = function() {
				var flag = this.getAttribute("valId");
				initSettings.rules[flag].value = this.value;
			}
			captionHolder[i].appendChild(valueHolder[i]);
		}
		topSetCont.appendChild(captionHolder[i]);
		topSetCont.appendChild(textColor[i]);
		if(initSettings.rules[i].editMode==1 || initSettings.rules[i].editMode==3) topSetCont.appendChild(deleteRule[i]);
		settings.appendChild(topSetCont);
		rulesCOntainer.appendChild(settings);
	}
	settingsContainer.appendChild(rulesCOntainer);
	settingsContainer.appendChild(bottomButtonContainer);
}

function buildAddLabels(settingsContainer, dimmer) {
	var addLabelsContainer,captionHolder,captionLabel,captionText,colorHolder,colorLabel,colorText,rulesHolder,rulesLabel,rulesText,varHolder,varLabel,varText,valueHolder,valueLabel,valueText,advanceHolder,checkAdvance,checkLabel,dynaAdvance,dynaLabel;
	var buttonContainer,saveBtn,closeBtn;

	addLabelsContainer 						= createDiv();
	addLabelsContainer.id 					= "addlabels"
	addLabelsContainer.style.outline 		= "3px solid #C0A2C7";
	addLabelsContainer.style.width 			= "100%";
	addLabelsContainer.style.marginTop 		= "20px";
	addLabelsContainer.style.marginBottom 	= "20px";
	addLabelsContainer.style.paddingTop 	= "20px";
	addLabelsContainer.style.paddingBottom 	= "20px";
	
	captionHolder 				= createDiv();
	captionHolder.style.display = "table";		
	captionLabel 				= createDiv();
	captionLabel.innerText 		= "Account: ";
	captionLabel.style.width	= "100px";
	captionLabel.style.display 	= "table-cell";
	captionText 				= createInput();
	captionText.type 			= "text";
	captionText.name 			= "caption";
	captionHolder.appendChild(captionLabel);
	captionHolder.appendChild(captionText);
	
	colorHolder 				= createDiv();
	colorHolder.style.display 	= "table";
	colorLabel 					= createDiv();
	colorLabel.innerText 		= "Color: ";
	colorLabel.style.width 		= "100px";
	colorLabel.style.display 	= "table-cell";
	colorText 					= createInput();
	colorText.type 				= "color";
	colorText.name 				= "color";
	colorHolder.appendChild(colorLabel);
	colorHolder.appendChild(colorText);
	
	rulesHolder 				= createDiv();
	rulesHolder.style.display 	= "table";
	rulesLabel 					= createDiv();
	rulesLabel.innerText 		= "Rules: ";
	rulesLabel.style.width 		= "100px";
	rulesLabel.style.display 	= "table-cell";
	rulesText 					= createInput();
	rulesText.type 				= "text";
	rulesText.name 				= "rules";
	
	varHolder 					= createDiv();
	varHolder.style.display 	= "table";
	varLabel 					= createDiv();
	varLabel.innerText 			= "Variable: ";
	varLabel.style.width 		= "100px";
	varLabel.style.display 		= "table-cell";
	varText 					= createInput();
	varText.type 				= "text";
	varText.name 				= "value";
	varText.value 				= "#XX";
	varText.setAttribute('disabled', 'disabled');
	
	valueHolder 				= createDiv();
	valueHolder.style.display 	= "table";
	valueLabel 					= createDiv();
	valueLabel.innerText 		= "Value: ";
	valueLabel.style.width 		= "100px";
	valueLabel.style.display 	= "table-cell";
	valueText 					= createInput();
	valueText.type 				= "text";
	valueText.name 				= "value";
	
	advanceHolder 				= createDiv();
	advanceHolder.style.width 	= "100%";	
	advanceHolder.style.display = "none";
	checkAdvance 				= createInput();
	checkAdvance.type 			= "checkbox";
	checkLabel 					= createLabel();
	checkLabel.innerText 		= "advance";
	dynaAdvance 				= createInput();
	dynaAdvance.type 			= "checkbox";
	dynaLabel					= createLabel();
	dynaLabel.innerText 		= "dynamic";
	checkAdvance.onchange = function() {
		if(checkAdvance.checked) {
			rulesHolder.appendChild(rulesLabel);
			rulesHolder.appendChild(rulesText);
			advanceHolder.appendChild(dynaAdvance);
			advanceHolder.appendChild(dynaLabel);
		} else {
			rulesHolder.removeChild(rulesLabel);
			rulesHolder.removeChild(rulesText);
			if(dynaAdvance.checked) {
				dynaAdvance.checked = false;
				varHolder.removeChild(varLabel);
				varHolder.removeChild(varText);
				valueHolder.removeChild(valueLabel);
				valueHolder.removeChild(valueText);
			}
			advanceHolder.removeChild(dynaAdvance);
			advanceHolder.removeChild(dynaLabel);
		}
	}
	dynaAdvance.onchange = function() {
		if(dynaAdvance.checked && checkAdvance.checked) {
			varHolder.appendChild(varLabel);
			varHolder.appendChild(varText);			
			valueHolder.appendChild(valueLabel);
			valueHolder.appendChild(valueText);
		} else {
			varHolder.removeChild(varLabel);
			varHolder.removeChild(varText);
			valueHolder.removeChild(valueLabel);
			valueHolder.removeChild(valueText);
		}
	}
	advanceHolder.appendChild(checkAdvance);
	advanceHolder.appendChild(checkLabel);
	
	buttonContainer 					= createDiv();
	buttonContainer.style.width 		= "100%";
	buttonContainer.style.textAlign 	= "right";
	buttonContainer.style.marginTop 	= "20px";
	saveBtn = createButton("Add to list");
	saveBtn.onclick = function() { 
		if((typeof(captionText.value) == "undefined" || captionText.value == ""))alert("Account is required.");
		else {
			var val 	= {};
			val.color 	= colorText.value;
			val.caption = captionText.value;
			if(checkAdvance.checked && dynaAdvance.checked){
				val.rule 		= rulesText.value;
				val.value 		= valueText.value;
				val.editMode 	= 1;
				val.variable 	= varText.value;
			}else{
				val.rule 		= "#ACCOUNT.toLowerCase().match('#XX'.toLowerCase()) || #PUBNAME.toLowerCase().match('#XX'.toLowerCase())";
				val.value 		= captionText.value;
				val.editMode 	= 3;
				val.variable 	= "#XX";
			}
			sf_append(val, labels);
			addLabelsContainer.style.display = "none";
			addLabelsContainer.remove();
			settingsContainer.style.display = "none"; 
			settingsContainer.remove();
			dimmer.style.display = "none"; 
			dimmer.remove();
			setTimeout(settingWindow("block"), 1000);
		}
	}
	closeBtn = createButton("close");
	closeBtn.onclick = function() { 
		addLabelsContainer.style.display = "none";
		addLabelsContainer.remove();
	}
	buttonContainer.appendChild(saveBtn);
	buttonContainer.appendChild(closeBtn);
	addLabelsContainer.appendChild(captionHolder);
	addLabelsContainer.appendChild(colorHolder);
	addLabelsContainer.appendChild(rulesHolder);
	addLabelsContainer.appendChild(varHolder);
	addLabelsContainer.appendChild(valueHolder);
	addLabelsContainer.appendChild(advanceHolder);
	addLabelsContainer.appendChild(buttonContainer);
	return addLabelsContainer;
}

function insertLegend(elID){ //legend 
	if(document.getElementById("legendsDiv"))document.getElementById("legendsDiv").remove();
	var el = document.getElementById(elID);
	initSettings = JSON.parse(_RESULT);
	if((el == null || typeof(el) == "undefined") && params.fcf) {
		setTimeout(insertLegend(params.fcf+"_rolodex"), 5000);
	} else {
		var legends=createLegends();
		el.parentElement.insertBefore(legends,el);
	}
}

function createLegends(){
	var legendsDiv = createDiv();
	legendsDiv.id = "legendsDiv";
	legendsDiv.style.float = "right";
	legendsDiv.innerHTML = "<b>Legend:</b>&nbsp;&nbsp;&nbsp;&nbsp;";
	if(typeof(_RESULT) == "undefined")initialSettings();
	if(typeof(initSettings) == "undefined" || initSettings.length < 0) return legendsDiv;
	for(var i=0 ; i<initSettings.rules.length ; i++) {
		var caption = initSettings.rules[i].caption.replace(initSettings.rules[i].variable, initSettings.rules[i].value);
		if(initSettings.rules[i].editMode == 1 || initSettings.rules[i].editMode == 4) {
			legendsDiv.innerHTML += "<span style=\"border-radius:3px;padding:4px;display:inline-block;background:" +initSettings.rules[i].color + ";\">" + caption + " " + initSettings.rules[i].value + "</span>&nbsp;&nbsp;";
		} else {
			legendsDiv.innerHTML += "<span style=\"border-radius:3px;padding:4px;display:inline-block;background:" +initSettings.rules[i].color + ";\">" + caption + "</span>&nbsp;&nbsp;";
		}
	}
	return legendsDiv;
}

function startSLATimerProcess() { //timer
	initSettings = buildInitSettings();
	insertLegend(params.fcf+"_rolodex");
	var slas = setInterval(getAllCaseStats,1000);
	refreshRate(JSON.parse(_RESULT).settings.refreshRate);
}

function alterName(name) {
	var cw = name, tempCaseOwner;
	if(name.indexOf(", ")>0) {
		tempCaseOwner = name.split(", ");
		cw = tempCaseOwner[1] + " " + tempCaseOwner[0];
	}
	return cw;
}

function getAllTabs() { //get all open tabs on Salesforce
	var navTab,caseTabWrapper,caseTabs,cases=[];

	navTab = top.document.getElementById("navigatortab");
	if(typeof(navTab) == "undefined" || navTab == null) return [];
	caseTabWrapper = navTab.children[0];
	caseTabs = caseTabWrapper.getElementsByClassName("tabText");
	for(var i=0; i<caseTabs.length; i++) cases.push(caseTabs[i]); 
	
	return cases;
}

function getAllCaseStats() {
	var caseTabs,caseNos,slas,caseColor,firstCase;

	slas		= document.getElementsByClassName("x-grid3-col-00NC0000005BOuj");
	tier 		= document.getElementById(params.fcf+"_listSelect").selectedOptions[0].innerText;
	rules 		= JSON.parse(_RESULT).rules;
	caseNos		= document.getElementsByClassName("x-grid3-col-CASES_CASE_NUMBER");
	caseTabs 	= getAllTabs();
	caseColor 	= "FFFFFF";
	firstCase 	= document.getElementsByClassName("x-grid3-row-first");
	if(tier == "Online Support Tier 1")
		caseOwner = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sw");
	else if(tier == "Online Support Tier 2")
		caseOwner = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sx");
	else if(tier == "Online Support Tier 3")
		caseOwner = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-OWNER_NAME");

	if(firstCase.length > 0){ 	//get list of cases on the queue and assign colors
		if(document.getElementsByClassName("dgmm").length>0){ console.log("do nothing");}
		else{		
			for(var i=0 ; i<datePerCase.length ; i++) {
				datePerCase[i].parentElement.parentElement.style.background = "white";
				datePerCase[i].parentElement.parentElement.removeAttribute("colors");
				tmpColor = "";
				for(var itr=0 ; itr<rules.length ; itr++) {
					var rule = rules[itr].rule;
					if(rules[itr].editMode) {
						rule = rules[itr].rule;
						for(var j=0 ; j<5 ; j++) rule = rule.replace(rules[itr].variable, rules[itr].value);
					}
					
					if(rules[itr].caption == "Assigned Cases") assignedColor = rules[itr].color;
					
					for(var vars=0 ; vars<definedVariables.length ; vars++) rule = rule.replace(definedVariables[vars].variable, definedVariables[vars].value);
					try{
						if(eval(rule) && datePerCase[i]) {
							if(itr >= 0 && itr < 5)	tmpColor = rules[itr].color;
							else getClrPrElem(datePerCase[i].parentElement.parentElement, rules[itr].color);
						}
						if(itr == rules.length-1 && tmpColor != "")	getClrPrElem(datePerCase[i].parentElement.parentElement, tmpColor);
					}catch(e){}
				}
				if(window.top.document.getElementById('userNavLabel').textContent.match( alterName(caseOwner[i].innerText) ))
					if(getSLA_NOW(slas[i].innerText) < 60) 
						getClrPrElem(datePerCase[i].parentElement.parentElement, assignedColor);
				
				//let it blink
				if(datePerCase[i].parentElement.parentElement.getAttribute("colors")) {
					var elemx = datePerCase[i].parentElement.parentElement;
					var colorsx = datePerCase[i].parentElement.parentElement.getAttribute("colors").split(",");
					blinkDiv(elemx, colorsx);
				}
			}	
		}
	}
	
	if(caseTabs.length  >0) { //get all case tabs
		for(var j=0 ; j<caseTabs.length ; j++) {
			caseTabs[j].parentElement.parentElement.parentElement.parentElement.style.background = "white";
			caseTabs[j].parentElement.parentElement.parentElement.parentElement.removeAttribute("colors");
			tmpColor="";
			for(var i=0 ; i<caseNos.length ; i++) {
				if(caseTabs[j].innerText.split(" ")[1] == caseNos[i].innerText){
					if(getSLA_NOW(slas[i].innerText)<0)	
						caseTabs[j].innerText = "Case: " + caseNos[i].innerText + " : Exceeded.";
					else 
						caseTabs[j].innerText="Case: " + caseNos[i].innerText + " : " + getSLA_NOW(slas[i].innerText) + " minutes left.";
					for(var itr=0 ; itr<rules.length ; itr++) {
						var rule = rules[itr].rule;
						for(var vars=0 ; vars<definedVariables.length ; vars++) {
							rule = rule.replace(definedVariables[vars].variable, definedVariables[vars].value);
							rule = rule.replace(rules[itr].variable, rules[itr].value);
						}
						try{ //blink the case tabs
							if(eval(rule) && caseTabs[j]) {
								if(itr>=0 && itr<5) {
									tmpColor = rules[itr].color;
								} else {
									getClrPrElem(caseTabs[j].parentElement.parentElement.parentElement.parentElement, rules[itr].color);
								}
							}
							if(itr == rules.length-1 && tmpColor != "") {
								getClrPrElem(caseTabs[j].parentElement.parentElement.parentElement.parentElement, tmpColor);
							}
						}catch(e){}
					}
					if(window.top.document.getElementById('userNavLabel').textContent.match( alterName(caseOwner[i].innerText) )){
						if(getSLA_NOW(slas[i].innerText) < 60) {
							getClrPrElem(caseTabs[j].parentElement.parentElement.parentElement.parentElement, assignedColor);
						}
					}
					
					if(caseTabs[j].parentElement.parentElement.parentElement.parentElement.getAttribute("colors")) {
						var elemx = caseTabs[j].parentElement.parentElement.parentElement.parentElement;
						var colorsx = caseTabs[j].parentElement.parentElement.parentElement.parentElement.getAttribute("colors").split(",");
						blinkDiv(elemx, colorsx);
					}
				}
			}
		}
	}
}

function getSLA_NOW(CASE_SLA){
	if(typeof(CASE_SLA) == "undefined" || CASE_SLA == null) return "";
	var NOW,SLA,monthDiff,days_remaining,hours_remaining,minutes_remaining,hours_remaining,total_result;
	
	NOW = new Date();
	SLA = new Date(CASE_SLA);
	if(NOW.getMonth()%4 == 0) daysInAMonth[1] = 29;
	monthDiff 			= SLA.getMonth() == NOW.getMonth() ? 0 : daysInAMonth[NOW.getMonth()];
	days_remaining		= SLA.getMonth() == NOW.getMonth() ? SLA.getDate() - NOW.getDate() : NOW > SLA ? SLA.getDate()-(monthDiff+NOW.getDate()) : Math.abs((SLA.getDate() + monthDiff) - NOW.getDate());
	hours_remaining		= (SLA.getHours() - NOW.getHours());
	minutes_remaining	= (SLA.getMinutes() - NOW.getMinutes());
	hours_remaining		= hours_remaining + (days_remaining * 24);
	total_result		= (hours_remaining * 60) + minutes_remaining;
	return total_result;
}

function blinkDiv(elem, colors) {
	var colorSize = colors.length;
	var itr = getCurrentSeconds()%colorSize;
	elem.style.background=colors[itr];
}

function getCurrentSeconds() { return  new Date().getSeconds();}

function getClrPrElem(elem, color) {
	try {
		var attr, clrs = [], result = "";
		if(elem.getAttribute("colors")!=null) {
			attr = elem.getAttribute("colors");
			clrs = attr.split(",");
		}
		if(color != "" || typeof(color) != "undefined" || color != null) {
			if(clrs.indexOf(color) == -1)
				clrs.push(color);
			for(var itr=0 ; itr<clrs.length ; itr++) {
				if(clrs[itr] != "") {
					result += clrs[itr];
					if(typeof(clrs[itr+1]) != "undefined") {
						result += ",";
					}
				}
			}
			elem.setAttribute("colors", result);
		}
	}catch(e) {}
}

function reminder(){ //reminder
	var inputButtons,reminderDiv,reminderLoc;
	
	try {
		inputButtons = document.getElementsByTagName("input");
		for(var itr in inputButtons){
			if(inputButtons[itr].value == "Save"){
				inputButtons[itr].onclick = addReminder;
			}
		}
		reminderDiv = createDiv();
		reminderLoc = document.querySelectorAll("div[id^=j_id0][id*=j_id100] .pbSubsection")[0]
		reminderDiv.innerText = "REMINDER:\n\n1.) Agency, Publisher, Advertiser, Campaign, and Primary Owner is set properly\n2.) Product Category should be related to the issue (Please change if it is not)\n3.) Case description should be summarized\n4.) UFFA SHOULD ALWAYS be filled out\n5.) Case reason should be related as much as possible don't use others\n6.) If there is an existing SR please indicate it as well\n7.) If you inserted a custom script please make sure to indicate this on the Custom script field on the bottom of the page.\n"
		reminderLoc.insertBefore(reminderDiv, reminderLoc.firstChild);
	} catch(e){}
}

function addReminder() {
	var UFFAField = document.getElementById("j_id0:j_id3:TheBlock:j_id93:j_id99");
	if (UFFAField.value.length < 10) {
		alert("Please fill out the UFFA field for this case");
		return false;
	} else return true;
}

function sf_popup(title, contents) { //popup
	if(document.getElementById("popupDimmer"))document.getElementById("popupDimmer").remove();
	if(document.getElementById("popupContainer"))document.getElementById("popupContainer").remove();
	var dimmer,popupContainer,closeButton,bottomContainer,topContainer,contentsContainer;
	
	dimmer 					= createDiv();
	dimmer.id 				= "popupDimmer";
	dimmer.style.top 		= "0px";
	dimmer.style.width 		= "1500px";
	dimmer.style.height 	= "1500px";
	dimmer.style.zIndex 	= "9999";
	dimmer.style.display 	= "block";
	dimmer.style.opacity 	= "0.5";
	dimmer.style.position 	= "fixed";
	dimmer.style.background = "black";
	document.body.appendChild(dimmer);
	
	popupContainer 					= createDiv();
	popupContainer.id 				= "popupContainer";
	popupContainer.style.top 		= "0px";
	popupContainer.style.left 		= String((window.innerWidth/2)-200)+"px";
	popupContainer.style.width 		= "400px";
	popupContainer.style.height 	= "auto";
	popupContainer.style.zIndex 	= "10000";
	popupContainer.style.zIndex		= "99999";
	popupContainer.style.margin 	= "20px 10px 20px 10px";
	popupContainer.style.outline 	= "2px solid rgb(183,199,207)";
	popupContainer.style.display 	= "block";
	popupContainer.style.textAlign 	= "center";
	popupContainer.style.background = "rgb(248,248,248)";
	popupContainer.style.position 	= "absolute";
	document.body.appendChild(popupContainer);
	
	closeButton = createButton("close");
	closeButton.onclick = function() { 
		popupContainer.style.display = "none";
		dimmer.style.display = "none";
		popupContainer.remove();
		dimmer.remove();
	}
	
	bottomContainer 					= createDiv();
	bottomContainer.style.right 		= "0";
	bottomContainer.style.bottom 		= "0";
	bottomContainer.style.position 		= "absolute";
	bottomContainer.style.marginBottom 	= "7px";	
	
	topContainer 					= createDiv();
	topContainer.innerHTML 			= title;//"<h1>Reminder</h1>";
	topContainer.style.top 			= "0";
	topContainer.style.left 		= "0";
	topContainer.style.width 		= "100%"
	topContainer.style.color 		= "rgb(68,68,68)";
	topContainer.style.padding 		= "5px 0px";
	topContainer.style.position 	= "absolute";
	topContainer.style.fontWeight 	= "bold";
	topContainer.style.background 	= "rgb(230,241,246)";
	topContainer.style.marginBottom = "7px";
	topContainer.style.borderBottom = "1px solid rgb(183,199,207)";
	
	contentsContainer 					= createDiv();
	contentsContainer.innerHTML 		= contents;
	contentsContainer.style.padding 	= "30px 10px 30px 10px";
	contentsContainer.style.background 	= "rgb(243,243,247)";

	bottomContainer.appendChild(closeButton);
	popupContainer.appendChild(topContainer);
	popupContainer.appendChild(contentsContainer);
	popupContainer.appendChild(bottomContainer);
}