console.log('Loading popupjs');

document.addEventListener('DOMContentLoaded', () => {
  var enabledCheckbox = document.getElementById('extensionEnabled');
  var alertAnswer = document.getElementById('alertAnswer');
  var autoFillAnswer = document.getElementById('autoFillAnswer');
  chrome.storage.local.get({
    enabled: true
  }, function(items) {
    enabledCheckbox.checked = items.enabled;
  });
  chrome.storage.local.get({
    alertTab: 0
  }, function(items) {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      tabID = tabs[0].id;
      alertAnswer.checked = items.alertTab == tabID;
    });
  });
  chrome.storage.local.get({
    autoFillAnswer: false
  }, function(items) {
    autoFillAnswer.checked = items.autoFillAnswer;
  });

  enabledCheckbox.addEventListener('click', () => {
    console.log('enabledCheckbox clicked');
    chrome.storage.local.set({
      enabled: enabledCheckbox.checked,
    }, function() {
      var status = document.getElementById('status');
      status.textContent = 'Option saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 1000);
    });
  });

  document.getElementById('autoGetAnswer').addEventListener('click', () => {
    console.log('autoGetAnswer clicked');
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      chrome.runtime.sendMessage({
          greeting: "autoGetAnswer",
          tabID: tabs[0].id,
        },
        function(response) {
          var status = document.getElementById('status');
          status.textContent = 'Auto getting answer.';
          setTimeout(function() {
            status.textContent = '';
          }, 1000);
        });
    });
  });

  alertAnswer.addEventListener('click', () => {
    console.log('alertAnswer clicked');
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      chrome.storage.local.set({
        alertTab: alertAnswer.checked ? tabs[0].id : 0,
      }, function() {
        chrome.runtime.sendMessage({
            greeting: "popup",
            tabID: tabs[0].id,
            value: alertAnswer.checked
          },
          function(response) {
            var status = document.getElementById('status');
            status.textContent = 'Option saved.';
            setTimeout(function() {
              status.textContent = '';
            }, 1000);
          });
      });
    });
  });

  autoFillAnswer.addEventListener('click', () => {
    console.log('autoFillAnswer clicked');
    chrome.storage.local.set({
      autoFillAnswer: autoFillAnswer.checked,
    }, function() {
      var status = document.getElementById('status');
      status.textContent = 'Option saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 1000);
    });
  });

  document.getElementById('questionReset').addEventListener('click', () => {
    console.log('questionReset clicked');
    chrome.storage.local.set({
      questions: new Map(),
    }, function() {
      var status = document.getElementById('status');
      status.textContent = 'Resetted data.';
      setTimeout(function() {
        status.textContent = '';
      }, 1000);
    });
  });
});

console.log('Finish loading popjs');
