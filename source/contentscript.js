function jargonPageSearch(jargon) {
  //gets the data from browser storage and converts it from a string to a javascript object
  //if any keys have more than one word create an array of words
  var data = (function() {
    var array = [],
      key;
    for (var key in jargon) {
      var words = key.split(" ");
      array.push({
        key: key,
        words: key.split(" "),
        description: jargon[key]
      });
    }
    //sort the array so longer phrases take priority
    return array.sort(function(a, b) {
      return b.words.length - a.words.length;
    });
  })();

  function compareStrings(str1, str2) {
    return (
      (str1.indexOf(str2) === 0 || str1 === str2 + "s") &&
      str1.length <= str2.length + 1
    );
  }

  //this code loops through the entire DOM, looking for html elements/ text elements
  //and within those it looks for words matching the uploaded data set
  //and then once it's found matching words they are all added to the: pairs array
  //and once the whole DOM has been search the DOM is updated again based the pairs array
  //The function is anonymous, so the code is self contained. It's executed onces when the window loads
  (function() {
    var elements = document.getElementsByTagName("*");
    var pairs = [];
    var timeout = 0;
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];

      for (var j = 0; j < element.childNodes.length; j++) {
        var node = element.childNodes[j];
        if (node.nodeType === 3) {
          var text = node.nodeValue;
          var textArray = text.split(" ");
          var replacedArray = [];
          var changed = false;
          var matchedArray = [];
          for (var k = 0; k < textArray.length; k++) {
            replacedArray.push(textArray[k]);
            for (var l = 0; l < data.length; l++) {
              for (var m = 0; m < data[l].words.length; m++) {
                var wordHtmlOrignal = textArray[k + m],
                  wordHtmlLC,
                  wordData = data[l].words[m].toLowerCase();
                if (wordHtmlOrignal && wordData) {
                  wordHtmlLC = wordHtmlOrignal
                    .toLowerCase()
                    .replace(/^[a-z ]$/i, "");
                  if (compareStrings(wordHtmlLC, wordData)) {
                    matchedArray.push(wordHtmlOrignal);
                  } else {
                    matchedArray = [];
                    break;
                  }
                } else {
                  matchedArray = [];
                  break;
                }
              }
              if (matchedArray.length === data[l].words.length) {
                replacedArray[k] =
                  "<span class='lolkeg' index='" +
                  l +
                  "'>" +
                  matchedArray.join(" ") +
                  "</span>";
                changed = true;
                break;
              }
            }
          }
          var replacedText = replacedArray.join(" ");

          if (changed === true) {
            pairs.push({
              element: element,
              old: node,
              new: "<span>" + replacedText + "</span>"
            });
          }
        }
      }
    }
    for (var j = 0; j < pairs.length; j++) {
      pairs[j].element.replaceChild($(pairs[j].new)[0], pairs[j].old);
    }
  })();

  //look into the DOM for the body element and any .lolkeg classes (which are added to words for highlighting)
  var body = $("body", document);
  var words = $(".lolkeg");

  //create a new DOM element with a class called masterkey
  //for holding the the word descriptions
  let holder = $("<div class='masterkeg'></div>");
  body.append(holder);

  // this function positions the holders to be next to the mouse,
  //and also if the mouse is in the left hand of the screen,
  //the older will be to the right of the mouse, and vice versa
  words.mouseover(function(event) {
    clearTimeout(timeout);
    var left = event.pageX;
    var top = event.pageY;
    if ($(window).width() / 2 < event.pageX) {
      left -= 300;
    }

    //get the keyword from the html word element and use it to
    //to get the description of the same word from the data var
    var index = $(event.target).attr("index");
    var text = "";
    text += titleCase(data[index].key); //add the keyword to the top in uppercase
    text += "<br>"; //add linebreak
    text += data[index].description.replace(/\n/g, "<br>"); //add the description with any \n turned into html linebreaks
    holder.html(text); //set the text to be inside the holder element

    //add position and display to block, which makes the holder visible again
    holder.css({
      display: "block",
      top: top + "px",
      left: left + "px"
    });

    //turn any URLs in the holder into a Hyperlink (uses the likify plugin in the /lib/ folder)
    holder.linkify({
      target: "_blank"
    });
  });

  //when the mouse goes over the holder, make sure the timeout is removed
  holder.mouseover(function(event) {
    clearTimeout(timeout);
  });

  //when the mouse leaves either the holder or a word, start the timeout to hide the holder
  words.mouseout(startTimeout);
  holder.mouseout(startTimeout);

  //define a timeout variable and a function that creates a timeout
  //which when triggered will hide the holder / .masterkeg element
  var timeout;
  function startTimeout() {
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      holder.css({
        display: "none"
      });
    }, 1000);
  }
}

//this function makes the first letter of each word in a string turn to upper case
function titleCase(str) {
  var splitStr = str.toLowerCase().split(" ");
  for (var i = 0; i < splitStr.length; i++) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(" ");
}

(function() {
  //listens for new data received when a new file is uploaded in options.js
  //and when it receives the data saves it to the browser storage so it can
  //be accessed next time the browser window is refreshed / loaded
  if (
    chrome &&
    chrome.runtime &&
    chrome.runtime.onMessage &&
    chrome.runtime.onMessage.addListener
  ) {
    chrome.runtime.onMessage.addListener(function(
      request,
      sender,
      sendResponse
    ) {
      if (
        chrome &&
        chrome.storage &&
        chrome.storage.local &&
        chrome.storage.local.set
      ) {
        let jargonData = JSON.parse(request.data);
        jargonPageSearch(jargonData);
      }
    });
  }

  if (
    chrome &&
    chrome.storage &&
    chrome.storage.local &&
    chrome.storage.local.get
  ) {
    chrome.storage.local.get("jargonData", function(data) {
      jargonPageSearch(data.jargonData);
    });
  }
})();
