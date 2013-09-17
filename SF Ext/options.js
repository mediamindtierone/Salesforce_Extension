// Save this script as `options.js`

// Saves options to localStorage.
function save_options() {
  var exceedcaseselect = document.getElementById("exceedcase");
  var exceedcasecolor = exceedcaseselect.children[exceedcaseselect.selectedIndex].value;
  localStorage["exceedcase_color"] = exceedcasecolor;
  
  var min15caseselect = document.getElementById("min15case");
  var min15casecolor = min15caseselect.children[min15caseselect.selectedIndex].value;
  localStorage["min15case_color"] = min15casecolor;
  
  var hour1caseselect = document.getElementById("hour1case");
  var hour1casecolor = hour1caseselect.children[hour1caseselect.selectedIndex].value;
  localStorage["hour1case_color"] = hour1casecolor;
  
  var inicaseselect = document.getElementById("inicase");
  var inicasecolor = inicaseselect.children[inicaseselect.selectedIndex].value;
  localStorage["inicase_color"] = inicasecolor;
  
  var msncaseselect = document.getElementById("msncase");
  var msncasecolor = msncaseselect.children[msncaseselect.selectedIndex].value;
  localStorage["msncase_color"] = msncasecolor;
  
  var assigncaseselect = document.getElementById("assigncase");
  var assigncasecolor = assigncaseselect.children[assigncaseselect.selectedIndex].value;
  localStorage["assigncase_color"] = assigncasecolor;

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}
// Restores select box state to saved value from localStorage.
function restore_options() {
  var exceedfavorite = localStorage["exceedcase_color"];
  var min15favorite = localStorage["min15case_color"];
  var hour1favorite = localStorage["hour1case_color"];
  var msnfavorite = localStorage["msncase_color"];
  var assignfavorite = localStorage["assigncase_color"];
  var inifavorite = localStorage["inicase_color"];
  if (!exceedfavorite || !min15favorite || !hour1favorite || !msnfavorite || !assignfavorite || !inifavorite) {
    return;
  }
  checkers("exceedcase",exceedfavorite);
  checkers("min15case",min15favorite);
  checkers("hour1case",hour1favorite);
  checkers("msncase",msnfavorite);
  checkers("assigncase",assignfavorite);
  checkers("inicase",inifavorite);
}
function checkers(obbj,fave) {
  var select = document.getElementById(obbj);
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == fave) {
      child.selected = "true";
      break;
    }
  }
}
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.method == "exceedcase_color")
      sendResponse({cookieName: localStorage["exceedcase_color"]});
	 if (request.method == "hour1case_color")
	  sendResponse({cookieName: localStorage["hour1case_color"]});
  });
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);