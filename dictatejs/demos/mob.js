// Global UI elements:
//  - log: event log
//  - trans: transcription window

// Global objects:
//  - isConnected: true iff we are connected to a worker
//  - tt: simple structure for managing the list of hypotheses
//  - dictate: dictate object with control methods 'init', 'startListening', ...
//       and event callbacks onResults, onError, ..., ec007e42.ngrok.io
var serverNames = ["Recognition Server", "Keyword Server", "Phoneme Server", "Grapheme Server"];
var servers = ["ws://005bce85.ngrok.io/client/ws/speech","ws://dbea13a5.ngrok.io/client/ws/speech", "ws://2af10418.ngrok.io/client/ws/speech","grapheme url"];
var serverStatus = ["ws://005bce85.ngrok.io/client/ws/status","ws://dbea13a5.ngrok.io/client/ws/status","ws://2af10418.ngrok.io/client/ws/status","grapheme server status"];
var recognitionWords = ["okkeyword.","okphoneme.","okgrapheme."];
var isConnected = false;
var currentServer = serverNames[0];
var tt = new Transcription();

var startPosition = 0;
var endPosition = 0;
var doUpper = false;
var doPrependSpace = true;


function getKeywordMeaning(key)
{
  var processedKey="";
  if(key == "close." || key == "closebracket.")
  {
    processedKey=")";
  }
  else if(key == "closeflower.")
  {
    processedKey="}";
  }
  else if(key == "console.")
  {
    processedKey = "console";
  }
  else if(key == "divide.")
  {
    processedKey = "/";
  }
  else if(key == "dot." || key == "point.")
  {
    processedKey = ".";
  }
  else if(key == "else.")
  {
    processedKey = "else";
  }
  else if(key == "equals.")
  {
    processedKey = "=";
  }
  else if(key == "erase.")
  {
    processedKey = "";//This has to be implemented to undo the previous statement
  }
  else if(key == "false.")
  {
    processedKey = "false";
  }
  else if(key == "for.")
  {
    processedKey = "for";
  }
  else if(key == "function.")
  {
    processedKey = "function";
  }
  else if(key == "if.")
  {
    processedKey = "if";
  }
  else if(key == "log.")
  {
    processedKey = "log";
  }
  else if(key == "minus.")
  {
    processedKey = "-";
  }
  else if(key == "multiply.")
  {
    processedKey = "*";
  }
  else if (key == "nextline.")
  {
    processedKey = "\n";
  }
  else if (key == "open." || key == "openbracket.")
  {
    processedKey = "(";
  }
  else if(key == "openflower.")
  {
    processedKey = "{";
  }
  else if (key == "plus.")
  {
    processedKey = "+";
  }
  else if (key == "quote.")
  {
    processedKey = "\"";
  }
  else if (key == "return.")
  {
    processedKey = "return";
  }
  else if (key == "semicolon.")
  {
    processedKey = ";";
  }
  else if (key == "space.")
  {
    processedKey = " ";
  }
  else if (key == "switch.") //this keyword is used to switch back to the recognition server
  {
    processedKey = "switch";
  }
  else if(key == "change.")
  {
    processedKey = "change";
  }
  else if(key == "true.")
  {
    processedKey = "true";
  }
  else if(key == "var.")
  {
    processedKey = "var.";
  }
  else if(key == "while.")
  {
    processedKey = "while";
  }
  return processedKey;
}

//This function has been modified to return lowercase strings
function capitaliseFirstLetter(string)
{
    return string.toLowerCase();
}

function prettyfyHyp(text, doCapFirst, doPrependSpace) {
	if (doCapFirst) {
		text = capitaliseFirstLetter(text);
	}
	tokens = text.split(" ");
	text = "";
	if (doPrependSpace) {
		text = " ";
	}
	doCapitalizeNext = false;
	tokens.map(function(token) {
		if (text.trim().length > 0) {
			text = text + " ";
		}
		if (doCapitalizeNext) {
			text = text + capitaliseFirstLetter(token);
		} else {
			text = text + token;
		}
		if (token == "." ||  /\n$/.test(token)) {
			doCapitalizeNext = true;
		} else {
			doCapitalizeNext = false;
		}
	});

	text = text.replace(/ ([,.!?:;])/g,  "\$1");
	text = text.replace(/ ?\n ?/g,  "\n");
	return text;
}


var dictate = new Dictate({
		server : servers[0],
		serverStatus : serverStatus[0],
		recorderWorkerPath : '../lib/recorderWorker.js',
		onReadyForSpeech : function() {
			isConnected = true;
			__message("READY FOR SPEECH");
			$("#buttonToggleListening").html('Stop');
			$("#buttonToggleListening").addClass('highlight');
			$("#buttonToggleListening").prop("disabled", false);
			$("#buttonCancel").prop("disabled", false);
			startPosition = $("#trans").prop("selectionStart");
			endPosition = startPosition;
			var textBeforeCaret = $("#trans").val().slice(0, startPosition);
			if ((textBeforeCaret.length == 0) || /\. *$/.test(textBeforeCaret) ||  /\n *$/.test(textBeforeCaret)) {
				doUpper = true;
			} else {
				doUpper = false;
			}
			doPrependSpace = (textBeforeCaret.length > 0) && !(/\n *$/.test(textBeforeCaret));
		},
		onEndOfSpeech : function() {
			__message("END OF SPEECH");
			$("#buttonToggleListening").html('Stopping...');
			$("#buttonToggleListening").prop("disabled", true);
		},
		onEndOfSession : function() {
			isConnected = false;
			__message("END OF SESSION");
			$("#buttonToggleListening").html('Start');
			$("#buttonToggleListening").removeClass('highlight');
			$("#buttonToggleListening").prop("disabled", false);
			$("#buttonCancel").prop("disabled", true);
		},
		onServerStatus : function(json) {
			__serverStatus(json.num_workers_available);
			$("#serverStatusBar").toggleClass("highlight", json.num_workers_available == 0);
			// If there are no workers and we are currently not connected
			// then disable the Start/Stop button.
			if (json.num_workers_available == 0 && ! isConnected) {
				$("#buttonToggleListening").prop("disabled", true);
			} else {
				$("#buttonToggleListening").prop("disabled", false);
			}
		},
		onPartialResults : function(hypos) {
			hypText = prettyfyHyp(hypos[0].transcript, doUpper, doPrependSpace);
			val = $("#trans").val();
			$("#trans").val(val.slice(0, startPosition) + hypText + val.slice(endPosition));
			endPosition = startPosition + hypText.length;
			$("#trans").prop("selectionStart", endPosition);
		},
		onResults : function(hypos) {
			hypText = hypos[0].transcript;//prettyfyHyp(hypos[0].transcript, doUpper, doPrependSpace);
      $("#recognizedWords").val(hypText);
      if(currentServer == serverNames[0])
      {
          if(recognitionWords.includes(hypText))
          {
            var serverIndex;
            if(hypText == recognitionWords[0])
            {
              serverIndex = 1;
            }
            else if(hypText == recognitionWords[1])
            {
              serverIndex = 2;
            }
            else
            {
              serverIndex = 3;
            }
            __changeServer(serverIndex);
          }
          hypText=""; //This has to be an empty string
      }
      else if(currentServer == serverNames[1])//keyword server
      {
          hypText = getKeywordMeaning(hypText);
          if(hypText == "change") //switch keyword is used to switch back to the recognition server
          {
            hypText=""; //
            __changeServer(0);
          }
      }
      else if(currentServer == serverNames[2])//phoneme server
      {
          if(hypText == "change.") //change keyword is used to switch back to the recognition server
          {
            hypText=""; //
            __changeServer(0);
          }
      }
      else if(currentServer == serverNames[3])//grapheme server
      {
          if(hypText == "change.") //change keyword is used to switch back to the recognition server
          {
            hypText=""; //
            __changeServer(0);
          }
      }
			val = $("#trans").val();
			$("#trans").val(val.slice(0, startPosition) + hypText + val.slice(endPosition));
			startPosition = startPosition + hypText.length;
			endPosition = startPosition;
			$("#trans").prop("selectionStart", endPosition);
			if (/\. *$/.test(hypText) ||  /\n *$/.test(hypText)) {
				doUpper = true;
			} else {
				doUpper = false;
			}
			doPrependSpace = (hypText.length > 0) && !(/\n *$/.test(hypText));
		},
		onError : function(code, data) {
			dictate.cancel();
			__error(code, data);
			// TODO: show error in the GUI
		},
		onEvent : function(code, data) {
			__message(code, data);
		}
	});

// Private methods (called from the callbacks)
function __message(code, data) {
	log.innerHTML = "msg: " + code + ": " + (data || '') + "\n" + log.innerHTML;
}

function __error(code, data) {
	log.innerHTML = "ERR: " + code + ": " + (data || '') + "\n" + log.innerHTML;
}

function __serverStatus(msg) {
	serverStatusBar.innerHTML = msg;
}

function __updateTranscript(text) {
	$("#trans").val(text);
}

function __changeServer(serverIndex)
{
  currentServer = serverNames[serverIndex];
  $("#server").text(currentServer);
  dictate.cancel();
  dictate.setServer(servers[serverIndex]);
  dictate.setServerStatus(serverStatus[serverIndex]);
  dictate.startListening();
}


// Public methods (called from the GUI)
function toggleListening() {
	if (isConnected) {
		dictate.stopListening();
	} else {
		dictate.startListening();
	}
}

function cancel() {
	dictate.cancel();
}


var stores = [];
var oldf = console.log;
console.log = function(m){
   stores.push(arguments);
   oldf.apply(console, arguments);
}

function execute()
{
  var code = $("#trans").val();
  var result = new Function(code)();
  for(var i=0; i<stores.length;i++)
  {
    store = stores[i];
    for(x in store)
    {
       $("#exec").val($("#exec").val() + store[x] + "\n");
    }
  }
  stores=[];
}

function clearTranscription() {
	$("#trans").val("");
	// needed, otherwise selectionStart will retain its old value
	$("#trans").prop("selectionStart", 0);
	$("#trans").prop("selectionEnd", 0);
}

$(document).ready(function()
{
	dictate.init();
  $("#server").text(currentServer);
  /*
	$("#servers").change(function() {
		dictate.cancel();
		var servers = $("#servers").val().split('|');
		dictate.setServer(servers[0]);
		dictate.setServerStatus(servers[1]);
	});
  */

});
