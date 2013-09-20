/*

	This plugin is using file handling for HTML5, please see URL: http://www.html5rocks.com/en/tutorials/file/filesystem/#toc-introduction
	
*/

var sfRefresh;
var datePerCase = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005BOuj");
var accountNamePerCase = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-ACCOUNT_NAME");
var pubNamePerCase = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8T4");
var caseOwner = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sw");
var iterationCount = document.getElementsByClassName("x-grid3-col x-grid3-cell x-grid3-td-00NC0000005C8Tc");
var productCategory = document.getElementsByClassName("x-grid3-col x-grid3-cell x-grid3-td-00NC0000005C8T2");
var tier;
var ownerName;
var definedVariables = [
	{variable:"#NOW", value:"new Date()"},
	{variable:"#CASESLA", value:"new Date(datePerCase[i].textContent)"},
	{variable:"#ACCOUNT", value:"accountNamePerCase[i].textContent"},
	{variable:"#PUBNAME", value:"pubNamePerCase[i].textContent"},
	{variable:"#PRODCAT", value:"productCategory[i].textContent"},
	{variable:"#ME", value:"window.top.document.getElementById('userNavLabel').textContent"},
	{variable:"#CASEOWNER", value:'alterName(caseOwner[i].innerText)'},
	{variable:"#ITERCNT", value:'alterName(iterationCount[i].innerText)'}
];
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
var fs = null;
var labels = "sfExtension_labels.txt";
var state = "";
var msg = '';
var persistenceType = window.TEMPORARY;
var fileSize = 1024*1024;
var _RESULT;
var initSettings;
var SLA, NOW, RES;
var days_remaining, minutes_remaining, total_result;
var regex = /[?&]([^=#]+)=([^&#]*)/g, 
	url = window.location.href, 
	params = {}, 
	match; 
while(match = regex.exec(url)) { params[match[1]] = match[2];}
console.log("sfmod.js loaded "+window.location.href);

if(params.fcf){
	if (window.requestFileSystem) {
		sf_read(labels);
		setTimeout(
			function() {
				if(typeof(_RESULT)=="undefined") {
					initialSettings();
					settingWindow("none");
				}
			}
		, 1000); //wait for the file system to check
	}	
	tier = document.getElementById(params.fcf+"_listSelect").selectedOptions[0].innerText;
	statPortion();
	refreshSF();
	reminder();
} else {//for individual case view	
	var caseContainer = document.getElementById("container");
	var caseStatus;
	var caseSla;
	if(typeof(caseContainer)!="undefined"){
		caseSla = document.getElementById("j_id0:onlinecase:j_id41:sla_tracking:j_id127").textContent;
		caseStatus = document.getElementById("j_id0:onlinecase:j_id41:j_id102:j_id103").textContent;
		var timeRemainingHolder = document.createElement("div");
		timeRemainingHolder.id="timeRemainingHolder";
		if(document.getElementById(timeRemainingHolder.id))document.getElementById(timeRemainingHolder.id).remove();
		timeRemainingHolder.style.fontSize = "1.8em";
		timeRemainingHolder.style.fontWeight = "normal";
		timeRemainingHolder.style.lineHeight = "1.1em";
		timeRemainingHolder.style.float = "left";
		timeRemainingHolder.id = "timeRemainingHolder";
		caseContainer.appendChild(timeRemainingHolder);
	}
	setInterval( function() {
		initSLA_NOW(caseSla);
		if(caseStatus!="Solution Proposed"){
		if(getSLA_NOW()>0)
			timeRemainingHolder.textContent = "Time Remaining Left: " + getSLA_NOW() + " minutes.";
		else
			timeRemainingHolder.textContent = "Time Remaining Left: Exceeded.";
			timeRemainingHolder.style.color = "CC0000";
			initSLA_NOW(caseSla);
			if(getSLA_NOW()< 60)
				blinkDiv(timeRemainingHolder, "1797c0");
		}
	}, 1000);
}

function refreshSF() {
	setTimeout(startSLATimerProcess, 4000);
	document.getElementById(params.fcf+"_wrapper").onmouseover = detectExceedInst;
}
//checks the Public checkbox when creating a new comment
if (document.getElementById("IsPublished") != undefined) {
	var a = document.getElementById("IsPublished");
	a.checked = true
}
//
if (document.getElementById("p6") != undefined) {	
	if (document.getElementById("p3") != undefined) {
		var getCase = document.getElementById("p3");
		var cNum = getCase.value
	} else {
		var getCase = document.getElementsByClassName("data2Col");
		var cNum = getCase[3].textContent
	}
	var subjectField = document.getElementById("p6");
	if (subjectField.value.match(cNum)) {
		console.log("Match")
	} else {
		subjectField.value = subjectField.value+" [" + cNum+ "]"
	}
}

function detectExceedDelay() {
	var detectTimer = setInterval(function() {
		clearInterval(detectTimer);
		detectExceedInst();	
	}, 3000);
}

function detectExceedInst() {
	if (window.requestFileSystem && _RESULT){
		insertLegend(params.fcf+"_rolodex");
	} else {
		return;
	}
}

function setupArray() {
	Array.prototype.contains = function(v) {
		for(var i = 0; i < this.length; i++) {
			if(this[i] === v) return true;
		}
		return false;
	};
	Array.prototype.unique = function() {
		var arr = [];
		for(var i = 0; i < this.length; i++) {
			if(!arr.contains(this[i])) {
				arr.push(this[i]);
			}
		}
		return arr; 
	}
}
//status for agents and engineers
function statPortion() {
	setupArray();
	if (!top.document.getElementById("optionButton")) {
		var imgnode = document.createElement('img');
		imgnode.src = chrome.runtime.getURL("images/stat.png");
		imgnode.id ="statButton";
		imgnode.setAttribute('style','Position:absolute');
		imgnode.onclick = function() {
			showStatFunc();
		}
		imgnode.style.left = String((window.innerWidth/2)-40) + "px";
		imgnode.style.cursor="pointer";
		imgnode.style.top = "1px";
		imgnode.style.height = "30px";
		imgnode.style.width = "30px";
		imgnode.style.align = "center";
		top.document.body.appendChild(imgnode);
		var optnode = document.createElement('img');
		optnode.src = chrome.runtime.getURL("images/settingIcon.png");
		optnode.setAttribute('style','Position:absolute');
		optnode.id ="optionButton";
		optnode.onclick = function() {
			initSettings = buildInitSettings();
			settingWindow("block");
		}
		optnode.style.left = String((window.innerWidth/2)) + "px";
		optnode.style.cursor="pointer";
		optnode.style.top = "1px";
		optnode.style.height = "30px";
		optnode.style.width = "30px";
		optnode.style.align = "center";
		top.document.body.appendChild(optnode);	
	}
}

function showStatFunc() {
	var nCase = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-CASES_STATUS");
	var hStat = aStat = nStat = rStat = dStat = 0;
	for (var q=0; q<nCase.length; q++) {
		switch (nCase[q].textContent) {
			case "Handling" : hStat++; break;
			case "Assigned" : aStat++; break;
			case "New" : nStat++; break;
			case "Returned to Support" : rStat++; break;
			case "De-escalated to Tier 1" : dStat++; break;
		}
	}			
	ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sw");
	tier = document.getElementById(params.fcf+"_listSelect").selectedOptions[0].innerText;
	if(tier=="Online Support Tier 1") {
		ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-OWNER_NAME");
	}else if(tier=="Online Support Tier 2") {
		ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sx");
	}else if(tier=="Online Support Tier 3") {
		ownerName = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-OWNER_NAME");
	}
	
	var ownerArray = [];
	for (var r=0;r<ownerName.length; r++) {
		ownerArray.push(ownerName[r].textContent);
	}
	owner = ownerArray.unique();	
	alert('Total number of case: '+nCase.length+'\n\nCase breakdown per status:\nHandling: '+hStat+'\nAssigned: '+aStat+'\nNew: '+nStat+'\nReturned to support: '+rStat+'\nDe-escalated T1: '+ dStat+'\n\nHandled and assigned cases per engineer: '+getOwner(owner));
}

function getOwner(vals) {
	var tempStr="";
	var tempNum=0;
	nArray = []
	for (var w = 0; w < vals.length; w++) {
		if (vals[w] != undefined && vals[w] != "Online Support Tier 1" && vals[w].length > 1) {
			cnt=0;
			for (var g = 0; g<ownerName.length; g++) {
				if (ownerName[g].textContent.match(vals[w])) {					
					cnt++;					
				}
			}
			tempStr += String("\n"+vals[w]+": "+cnt)
		}
	}	
	return tempStr
}
//file handling starts here
function errorHandler(e) { 
	msg = '';
	switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR:
			msg = 'QUOTA_EXCEEDED_ERR';
			break;
		case FileError.NOT_FOUND_ERR:
			msg = 'NOT_FOUND_ERR';
			if(typeof(initSettings)!="undefined")
				setTimeout(sf_write(JSON.stringify(initSettings), true, labels), 1000); //will persist
			break;
		case FileError.SECURITY_ERR:
			msg = 'SECURITY_ERR';
			break;
		case FileError.INVALID_MODIFICATION_ERR:
			msg = 'INVALID_MODIFICATION_ERR';
			break;
		case FileError.INVALID_STATE_ERR:
			msg = 'INVALID_STATE_ERR';
			break;
		default:
			msg = 'Unknown Error';
			break;
	};
	console.log('Error: ' + msg);	
}

function _CREATEFILE(filename) {
	window.requestFileSystem(persistenceType, fileSize, function(fs) {
		fs.root.getFile(filename, {create: true, exclusive: true}, function(fileEntry) {
			
		}, errorHandler);
	}, errorHandler);
}

function _WRITETOFILE(val, filename) {
	_RESULT=val;
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
				fileWriter.seek(fileWriter.length);//go to EOF and start writing there.
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
					_RESULT = this.result; //the contents of the file
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
  window.requestFileSystem(persistenceType, fileSize, function(filesystem) {
	fs = filesystem;
  }, errorHandler);
}

function sf_create(filename) {
	setTimeout(_CREATEFILE(filename), 2000);
}

function sf_write(val, willreplace, filename) {
	if(willreplace) {
		sf_delete(filename);
		sf_create(filename);
		setTimeout(_WRITETOFILE(val, filename),2000);
	} else {
		if(typeof(_RESULT)=="undefined") {
			setTimeout(_WRITETOFILE(val, filename),2000);
		}
	}
}

function sf_append(val, filename) {	
	var itr = initSettings.settings.reserveRules;
	var temp = [];
	for(var x=0 ; x<itr ;x++) {
		temp[x] = initSettings.rules[initSettings.rules.length- (x+1) ];
		console.log(">> " + temp[x]);
	}
	for(var x=0 ; x<itr ; x++)  {
		initSettings.rules.splice(initSettings.rules.length-1, 1);
	}
	initSettings.rules.push(val);
	for(var x=itr-1 ; x>-1 ; x--) {
		console.log(temp[x]);
		initSettings.rules.push(temp[x]);
	}
	sf_delete(labels);
	sf_write(JSON.stringify(initSettings), false, labels)
}

function sf_read(filename) {
	setTimeout(_READFROMFILE(filename), 2000);
	setTimeout(function() {
		if(typeof(_RESULT)=="undefined" || _RESULT == "_RESULT")
			console.log("sf_read " + _RESULT);
	}, 1000);
	return _RESULT;
}

function sf_delete(filename) {
	setTimeout(_DELETEFILE(filename), 2000);
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
//plugin settings
function buildInitSettings() {
	setTimeout(
		function() {
			if(typeof(_RESULT)=="undefined" || _RESULT == "undefined" || _RESULT == "") {
				initialSettings();
			}
		}
	, 1000);
	return JSON.parse(_RESULT);
}

function createButton(text) {
	var btn = document.createElement("a");
	btn.style.background = "#4d90fe";
	btn.style.padding = "2px";
	btn.style.margin = "5px";
	btn.style.border = "1px solid white";
	btn.style.outline = "1px solid #4d90fe"
	btn.style.fontWeight = "bold";
	btn.style.color = "white";
	btn.style.cursor = "pointer";
	btn.style.textDecoration = "none";
	btn.innerText = text;
	btn.onmouseover = function() { this.style.background = "orange"; }
	btn.onmouseout = function() { this.style.background = "#4d90fe"; }
	btn.onmousedown = function() { this.style.background = "red"; }
	btn.onmouseup = function() { this.style.background = "orange"; }
	return btn;
}

function settingWindow(e) {
	if(document.getElementById("settingsDimmer"))document.getElementById("settingsDimmer").remove();
	if(document.getElementById("settingsContainer"))document.getElementById("settingsContainer").remove();
	var dimmer = document.createElement("div");
	dimmer.id = "settingsDimmer";
	dimmer.style.position = "fixed";
	dimmer.style.zIndex = "9999";
	dimmer.style.display = e;
	dimmer.style.height = "1500px";
	dimmer.style.width = "1500px";
	dimmer.style.opacity = "0.5";
	dimmer.style.background = "black";
	dimmer.style.top = "0px";
	top.document.body.appendChild(dimmer);
	var settingsContainer = document.createElement("div");
	settingsContainer.setAttribute("style", "Position:absolute");
	settingsContainer.id = "settingsContainer";
	settingsContainer.style.display = e;
	settingsContainer.style.zIndex = "10000";
	settingsContainer.style.height = "auto";
	settingsContainer.style.width = "400px";
	settingsContainer.style.zIndex="99999";
	settingsContainer.style.textAlign = "center";
	settingsContainer.style.background = "white";
	settingsContainer.style.margin = "20px 10px 20px 10px";
	settingsContainer.style.padding = "30px 10px 30px 10px";
	settingsContainer.style.outline = "3px solid #4d90fe";
	settingsContainer.style.top = "0px";
	settingsContainer.style.left = String((window.innerWidth/2)-200)+"px";
	top.document.body.appendChild(settingsContainer);
	var headerContainer = document.createElement("div");
	headerContainer.style.textAlign = "center";
	var logoHandler = document.createElement("div");
	logoHandler.style.width = "100%";
	logoHandler.style.height = "105px";
	logoHandler.style.backgroundImage = 'url('+chrome.runtime.getURL("images/dgLogo.png")+')';
	logoHandler.style.backgroundRepeat = "no-repeat";
	var logoCaption = document.createElement("div");
	logoCaption.style.textAlign = "center";
	logoCaption.innerText = "SF Chrome Extension Settings";
	headerContainer.appendChild(logoHandler);
	var topButtonContainer = document.createElement("div");
	topButtonContainer.style.textAlign = "right";
	topButtonContainer.style.width = "100%";
	topButtonContainer.style.marginBottom = "20px";
	var closeButton = createButton("close");
	closeButton.onclick = function() { 
		settingsContainer.style.display = "none";
		dimmer.style.display = "none";
		settingsContainer.remove();
		dimmer.remove();
	}
	var resetButton = createButton("reset");
	resetButton.onclick = function() { 
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
	var refreshHolder = document.createElement("div");
	refreshHolder.style.float = "left";
	refreshHolder.style.display = "table";
	refreshHolder.style.textAlign = "left";
	var refreshLabel = document.createElement("div");
	refreshLabel.innerText = "Refresh Rate: ";
	refreshLabel.style.display = "table-cell";
	var refreshText = document.createElement("input");
	refreshText.type = "text";
	refreshText.name = "caption";
	refreshText.maxLength = 8;
	refreshText.size = 2;
	refreshText.value = initSettings.settings.refreshRate;
	refreshText.style.display = "table-cell";
	refreshText.onchange = function() {
		initSettings.settings.refreshRate = this.value;
	}
	var refreshLabel2 = document.createElement("div");
	refreshLabel2.innerText = "milliseconds";
	refreshLabel2.style.display = "table-cell";
	refreshHolder.appendChild(refreshLabel);
	refreshHolder.appendChild(refreshText);
	refreshHolder.appendChild(refreshLabel2);
	var bottomButtonContainer = document.createElement("div");
	bottomButtonContainer.style.textAlign = "right";
	bottomButtonContainer.style.width = "100%";
	bottomButtonContainer.style.marginTop = "20px";
	var saveButton = createButton("save");
	saveButton.onclick = function() { 
		setTimeout(sf_write(JSON.stringify(initSettings), true, labels), 1000);
		refreshRate(initSettings.settings.refreshRate);
	}
	var saveCloseButton = createButton("save and close");
	saveCloseButton.onclick = function() { 
		setTimeout(sf_write(JSON.stringify(initSettings), true, labels), 1000);
		settingsContainer.style.display = "none";
		dimmer.style.display = "none";
		settingsContainer.remove();
		dimmer.remove();
		refreshRate(initSettings.settings.refreshRate);
	}
	var addButton = createButton("add");
	addButton.onclick = function() {
		settingsContainer.appendChild(buildAddLabels(settingsContainer, dimmer));
	}
	bottomButtonContainer.appendChild(refreshHolder);
	bottomButtonContainer.appendChild(addButton);
	bottomButtonContainer.appendChild(saveButton);
	bottomButtonContainer.appendChild(saveCloseButton);
	var captionHolder = [];
	var valueHolder = [];
	var textColor = [];
	var rule = [];
	var deleteRule = [];
	settingsContainer.appendChild(headerContainer);
	settingsContainer.appendChild(topButtonContainer);
	if(typeof(initSettings)=="undefined" || initSettings.length < 0) return;
	for(var i=0 ; i<initSettings.rules.length ; i++) {
		var settings = document.createElement("div");
		settings.style.width = "95%";
		settings.style.margin="5px";
		settings.style.padding="5px";
		settings.style.border = "1px solid #C0A2C7";
		captionHolder[i] = document.createElement("div");
		textColor[i] = document.createElement("input");
		rule[i] = document.createElement("input");
		var captionLabel = document.createElement("div");
		captionLabel.innerText = initSettings.rules[i].caption.replace(initSettings.rules[i].variable, initSettings.rules[i].value);
		captionLabel.style.display = "inline";
		captionHolder[i].style.float ="left";
		captionHolder[i].style.textAlign = "left";
		captionHolder[i].style.margin = "3px";
		captionHolder[i].appendChild(captionLabel);
		textColor[i].setAttribute("type","color");
		textColor[i].setAttribute("class","color");
		textColor[i].style.display ="table-cell";
		textColor[i].style.width = "100px";
		textColor[i].style.float = "right";
		textColor[i].style.marginRight = "5px";
		textColor[i].value = initSettings.rules[i].color;
		textColor[i].setAttribute('colorid', 'sf|'+i)
		textColor[i].onchange = function() {
			var flag = this.getAttribute("colorid").split("|")[1];
			initSettings.rules[flag].color = this.value; 
		}
		rule[i] = document.createElement("input");
		rule[i].style.width = "70%";
		rule[i].value = initSettings.rules[i].rule;
		var ruleLabel = document.createElement("label");
		ruleLabel.innerText = "Rule: ";
		var topSetCont = document.createElement("div");
		topSetCont.setAttribute("style","display:table");
		topSetCont.style.width = "100%";
		var botSetCont = document.createElement("div");
		botSetCont.setAttribute("style","display:table");
		botSetCont.style.width = "100%";
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
		valueHolder[i] = document.createElement("input");
		if(initSettings.rules[i].editMode==1 || initSettings.rules[i].editMode==4) {
			valueHolder[i].value = initSettings.rules[i].value;
			valueHolder[i].id = "valueHolder";
			valueHolder[i].maxLength = 5;
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
		if(initSettings.rules[i].editMode==1 || initSettings.rules[i].editMode==3) {
			topSetCont.appendChild(deleteRule[i]);
		}
		settings.appendChild(topSetCont);
		settingsContainer.appendChild(settings);
	}
	settingsContainer.appendChild(bottomButtonContainer);
}

function buildAddLabels(settingsContainer, dimmer) {
	var addLabelsContainer = document.createElement("div");
	addLabelsContainer.id = "addlabels"
	addLabelsContainer.style.outline = "3px solid #C0A2C7";
	addLabelsContainer.style.width = "100%";
	addLabelsContainer.style.marginTop = "20px";
	addLabelsContainer.style.marginBottom = "20px";
	addLabelsContainer.style.paddingTop = "20px";
	addLabelsContainer.style.paddingBottom = "20px";
	var captionHolder = document.createElement("div");
	captionHolder.style.display = "table";		
	var captionLabel = document.createElement("div");
	captionLabel.innerText = "Caption: ";
	captionLabel.style.display = "table-cell";
	captionLabel.style.width = "100px";
	var captionText = document.createElement("input");
	captionText.type = "text";
	captionText.name = "caption";
	captionHolder.appendChild(captionLabel);
	captionHolder.appendChild(captionText);
	var colorHolder = document.createElement("div");
	colorHolder.style.display = "table";
	var colorLabel = document.createElement("div");
	colorLabel.innerText = "Color: ";
	colorLabel.style.display = "table-cell";
	colorLabel.style.width = "100px";
	var colorText = document.createElement("input");
	colorText.type = "color";
	colorText.name = "color";
	colorHolder.appendChild(colorLabel);
	colorHolder.appendChild(colorText);
	var rulesHolder = document.createElement("div");
	rulesHolder.style.display = "table";
	var rulesLabel = document.createElement("div");
	rulesLabel.innerText = "Rules: ";
	rulesLabel.style.display = "table-cell";
	rulesLabel.style.width = "100px";
	var rulesText = document.createElement("input");
	rulesText.type = "text";
	rulesText.name = "rules";
	var varHolder = document.createElement("div");
	varHolder.style.display = "table";
	var varLabel = document.createElement("div");
	varLabel.innerText = "Variable: ";
	varLabel.style.display = "table-cell";
	varLabel.style.width = "100px";
	var varText = document.createElement("input");
	varText.type = "text";
	varText.setAttribute('disabled', 'disabled');
	varText.name = "value";
	varText.value = "#XX";
	var valueHolder = document.createElement("div");
	valueHolder.style.display = "table";
	var valueLabel = document.createElement("div");
	valueLabel.innerText = "Value: ";
	valueLabel.style.display = "table-cell";
	valueLabel.style.width = "100px";
	var valueText = document.createElement("input");
	valueText.type = "text";
	valueText.name = "value";
	var advanceHolder = document.createElement("div");
	advanceHolder.style.display = "none";
	advanceHolder.style.width = "100%";	
	var checkAdvance = document.createElement("input");
	var checkLabel = document.createElement("label");
	checkLabel.innerText = "advance";
	checkAdvance.type = "checkbox";
	var dynaAdvance = document.createElement("input");
	var dynaLabel = document.createElement("label");
	dynaLabel.innerText = "dynamic";
	dynaAdvance.type = "checkbox";
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
	var buttonContainer = document.createElement("div");
	buttonContainer.style.textAlign = "right";
	buttonContainer.style.width = "100%";
	buttonContainer.style.marginTop = "20px";
	var saveBtn = createButton("save");
	saveBtn.onclick = function() { 
		if((typeof(captionText.value) == "undefined" || captionText.value == "") && (typeof(colorText.value) == "undefined" || colorText.value == "") && (typeof(rulesText.value) == "undefined")) {
			alert("Caption and Color is required.");
		} else {
			var val = {};
			val.caption = captionText.value;
			val.color = colorText.value;
			if(checkAdvance.checked && dynaAdvance.checked){
				val.rule = rulesText.value;
				val.editMode = 1;
				val.variable = varText.value;
				val.value = valueText.value;
			}else{
				val.rule = "#ACCOUNT.toLowerCase().match('#XX'.toLowerCase()) || #PUBNAME.toLowerCase().match('#XX'.toLowerCase())";//"#ACCOUNT.match('#XX')";//
				val.editMode = 3;
				val.variable = "#XX";
				val.value = captionText.value;
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
	var closeBtn = createButton("close");
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

//legend 
function insertLegend(elID){
	if(document.getElementById("legendsDiv"))document.getElementById("legendsDiv").remove();
	var el=document.getElementById(elID);

	initSettings = JSON.parse(_RESULT);
	if((el == null || typeof(el)=="undefined") && params.fcf) {
		setTimeout(insertLegend(params.fcf+"_rolodex"), 5000);
	} else {
		var legends=createLegends();
		el.parentElement.insertBefore(legends,el);
	}
}

function createLegends(){
	var legendsDiv=document.createElement("div");
	legendsDiv.id="legendsDiv";
	legendsDiv.style.float="right";
	legendsDiv.innerHTML="<b>Legend:</b>&nbsp;&nbsp;&nbsp;&nbsp;";
	if(typeof(_RESULT)=="undefined")initialSettings();
	if(typeof(initSettings)=="undefined" || initSettings.length < 0) return legendsDiv;
	for(var i=0 ; i<initSettings.rules.length ; i++) {
		var caption = initSettings.rules[i].caption.replace(initSettings.rules[i].variable, initSettings.rules[i].value);
		if(initSettings.rules[i].editMode == 1 || initSettings.rules[i].editMode == 4) {
			legendsDiv.innerHTML+="<span style=\"border-radius:3px;padding:4px;display:inline-block;background:"+initSettings.rules[i].color+";\">"+ caption + " " + initSettings.rules[i].value + "</span>&nbsp;&nbsp;";
		} else {
			legendsDiv.innerHTML+="<span style=\"border-radius:3px;padding:4px;display:inline-block;background:"+initSettings.rules[i].color+";\">"+ caption +"</span>&nbsp;&nbsp;";
		}
	}
	return legendsDiv;
}

//timer
function refreshRate(rate){
	console.log("setting refresh rate to " + rate);
	clearInterval(sfRefresh);
	sfRefresh = setInterval(function() {	
		document.getElementById(params.fcf+"_refresh").click();		
		detectExceedDelay();		
	} , rate);
}

function startSLATimerProcess() {
	initSettings = buildInitSettings();
	var sla=setInterval(getAllCaseStats,1000);
	refreshRate(JSON.parse(_RESULT).settings.refreshRate);
}

function alterName(name) {
	var cw = name;
	var tempCaseOwner;
	if(name.indexOf(", ")>0) {
		tempCaseOwner = name.split(", ");
		cw = tempCaseOwner[1] + " " + tempCaseOwner[0];
	}
	return cw;
}

function getAllTabs() { //get all open tabs on Salesforce
	var navTab=top.document.getElementById("navigatortab");
	if(typeof(navTab)=="undefined" || navTab==null) return [];
	var caseTabWrapper=navTab.children[0];
	var caseTabs=caseTabWrapper.getElementsByClassName("tabText");
	var cases=[];
	for(var i=0;i<caseTabs.length;i++){
		cases.push(caseTabs[i]);
	}
	return cases;
}

function getAllCaseStats() {
	var caseTabs = getAllTabs();
	var caseNos=document.getElementsByClassName("x-grid3-col-CASES_CASE_NUMBER");
	var slas=document.getElementsByClassName("x-grid3-col-00NC0000005BOuj");
	var caseColor = "FFFFFF";
	firstCase = document.getElementsByClassName("x-grid3-row-first");
	rules = JSON.parse(_RESULT).rules;
	tier = document.getElementById(params.fcf+"_listSelect").selectedOptions[0].innerText;
	if(tier=="Online Support Tier 1") {
		caseOwner = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sw");
	}else if(tier=="Online Support Tier 2") {
		caseOwner = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-00NC0000005C8Sx");
	}else if(tier=="Online Support Tier 3") {
		caseOwner = document.getElementsByClassName("x-grid3-cell-inner x-grid3-col-OWNER_NAME");
	}
	//get list of cases on the queue
	if(firstCase.length>0){
		if(document.getElementsByClassName("dgmm").length>0){ console.log("do nothing");}
		else{		
			for(var i=0 ; i<datePerCase.length ; i++) {
				datePerCase[i].parentElement.parentElement.style.background="white";
				for(var itr=0 ; itr<rules.length ; itr++) {
					var rule = rules[itr].rule;
					if(rules[itr].editMode) {
						rule = rules[itr].rule;
						for(var j=0 ; j<5 ; j++) {
							rule = rule.replace(rules[itr].variable, rules[itr].value);
						}
					}
					for(var vars=0 ; vars<definedVariables.length ; vars++) {
						rule = rule.replace(definedVariables[vars].variable, definedVariables[vars].value);
					}
					try{
					if(eval(rule) && datePerCase[i]) {
						datePerCase[i].parentElement.parentElement.style.background=rules[itr].color
					}
					}catch(e){}
				}
				initSLA_NOW(slas[i].innerText);
				if(window.top.document.getElementById('userNavLabel').textContent.match( alterName(caseOwner[i].innerText) )){
					initSLA_NOW(slas[i].innerText);
					if(getSLA_NOW()< 60) {
						caseColor = rules[rules.length-2].color;//GET THE ASSIGNED CASE COLOR -> maybe add it on the data.settings.assignedColor
						blinkDiv(datePerCase[i].parentElement.parentElement, caseColor);
					}
				}
			}	
		}
	}
	//get all case tabs
	if(caseTabs.length>0) {
		for(var j=0 ; j<caseTabs.length ; j++) {
			for(var i=0 ; i<caseNos.length ; i++) {
				if(caseTabs[j].innerText.split(" ")[1]==caseNos[i].innerText){
					initSLA_NOW(slas[i].innerText);
					if(getSLA_NOW()<0)
						caseTabs[j].innerText="Case: " + caseNos[i].innerText + " : Exceeded.";
					else
						caseTabs[j].innerText="Case: " + caseNos[i].innerText + " : " + getSLA_NOW() + " minutes left.";
					for(var itr=0 ; itr<rules.length ; itr++) {
						var rule = rules[itr].rule;
						for(var vars=0 ; vars<definedVariables.length ; vars++) {
							rule = rule.replace(definedVariables[vars].variable, definedVariables[vars].value);
							rule = rule.replace(rules[itr].variable, rules[itr].value);
						}
						if(eval(rule) && datePerCase[i]) {
							caseTabs[j].parentElement.parentElement.parentElement.parentElement.style.background=rules[itr].color;
						}
					}
				}
			}
		}
	}
}

function initSLA_NOW(CASE_SLA) {
	SLA = new Date(CASE_SLA)
	NOW = new Date();
	RES=new Date(SLA-NOW);
}

function getSLA_NOW(){
	NOW = new Date();
	days_remaining=SLA.getDate()-NOW.getDate();
	hours_remaining=(SLA.getHours() - NOW.getHours());
	minutes_remaining=(SLA.getMinutes() - NOW.getMinutes());
	hours_remaining=hours_remaining+(days_remaining*24);
	total_result=(hours_remaining*60)+minutes_remaining;
	return total_result;
}

//blinks your case that is going to exceed within a specified time
function blinkDiv(element, color) {
	if(getCurrentSeconds()%2){
		element.style.background=color;
	}else{
		element.style.background="white";
	}
}

function getCurrentSeconds() {
	return  new Date().getSeconds();
}

//reminder
function reminder(){
	var inputButtons = document.getElementsByTagName("input");
	for(var itr in inputButtons){
		if(inputButtons[itr].value=="Save"){
			inputButtons[itr].onclick = addReminder;
		}
	}
	try {
	var reminderDiv = document.createElement("div");
	var reminderLoc = document.querySelectorAll("div[id^=j_id0][id*=j_id100] .pbSubsection")[0]
	reminderDiv.innerText = "REMINDER:\n\n1.) Agency, Publisher, Advertiser, Campaign, and Primary Owner is set properly\n2.) Product Category should be related to the issue (Please change if it is not)\n3.) Case description should be summarized\n4.) UFFA SHOULD ALWAYS be filled out\n5.) Case reason should be related as much as possible don't use others\n6.) If there is an existing SR please indicate it as well\n7.) If you inserted a custom script please make sure to indicate this on the Custom script field on the bottom of the page.\n"
	reminderLoc.insertBefore(reminderDiv, reminderLoc.firstChild);
	} catch(e){}
}

function addReminder() {
	var UFFAField = document.getElementById("j_id0:j_id3:TheBlock:j_id93:j_id99");
	if (UFFAField.value.length < 10) {
		alert("Please fill out the UFFA field for this case");
		return false;
	} else {
		return true;
	}
}