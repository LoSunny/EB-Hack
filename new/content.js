console.log('Loading content script');
alertify.set('notifier', 'position', 'top-left');
alertify.set('notifier', 'delay', 5);

var popUpEnabled = false;
var tabID;
var iframe;
var course;
var courseType;

chrome.storage.local.get({
  alertTab: 0
}, function(items) {
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
        sendAnswerTrigger();
    } else if (request.msg == 'autoGetAnswer') {
      sendResponse({
        farewell: "goodbye"
      });
      iframe.document.getElementsByClassName('submit')[0].click();
      setTimeout(function() {
        iframe.document.getElementsByClassName('next')[0].click();
      }, 500);
    } else if (request.msg == 'titleGet') {
      course = request.course;
      courseType = request.courseType;
      console.log('course', course, 'courseType', courseType);
      sendResponse({
        farewell: "goodbye"
      });
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
  iframe = document.getElementById('course').contentWindow;
  iframe.addEventListener('click', function(event) {
    var clickedElem = event.target;
    if (clickedElem.classList.contains('submit')) {
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
    } else if (clickedElem.classList.contains('next')) {
      setTimeout(function() {
        chrome.storage.local.get({
          alertTab: 0,
          autoGetAnswer: false
        }, function(items) {
          if (tabID == items.alertTab) {
            sendAnswerTrigger();
          }
          if (items.autoGetAnswer) {
            getAnswerTrigger();
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

function sendAnswerTrigger() {
  if (iframe.document.getElementsByTagName('view')[1].getElementsByTagName('content-loader')[0].children[0].tagName == 'QUESTION-SMC') {
    // MC Question
    sendAnswer(iframe.document.querySelector('.text.ng-star-inserted').innerText, 'mc');
  } else if (iframe.document.getElementsByTagName('view')[1].getElementsByTagName('content-loader')[0].children[0].tagName == 'QUESTION-FILLIN') {
    // Type answer
    var questions = iframe.document.querySelector('.part_list_style_circle.part_list').children;
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].classList.contains('active')) {
        if (i + 1 == questions.length)
          sendAnswer(-1, 'type');
        else
          sendAnswer(i, 'type');
        break;
      }
    }
  }
}

function sendAnswer(question, type) {
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
        var spans = entries[i].getElementsByTagName('span');
        for (var a = 0; a < spans.length; a++) {
          if (spans[a].className == '') {
            answers.push(spans[a].innerText);
          }
        }
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
      selectAnswerAndNext(answers[0], type);
    });
  } else {
    chrome.storage.local.get({
      questions: {},
      autoFillAnswer: false
    }, function(items) {
      if (items.questions[question] != null) {
        alertify.success('Answer is: ' + items.questions[question]);
        if (items.autoFillAnswer)
          selectAnswerAndNext(items.questions[question], type);
      } else {
        alertify.error('You have not seen this question yet');
      }
    });
  }
}

function selectAnswerAndNext(answer, type) {
  if (type == 'mc') {
    Array.from(iframe.document.querySelectorAll('div')).find(el => {
      return el.textContent === answer;
    }).children[0].click();
    iframe.document.getElementsByClassName('submit')[0].click();
    iframe.document.getElementsByClassName('next')[0].click();
  } else if (type == 'type') {
    var input = iframe.document.getElementsByTagName('input')[0];
    var el = document.createElement('textarea');
    el.value = answer;
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, 99999);
    document.execCommand('copy');
    document.body.removeChild(el);
    input.focus();

    /*
    iframe.document.getElementsByClassName('submit')[0].click();
    iframe.document.getElementsByClassName('next')[0].click();*/
  }
}

function getAnswerTrigger() {
  if (iframe.document.getElementsByTagName('view')[1].getElementsByTagName('content-loader')[0].children[0].tagName == 'QUESTION-SMC') {
    // MC Question
    var questions = iframe.document.querySelector('.part_list_style_circle.part_list').children;
    var answeredQuestion = 0;
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].classList.contains('part_submitted')) {
        answeredQuestion++;
      }
    }
    if (questions.length > answeredQuestion + 2) {
      iframe.document.getElementsByClassName('submit')[0].click();
      setTimeout(function() {
        iframe.document.getElementsByClassName('next')[0].click();
      }, 500);
    } else if (questions.length == answeredQuestion + 2) {
      chrome.storage.local.set({
        autoGetAnswer: false
      }, function() {
        alertify.success('Finish getting answer, closing tab in 3 seconds');
        setTimeout(function() {
          window.close();
        }, 3000);
      });
    }
  } else if (iframe.document.getElementsByTagName('view')[1].getElementsByTagName('content-loader')[0].children[0].tagName == 'QUESTION-FILLIN') {
    // Type answer
    var questions = iframe.document.querySelector('.part_list_style_circle.part_list').children;
    var answeredQuestion = 0;
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].classList.contains('part_submitted')) {
        answeredQuestion++;
      }
    }
    if (questions.length > answeredQuestion + 1) {
      iframe.document.getElementsByClassName('submit')[0].click();
      setTimeout(function() {
        iframe.document.getElementsByClassName('next')[0].click();
      }, 500);
    } else if (questions.length == answeredQuestion + 1) {
      chrome.storage.local.set({
        autoGetAnswer: false
      }, function() {
        alertify.success('Finish getting answer, closing tab in 3 seconds');
        setTimeout(function() {
          window.close();
        }, 3000);
      });
    }
  }
}

console.log('Finish loading content script');
