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
        closeBlock = details.requestBody.formData.data[0].includes("incomplete");
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

var tabsSent = [];
chrome.webRequest.onBeforeRequest.addListener(function(details) {
    console.log(details);
    if (!tabsSent.includes(details.tabId)) {
      tabsSent.push(details.tabId);
      var arr = details.url.match(/https:\/\/lms.wiseman.com.hk\/lms\/course\/eb\/lessons\/(\w*)\/(\w*)\//);
      chrome.tabs.sendMessage(details.tabId, {
        greeting: "hello",
        msg: "titleGet",
        course: arr[1],
        courseType: arr[2]
      }, function(response) {});

    }
    return {
      cancel: false
    }
  }, {
    urls: ["https://lms.wiseman.com.hk/lms/course/eb/lessons/*"]
  },
  ["blocking"]);

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
  } else if (request.greeting == 'autoGetAnswer') {
    sendResponse({
      success: true
    });
    chrome.tabs.sendMessage(request.tabID, {
      greeting: "hello",
      msg: "autoGetAnswer"
    }, function(response) {});
  }
});

console.log('Finish loading background script');
