console.log('EB Hack loaded');
var editorExtensionId = "haoiccmcinfcbfbbepcnjfaalppinjki";

getAPI();

function getAPI() {
  if (typeof API === 'undefined' || API === null) {
    console.log('Fail to get API, trying again 1 second later');
    setTimeout(() => {
      getAPI();
    }, 1000);
  } else {
    API.pingServer = () => {
      return "normal";
    };
    chrome.runtime.sendMessage(editorExtensionId, {
        msg: 'successInjectAPI',
        tabID: tabID
      },
      function(response) {
        if (!response.success)
          console.log('There is an error while communicating with the extension');
        else {
          console.log('Successfully injected API');
        }
      });
  }
}
