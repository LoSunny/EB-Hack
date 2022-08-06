console.log('Loading content script');
alertify.set('notifier', 'position', 'top-left');
alertify.set('notifier', 'delay', 5);

var popUpEnabled = false;
var tabID;

chrome.storage.local.get({
  enabled: true,
  alertTab: 0
}, function(items) {
  if (items.enabled) {
    chrome.runtime.sendMessage({
      text: "what is my tab_id?"
    }, tabId => {
      tabID = tabId.tab;
      var actualCode = `var tabID = ${ tabId.tab };`;
      var script = document.createElement('script');
      script.textContent = actualCode;
      (document.head || document.documentElement).appendChild(script);
      script.remove();

      popUpEnabled = tabId.tab == items.alertTab;

      var s = document.createElement('script');
      s.src = chrome.runtime.getURL('contentReal.js');
      s.onload = function() {
        this.remove();
      };
      (document.head || document.documentElement).appendChild(s);
    });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.greeting == "hello") {
    if (request.msg == 'successInjectAPI') {
      alertify.success('Successfully loaded EB hack');
      sendResponse({
        farewell: "goodbye"
      });
    } else if (request.msg == 'popupChanged') {
      popUpEnabled = request.value;
      sendResponse({
        farewell: "goodbye"
      });
      if (request.value)
        sendAnswerTrigger(document.getElementById('course').contentWindow);
    }
  }
});

injectSystemTry();

function injectSystemTry() {
  if (document.getElementById('course') == null) {
    console.log('Fail to inject core, trying again 1 second later');
    setTimeout(function() {
      injectSystemTry();
    }, 1000);
  } else {
    setTimeout(function() {
      injectSystem();
    }, 3000);
  }
}

function injectSystem() {
  var iframe = document.getElementById('course').contentWindow;
  iframe.addEventListener('click', function(event) {
    var clickedElem = event.target;
    if (clickedElem.classList.contains('submit')) {
      setTimeout(function() {
        if (iframe.document.getElementsByTagName('view')[1].getElementsByTagName('content-loader')[0].children[0].tagName == 'QUESTION-SMC') {
          // MC Question
          addAnswer(iframe.document.querySelector('.text.ng-star-inserted').innerText, iframe.document.querySelector('.correct_answer').querySelector('.text.ng-star-inserted').innerText);

          var questions = iframe.document.querySelector('.part_list_style_circle.part_list').children;
          var answeredQuestion = 0;
          for (var i = 0; i < questions.length; i++) {
            if (questions[i].classList.contains('part_submitted')) {
              answeredQuestion++;
            }
          }
          if (questions.length == answeredQuestion + 3 && !popUpEnabled) {
            alertify.warning('You can do one more question');
            error('Reminded to stop!');
          } else if (questions.length == answeredQuestion + 2 && !popUpEnabled) {
            alertify.error('Reminded to stop!');
          }
        } else if (iframe.document.getElementsByTagName('view')[1].getElementsByTagName('content-loader')[0].children[0].tagName == 'QUESTION-FILLIN') {
          // Type answer
          var questions = iframe.document.querySelector('.part_list_style_circle.part_list').children;
          var answeredQuestion = 0;
          for (var i = 0; i < questions.length; i++) {
            if (questions[i].classList.contains('active')) {
              var className = iframe.document.querySelectorAll('.correct_answer').length == 0 ? '.fix_answer' : '.correct_answer';
              addAnswer(i, iframe.document.querySelector(className).innerText);
            }
            if (questions[i].classList.contains('part_submitted')) {
              answeredQuestion++;
            }
          }
          if (questions.length == answeredQuestion + 2 && !popUpEnabled) {
            alertify.warning('You can do one more question');
          } else if (questions.length == answeredQuestion + 1 && !popUpEnabled) {
            alertify.error('Reminded to stop!');
          }
          // fix_answer
          // correct_answer
        }
      }, 250);
    } else if (clickedElem.classList.contains('next')) {
      setTimeout(function() {
        chrome.storage.local.get({
          alertTab: 0
        }, function(items) {
          if (tabID == items.alertTab) {
            sendAnswerTrigger(iframe);
          }
        });
      }, 250);
    } else if (clickedElem.classList.contains('end')) {
      alertify.success('Please remind to reset the data');
    }
  });
}

function addAnswer(question, answer) {
  chrome.storage.local.get({
    questions: {}
  }, function(items) {
    var json = items.questions;
    json[question] = answer;
    chrome.storage.local.set({
      questions: json
    }, function() {
      alertify.message('Added answer of question "' + question + '"');
    });
  });
}

function sendAnswerTrigger(iframe) {
  if (iframe.document.getElementsByTagName('view')[1].getElementsByTagName('content-loader')[0].children[0].tagName == 'QUESTION-SMC') {
    // MC Question
    sendAnswer(iframe, iframe.document.querySelector('.text.ng-star-inserted').innerText);
  } else if (iframe.document.getElementsByTagName('view')[1].getElementsByTagName('content-loader')[0].children[0].tagName == 'QUESTION-FILLIN') {
    // Type answer
    var questions = iframe.document.querySelector('.part_list_style_circle.part_list').children;
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].classList.contains('active')) {
        if (i + 1 == questions.length)
          sendAnswer(iframe, -1);
        else
          sendAnswer(iframe, i);
        break;
      }
    }
  }
}

function sendAnswer(iframe, question) {
  if (question == -1) {
    var init = true;
    var entries = iframe.document.getElementsByTagName('resource-reading')[0].children[1].getElementsByTagName('entry');
    var answers = [];
    for (var i = 0; i < entries.length; i++) {
      if (init) {
        init = false;
        continue;
      }
      if (String.fromCharCode(160) != entries[i].innerText) {
        answers.push(entries[i].innerText);
      }
    }
    chrome.storage.local.get({
      questions: {}
    }, function(items) {
      for (var key in items.questions) {
        answers = answers.filter((value) => {
          return value != items.questions[key]
        });
      }
      alertify.success('Answer is: ' + answers[0]);
    });
  } else {
    chrome.storage.local.get({
      questions: {}
    }, function(items) {
      if (items.questions[question] != null) {
        alertify.success('Answer is: ' + items.questions[question]);
      } else {
        alertify.error('You have not seen this question yet');
      }
    });
  }
}

console.log('Finish loading content script');