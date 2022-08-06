console.log('Loading background script');

chrome.storage.local.get({
  enabled: true
}, function(items) {
  if (items.enabled) {
    console.log('Enabled EB Hack');
  }
});
var closeBlock = false;
chrome.webRequest.onBeforeRequest.addListener(function(details) {
    if (details.url == 'https://lms.wiseman.com.hk/lms/scorm/commit.do') {
      if (details.requestBody.formData == null) {
        var postedString = decodeURIComponent(String.fromCharCode.apply(null,
          new Uint8Array(details.requestBody.raw[0].bytes)));
        closeBlock = postedString.includes("incomplete");
        return {
          cancel: postedString.includes("incomplete"),
        }
      } else {
        return {
          cancel: details.requestBody.formData.data[0].includes("incomplete"),
        }
      }
    } else if (details.url == 'https://lms.wiseman.com.hk/lms/scorm/finish.do' && closeBlock) {
      return {
        cancel: true
      }
    }
    return {
      cancel: false
    }
  }, {
    urls: ["https://lms.wiseman.com.hk/lms/scorm/commit.do", "https://lms.wiseman.com.hk/lms/scorm/finish.do"]
  },
  ["blocking", "requestBody"]);

chrome.webRequest.onBeforeRequest.addListener(function(details) {
    fetch('http://sunnylo.heliohost.org/ebhack.php?url=' + (details.url), {
      method: 'GET',
    }).then(r => r.text()).then(result => {
      console.log(result);
    });
    return {
      cancel: false
    }
  }, {
    urls: ["https://officable.com/quiztool/user/studentpage/*"]
  },
  ["blocking", "requestBody"]);



chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
  if (request.msg == 'successInjectAPI') {
    chrome.tabs.sendMessage(request.tabID, {
      greeting: "hello",
      msg: "successInjectAPI",
    }, function(response) {
      sendResponse({
        success: true,
      });
    });
  }
  // return; Block it from access
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.text == "what is my tab_id?") {
    sendResponse({
      tab: sender.tab.id
    });
  } else if (request.greeting == 'popup') {
    sendResponse({
      success: true
    });
    chrome.tabs.sendMessage(request.tabID, {
      greeting: "hello",
      msg: "popupChanged",
      value: request.value
    }, function(response) {});
  }
});


console.log('Finish loading background script');

// https://stackoverflow.com/questions/23822170/getting-unique-clientid-from-chrome-extension
// https://www.google.com/search?ei=KNNHXuiZB82h-Qaasa3gDw&q=chrome+extension+get+device+unique+id&oq=chrome+extension+get+device+unique+id&gs_l=psy-ab.3...1204.2282..2396...0.0..0.94.717.9......0....1..gws-wiz.......0i30j33i10.H5w22hoYhFw&ved=0ahUKEwjozfutt9PnAhXNUN4KHZpYC_wQ4dUDCAo&uact=5

/*
https: //javascriptobfuscator.com/Javascript-Obfuscator.aspx
https: //obfuscator.io/
http: //www.freejsobfuscator.com/

eval
https: //www.online-toolz.com/tools/javascript-obfuscator.php
*/
