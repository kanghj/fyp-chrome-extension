var HttpClient = function() {
  this.get = function(aUrl, aCallback) {
  anHttpRequest = new XMLHttpRequest();
  anHttpRequest.onreadystatechange = function() { 
    if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
    aCallback(anHttpRequest.responseText);
  }
  anHttpRequest.open( 'GET', aUrl, true );                        
  anHttpRequest.send( null );
  }
}

//var hostUrl = 'http://wordnews-mobile.herokuapp.com/';
var hostUrl = 'http://wordnews.herokuapp.com/';
//var hostUrl = 'http://localhost:3000/';

var userAccount = '';
var isWorking = '';
var categoryParameter = '';
var wordDisplay = '';
var wordsReplaced = '';
var websiteSetting = '';
var translationUrl = '';


function onWindowLoad() {
  chrome.storage.sync.get(null, function(result) {
    userAccount = result.userAccount;
    //console.log('user acc: '+ result.userAccount);

    if (userAccount == undefined){
      var d = new Date();
      userAccount = 'id' + d.getTime() + '_1';
      chrome.storage.sync.set({'userAccount': userAccount}, function() {});
    }
    //console.log('userAccount ' + userAccount);

    isWorking = result.isWorking;
    if (isWorking == undefined) {
      isWorking = 1;
      chrome.storage.sync.set({'isWorking': isWorking});
    }
    //console.log('isWorking '+isWorking);
    if (isWorking == 0) {
      document.getElementById('turnOn').className = 'btn btn-default';
      document.getElementById('turnOff').className = 'btn btn-primary active';
      
      $('.website-checkbox input').prop('disabled', true);
    } else {
      document.getElementById('turnOn').className = 'btn btn-primary active';
      document.getElementById('turnOff').className = 'btn btn-default';
      $('.website-checkbox input').prop('disabled', false);
    }


    wordDisplay = result.wordDisplay;
    if (wordDisplay == undefined) {
      wordDisplay = 1;
      chrome.storage.sync.set({'wordDisplay': wordDisplay});
    }
    console.log('wordDisplay '+wordDisplay);
    if (wordDisplay == 0) {
      document.getElementById('displayEnglish').className = 'btn btn-default';
      document.getElementById('displayChinese').className = 'btn btn-primary active';
    } else {
      document.getElementById('displayEnglish').className = 'btn btn-primary active';
      document.getElementById('displayChinese').className = 'btn btn-default';
    }

    translationUrl = result.translationUrl || "http://wordnews-mobile.herokuapp.com/";
    console.log('transUrl', translationUrl);
    if (translationUrl.indexOf('mobile') >= 0) {
      document.getElementById('dictionaryTranslations').className = 'btn btn-default';
      document.getElementById('imsTranslations').className = 'btn btn-default';
      document.getElementById('bingTranslations').className = 'btn btn-primary active';

    } else if (translationUrl.indexOf('wordnews') >= 0 && translationUrl.indexOf('ims') < 0) {

      document.getElementById('dictionaryTranslations').className = 'btn btn-primary active';
      document.getElementById('imsTranslations').className = 'btn btn-default';
      document.getElementById('bingTranslations').className = 'btn btn-default';
    } else {
      document.getElementById('dictionaryTranslations').className = 'btn btn-default';
      document.getElementById('imsTranslations').className = 'btn btn-primary active';
      document.getElementById('bingTranslations').className = 'btn btn-default';
    }


    wordsReplaced = result.wordsReplaced;
    //console.log('wordsReplaced '+wordsReplaced);
    if (wordsReplaced == undefined) {
      wordsReplaced = 2;
      //console.log('Set to default wordsReplaced setting');
      chrome.storage.sync.set({'wordsReplaced': wordsReplaced});
    } else {
    //document.getElementById('wordsReplaced').value = wordsReplaced;
      $('#wordsReplaced').slider({
      precision: 2,
      value: wordsReplaced // Slider will instantiate showing 8.12 due to specified precision
      });
    }

    websiteSetting = result.websiteSetting;
    //console.log('websiteSetting '+websiteSetting);
    if (websiteSetting == undefined) {
      websiteSetting = 'cnn.com_bbc.co';
      //console.log('Set to default website setting');
      chrome.storage.sync.set({'websiteSetting': websiteSetting});
    }
    if (websiteSetting.indexOf('cnn.com') !== -1) {
      document.getElementById('inlineCheckbox1').checked = true;
    }
    if (websiteSetting.indexOf('chinadaily.com.cn') !== -1) {
      document.getElementById('inlineCheckbox2').checked = true;
    }
    if (websiteSetting.indexOf('bbc.co') !== -1) {
      document.getElementById('inlineCheckbox3').checked = true;
    }
    if (websiteSetting.indexOf('all') !== -1) {
      document.getElementById('inlineCheckbox4').checked = true;
    }


    var remembered = new HttpClient();
    var answer;


    document.getElementById('learnt').innerHTML = '-';
    document.getElementById('toLearn').innerHTML = '-';

    remembered.get(hostUrl + '/getNumber?name=' + userAccount, function(answer) {
      var obj = JSON.parse(answer);
      if ('learnt' in obj) {
        document.getElementById('learnt').innerHTML = obj['learnt'];
      }
      if ('toLearn' in obj) {
        document.getElementById('toLearn').innerHTML = obj['toLearn'];
      }
    });
  });

  $('#wordsReplaced').on('slide', function(slideEvt) {
    chrome.storage.sync.set({'wordsReplaced': slideEvt.value});
  });


  $('input').change(function() {

    websiteSetting = '';
    if (document.getElementById('inlineCheckbox1').checked == true) {
      if(websiteSetting !== '')
        websiteSetting += '_';
      websiteSetting+= document.getElementById('inlineCheckbox1').value;
    }

    if (document.getElementById('inlineCheckbox2').checked == true) {
      if(websiteSetting !== '')   
        websiteSetting += '_';
      websiteSetting += document.getElementById('inlineCheckbox2').value;
    }
    if (document.getElementById('inlineCheckbox3').checked == true) {
      if(websiteSetting !== '')
        websiteSetting += '_';
      websiteSetting+= document.getElementById('inlineCheckbox3').value;
    }
    
    // Comment out temporarily for now, to prevent the use of 'All website'
    /*if(document.getElementById('inlineCheckbox4').checked == true) {
      if(websiteSetting !== '')
      websiteSetting += '_';
      websiteSetting+= document.getElementById('inlineCheckbox4').value;
    }*/

    chrome.storage.sync.set({'websiteSetting': websiteSetting});
    chrome.storage.sync.get('websiteSetting', function(result){
      userAccount = result.websiteSetting;
      //console.log('user websiteSetting: '+ result.websiteSetting);
    });
  });

  $('#translationUrl .btn').click(function() {
    
    translationUrl = $(this).attr('id');

    if (translationUrl.indexOf('ims') >= 0) {
      chrome.storage.sync.set({'translationUrl': 'http://imsforwordnews.herokuapp.com/show'});
    } else if (translationUrl.indexOf('dictionary') >= 0) {
      chrome.storage.sync.set({'translationUrl': 'http://wordnews.herokuapp.com/show'});
    } else {
      // this one uses Bing translator
      chrome.storage.sync.set({'translationUrl': 'http://wordnews-mobile.herokuapp.com/show'});
    }

    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        var code = 'window.location.reload();';
        chrome.tabs.executeScript(arrayOfTabs[0].id, {code: code});
    });
  });

  $('.btn-toggle ').click(function() {

    if ($(this).attr('id') == 'onoff') {
      if (isWorking == 1) {
        isWorking = 0;
        chrome.storage.sync.set({'isWorking': isWorking});
        $('.website-checkbox input').prop('disabled', true);
        $('#displayEnglish').prop('disabled', true);
        $('#displayChinese').prop('disabled', true);
      } else {
        isWorking = 1;
        chrome.storage.sync.set({'isWorking': isWorking});
        $('#displayEnglish').prop('disabled', false);
        $('#displayChinese').prop('disabled', false);
        $('.website-checkbox input').prop('disabled', false);
      }

      chrome.storage.sync.get(null, function(result){
        isWorking = result.isWorking;
        //console.log('user isworking: '+ result.isWorking);
      });

      $(this).find('.btn').toggleClass('btn-default');
      $(this).find('.btn').toggleClass('active'); 

      if ($(this).find('.btn-primary').size() > 0) {
        $(this).find('.btn').toggleClass('btn-primary');
      }
      if ($(this).find('.btn-danger').size() > 0) {
        $(this).find('.btn').toggleClass('btn-danger');
      }
      if ($(this).find('.btn-success').size() > 0) {
        $(this).find('.btn').toggleClass('btn-success');
      }
      if ($(this).find('.btn-info').size() > 0) {
        $(this).find('.btn').toggleClass('btn-info');
      }

      chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
          var code = 'window.location.reload();';
          chrome.tabs.executeScript(arrayOfTabs[0].id, {code: code});
      });
      return;
    }

    if (!isWorking) {
      return;
    }
    $(this).find('.btn').toggleClass('btn-default');
    $(this).find('.btn').toggleClass('active'); 

    if ($(this).attr('id') == 'englishchinese') {
      if (wordDisplay === 1) {
        wordDisplay = 0;
        chrome.storage.sync.set({'wordDisplay': wordDisplay});
      } else {
        wordDisplay = 1;
        chrome.storage.sync.set({'wordDisplay': wordDisplay});
      }

      chrome.storage.sync.get(null, function(result){
        wordDisplay = result.wordDisplay;
        //console.log('user isworking: '+ result.wordDisplay);
      });
    }



    if ($(this).find('.btn-primary').size() > 0) {
      $(this).find('.btn').toggleClass('btn-primary');
    }
    if ($(this).find('.btn-danger').size() > 0) {
      $(this).find('.btn').toggleClass('btn-danger');
    }
    if ($(this).find('.btn-success').size() > 0) {
      $(this).find('.btn').toggleClass('btn-success');
    }
    if ($(this).find('.btn-info').size() > 0) {
      $(this).find('.btn').toggleClass('btn-info');
    }


    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        var code = 'window.location.reload();';
        chrome.tabs.executeScript(arrayOfTabs[0].id, {code: code});
    });
  });

  $('.btn-block').click(function() {
    window.open(hostUrl+'displayHistory?name='+userAccount);
  });
  //http://testnaijia.herokuapp.com/settings?name='+userAccount'
  $('#setting').click(function() {
    window.open(hostUrl+'settings?name='+userAccount);
  });
  //http://testnaijia.herokuapp.com/howtouse
  $('#documentation').click(function() {
    window.open(hostUrl+'howtouse');
  });

  $('#login').click(function() {
    launchGoogleLoginFlow(makeUrlForGoogleOAuth());
  });
}

window.onload = onWindowLoad;
