'use strict';

//var hostUrl = 'http://wordnews.herokuapp.com/';
var hostUrl = "http://wordnews-mobile.herokuapp.com/";
//var hostUrl = "http://localhost:3000/";

// TODO: move into UserSettings
var userAccount = '';
var isWorking = '';
var categoryParameter = '';
var wordDisplay;

var translationUrl = 'http://wordnews-mobile.herokuapp.com/show';

var TranslationDirection = {
    CHINESE: 0,
    ENGLISH: 1
};
var isTranslatingByParagraph = true;

var wordsReplaced = '';
// a dictionary of english to chinese words 
var pageDictionary = {};
var vocabularyListDisplayed;
var displayID = '';
var contentToPopupForDisplayId = {};
var websiteSetting = '';

var idToOriginalWordDictionary = {};

// a dictionary of word : times returned by server for translation
var translatedWords = {};

var pageWordsLearned = new Set();

// startTime is used for logging, it is initialised after the user settings have been 
// retrieved from chrome
var startTime;

var UserSettings = (function() {
    var _numWordsToTranslate;    
    var _isWorking;

    function UserSettings() {
        _numWordsToTranslate = 4;
    }

    UserSettings.prototype.updateNumWords = function(newNumWords) {
        _numWordsToTranslate = newNumWords; 
    }

    UserSettings.prototype.readNumWords = function() {
        //return _numWordsToTranslate;
        return 6;
    }

    return UserSettings;
}());

var userSettings = new UserSettings();

function requestTranslatedWords(url, params, index){
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function() { 
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = xhr.responseText.replace(/&quot;/g,'"');
            var obj = JSON.parse(response);
            console.log(obj);

            var sourceWords = [];
            var targetWords = [];
            var testType = [];
            var pronunciation = [];
            var choices1 = {};
            var choices2 = {};
            var choices3 = {};
            var wordID = [];


            for (var wordToReplace in obj) {

                sourceWords.push(wordToReplace);
                targetWords.push(obj[wordToReplace].chinese);
                testType.push(obj[wordToReplace].isTest);
                pageDictionary[wordToReplace] = obj[wordToReplace].chinese;

                if (obj[wordToReplace].pronunciation != undefined) {
                    pronunciation.push(obj[wordToReplace].pronunciation);
                } else {
                    pronunciation.push("/pronunciation/");
                }

                if (obj[wordToReplace].wordID !== undefined) {
                    wordID.push(obj[wordToReplace]['wordID']);
                    idToOriginalWordDictionary[obj[wordToReplace]['wordID']] = wordToReplace;
                }

                if (obj[wordToReplace].isTest === 1 || obj[wordToReplace].isTest === 2){
                    choices1[wordToReplace.toLowerCase()] = obj[wordToReplace]['choices']['0'];
                    choices2[wordToReplace.toLowerCase()] = obj[wordToReplace]['choices']['1'];
                    choices3[wordToReplace.toLowerCase()] = obj[wordToReplace]['choices']['2'];
                } else {
                    choices1[wordToReplace.toLowerCase()] = ' ';
                    choices2[wordToReplace.toLowerCase()] = ' ';
                    choices3[wordToReplace.toLowerCase()] = ' ';
                }

                var isChoicesProvided = obj[wordToReplace].hasOwnProperty('isChoicesProvided') && obj[wordToReplace]['isChoicesProvided'];
                    
                if (obj[wordToReplace].isTest > 0 && !isChoicesProvided) {
                     // make a seperate request to get the quiz options
                     $.ajax({url: hostUrl+'getQuiz.json?word='+ wordToReplace.toLowerCase() +'&category='+'Technology'+'&level=3'})
                     .done(function(quizOptions) {
                        // Callback for successful retrieval     
                        for (var quizStart in quizOptions) {
                            var choices = quizOptions[quizStart]['choices'];
                            choices1[quizStart.toLowerCase()] = choices['0'];
                            choices2[quizStart.toLowerCase()] = choices['1'];
                            choices3[quizStart.toLowerCase()] = choices['2'];
                        }
                        
                        replaceWords(sourceWords, targetWords, testType, pronunciation, wordID, choices1, choices2 , choices3, index);
                     }).fail(function() {
                        //console.log("Retrieving of quiz options failed!");
                     });
 
                }
            }

            replaceWords(sourceWords, targetWords, testType, pronunciation, wordID, choices1, choices2 , choices3, index);

        }
    }
    xhr.send(params);
}

function replaceWordsWithoutQuiz(sourceWords, targetWords) {
    var paragraphs = paragraphsInArticle();

    for (var j = 0; j < sourceWords.length; j++) {
        var sourceWord = sourceWords[j];
        var targetWord = targetWords[j];

        console.log(sourceWord);
        console.log(targetWord);
        /*if (sourceWord.toLowerCase() in translatedWords) {
            // only translate the same word 1 time(s) at the most
            if (translatedWords[sourceWord.toLowerCase()] >= 1) {
                continue;
            }
            translatedWords[sourceWord.toLowerCase()] += 1;
        } else {
            translatedWords[sourceWord.toLowerCase()] = 1;
        }*/

        for (var i = 0; i < paragraphs.length; i++) {
            var paragraph = paragraphs[i];
            var text = paragraph.innerHTML;

            var id = 'myID_' + sourceWord + '_' + i.toString() + '_';

            var popoverContent = '';
            var joinString = '';

            joinString += '  <span ';
            joinString += 'class = "fypSpecialClass" ';
            joinString += 'style="text-decoration:underline; font-weight: bold; "';
            joinString += 'data-placement="above" ';

            joinString += 'id = "' + id + '" >';
            if (wordDisplay == 1) {
                joinString += sourceWord;
            } else {
                joinString += targetWord;
            }
            joinString += '</span>  ';


            var append = '<div id=\"'+ id + '_popup\" class="jfk-bubble gtx-bubble" style="visibility: visible;  opacity: 1;">';
            append += '<div class="jfk-bubble-content-id"><div id="gtx-host" style="min-width: 200px; max-width: 400px;">';
            append += '<div id="bubble-content" style="min-width: 200px; max-width: 400px;" class="gtx-content">';
            append += '<div class="content" style="border: 0px; margin: 0">';
            append += '<div id="translation" style="min-width: 200px; max-width: 400px; display: inline;">';
            append += '<div class="gtx-language">ENGLISH</div>';
            append += '<div class="gtx-body" style="padding-left:21px;">'+sourceWord+'</div><br>';
            append += '<div class="gtx-language">CHINESE (SIMPLIFIED)</div>';
            append += '<p style = "margin: 0px;padding-left:10px;">';

            append += '</div>';

            var see_more_id = "myIDmore_" + sourceWord + "_" + "_" + i.toString();

            append += '</p>';
            append += '<a id="' + see_more_id + '" target="_blank" class="myIdMore" href="http://dict.cn/en/search?q=' + sourceWord + '" style="color: #A2A2A2; float: right; padding-top: 16px;">MORE »</a>';
            append += '</div></div></div></div></div>';
            append += '<div class="jfk-bubble-arrow-id jfk-bubble-arrow jfk-bubble-arrowup" style="left: 117px;">';
            append += '<div class="jfk-bubble-arrowimplbefore"></div>';
            append += '<div class="jfk-bubble-arrowimplafter"></div></div></div>';

            contentToPopupForDisplayId[id+"_popup"] = append;

            

            $(document).off('click.wordnews').on('click.wordnews', "input[name*='inlineRadioOptions']", documentClickOnInlineRadioButton);

            var parts = text.split(new RegExp('\\b' + sourceWord + '\\b'));
            var result = '';
            if (parts.length > 1) {
                var n = occurrences(parts[0],'\"');
                //if (n%2 === 1) {  // TODO figure out the goal of this code
                    //result += parts[0] + '"' + joinString + '"';
                //} else {
                    result += parts[0] + joinString;
                //}
                parts.splice(0, 1);
            }

            result += parts.join(' ' + sourceWord + ' ');

            paragraph.innerHTML = result;
        }   
    }
}

// accesses the global variable translatedWords
function replaceWords(sourceWords, targetWords, testType, pronunciation, wordID, choices1, choices2 , choices3, i) {
    const CHINESE_TO_ENGLISH_QUIZ = 1;
    const ENGLISH_TO_CHINESE_QUIZ = 2;

    var paragraphs = paragraphsInArticle();

    function addOptionsForQuiz() {
        var myArrayShuffle = shuffle([1, 2, 3, 4]);
        var result = "";
        for (var k = 0; k < myArrayShuffle.length; k++) {
            if (k == 0 || k == 2) {
                append += '<div style="width: 100%;">';
            }

            var wordToUse = sourceWord.toLowerCase();
            switch (myArrayShuffle[k]) {
                case 1:
                    result += '<div id="' + wordID[j] + '_w" align="center" class="fyp_choice_class" onMouseOver="this.style.color=\'#FF9900\'" onMouseOut="this.style.color=\'#626262\'" style="font-weight: bold; cursor:pointer; color: #626262; width: 50%; float: left; padding-top: 16px;">' + choices1[wordToUse] + '</div>';
                    break;
                case 2:
                    result += '<div id="' + wordID[j] + '_w2" align="center" class="fyp_choice_class" onMouseOver="this.style.color=\'#FF9900\'" onMouseOut="this.style.color=\'#626262\'" style="font-weight: bold; cursor:pointer; color: #626262; width: 50%; float: left; padding-top: 16px;">' + choices2[wordToUse] + '</div>';
                    break;
                case 3:
                    result += '<div id="' + wordID[j] + '_w3" align="center" class="fyp_choice_class" onMouseOver="this.style.color=\'#FF9900\'" onMouseOut="this.style.color=\'#626262\'" style="font-weight: bold; cursor:pointer; color: #626262; width: 50%; float: left; padding-top: 16px;">' + choices3[wordToUse] + '</div>';
                    break;
                case 4:
                    if (testType[j] == CHINESE_TO_ENGLISH_QUIZ) {
                        result += '<div id="' + wordID[j] + '_c" align="center"' +
                            'class="fyp_choice_class" onMouseOver="this.style.color=\'#FF9900\'"' +
                            'onMouseOut="this.style.color=\'#626262\'" style="font-weight: bold;' +
                            'cursor:pointer; color: #626262; float: left; width: 50%; padding-top:' +
                            '16px;">' + sourceWord.toLowerCase() + '</div>';
                    } else if (testType[j] == ENGLISH_TO_CHINESE_QUIZ) {
                        result += '<div id="' + wordID[j] + '_c" align="center"' +
                            'class="fyp_choice_class" onMouseOver="this.style.color=\'#FF9900\'"' +
                            'onMouseOut="this.style.color=\'#626262\'" style="font-weight: bold;' +
                            'cursor:pointer; color: #626262; float: left; width: 50%; padding-top:' +
                            '16px;">' + targetWord + '</div>';
                    }
                    break;
                default:
                    break;
            }
            if (k == 1 || k == 3) {
                result += "</div>";
            }
        }
        return result;
    }

    for (var j = 0; j < sourceWords.length; j++) {
        var sourceWord = sourceWords[j];

        var targetWord = targetWords[j];
        // only translate the same word 1 time(s) at the most
        translatedWords[sourceWord.toLowerCase()] = sourceWord.toLowerCase() in translatedWords?
                                                    translatedWords[sourceWord.toLowerCase()] + 1:
                                                    1;
        if (translatedWords[sourceWord.toLowerCase()] >= 2) {
            continue;
        }


        var paragraph = paragraphs[i];

        var text = paragraph.innerHTML;

        var id = 'myID_' + sourceWord + '_' + wordID[j] + '_' + i.toString() + '_' + testType[j];
        var joinString = '';

        pronunciation[j] = pronunciation[j].replace('5','');

        if (testType[j] === 0) { // no quiz for the j'th paragraph
            var splitPinyin = pronunciation[j].split(' ');


            var chineseCharacters = targetWord.replace('(','').replace(')','').split('');
            joinString += '  <span ';
            joinString += 'class = "fypSpecialClass" ';
            joinString += 'style="text-decoration:underline; font-weight: bold; "';

            joinString += 'data-placement="above" ';
            joinString += 'id = "' + id + '" >';
            if (wordDisplay == 1) {
                joinString += sourceWord;
            } else {
                joinString += targetWord;
            }


            joinString += '</span>  ';
            var append = '<div id=\"'+ id + '_popup\" class="jfk-bubble gtx-bubble" style="visibility: visible;  opacity: 1;">';
            append += '<div class="jfk-bubble-content-id"><div id="gtx-host" style="min-width: 200px; max-width: 400px;">';
            append += '<div id="bubble-content" style="min-width: 200px; max-width: 400px;" class="gtx-content">';
            append += '<div class="content" style="border: 0px; margin: 0">';
            append += '<div id="translation" style="min-width: 200px; max-width: 400px; display: inline;">';
            append += '<div class="gtx-language">ENGLISH</div>';
            append += '<div class="gtx-body" style="padding-left:21px;">'+sourceWord+'</div><br>';
            append += '<div class="gtx-language">CHINESE (SIMPLIFIED)</div>';

            append += '<p style = "margin: 0px;padding-left:10px;">';
            for (var k = 0; k < chineseCharacters.length; k++){
                append += '<img style="height:21px;width:21px;display:inline-block;opacity:0.55;vertical-align:middle;background-size:91%;-webkit-user-select: none;-webkit-font-smoothing: antialiased;" class="audioButton"  id="'+splitPinyin[k]+'" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAACjSURBVDjLY2AYYmA1QwADI3FKy8HkfyA8zqBOjPL/YLqO4SWQ9YXBmbDy/1C2EMMGsBZNQsr/w/lMDCuAvKOElP+HeloQSPIxPAPynVAV/seAENHtYLoKyJpDnIb/DOZA2gBI3yRWQx6Q5gZ7nFYaQE4yJN5JW8B0PaanYaADRcMaBh5wsD7HDFZMLURGHEIL0UkDpoWExAfRQlLyJiMDDSAAALgghxq3YsGLAAAAAElFTkSuQmCC" >'
                append += chineseCharacters[k] + ' ';
            }
            for (var k = 0; k < splitPinyin.length; k++){
                append += '<audio id="myAudio_'+splitPinyin[k]+'" style = "display: none;">'
                append += '<source src="http://www.chinese-tools.com/jdd/public/ct/pinyinaudio/'+splitPinyin[k]+'.mp3" type="audio/mp3">';
                append += '</audio>';
            }
            append += '<div class="row" style="margin-left:10px">';
            for (var k = 0; k < splitPinyin.length; k++){
                
                append += '<div style="height:21px;width:15px;display:inline-block;"> </div>';
                append += '<small>' + splitPinyin[k] + '</small> ';
            }

            append += '</div>';
            var see_more_id = "myIDmore_" + sourceWord + "_" + wordID[j] + "_" + i.toString() + "_" + testType[j];

            append += '</p>';
            append += '<a id="' + see_more_id + '" target="_blank" class="myIdMore" href="http://dict.cn/en/search?q=' + sourceWord + '" style="color: #A2A2A2; float: right; padding-top: 16px;">MORE »</a>';
            append += '</div></div></div></div></div>';
            append += '<div class="jfk-bubble-arrow-id jfk-bubble-arrow jfk-bubble-arrowup" style="left: 117px;">';
            append += '<div class="jfk-bubble-arrowimplbefore"></div>';

            append += '<div class="jfk-bubble-arrowimplafter"></div></div></div>';

            contentToPopupForDisplayId[id+"_popup"] = append;
        } else {  // has quiz
            // first check if the quiz options are provided, otherwise we must wait for the new xml http request to be completed
            if (typeof choices3[sourceWord] == 'undefined' && typeof choices3[targetWord] == 'undefined') {   // test if all choices are provided
                //console.log("SKIP " + sourceWord);
            }



            joinString += ' <span ';
            joinString += 'class = "fypSpecialClass" ';
            joinString += 'style="text-decoration:underline; font-weight: bold; " ';
            joinString += 'data-placement="above" ';
            if (testType[j] === CHINESE_TO_ENGLISH_QUIZ) {
                joinString += 'title="Which of the following is the corresponding English word?" ';
            } else if (testType[j] === ENGLISH_TO_CHINESE_QUIZ) {
                joinString += 'title="Which of the following is the corresponding Chinese word?" ';
            }
            joinString += 'href="#" ';


            joinString += 'id = "' + id + '" >';

            if (testType[j] === 1) {
                joinString += targetWord;
            } else {
                joinString += sourceWord;
            }
            joinString += '</span> ';
            var append = '<div id=\"'+ id + '_popup\" class="jfk-bubble gtx-bubble" style="visibility: visible;  opacity: 1; padding-bottom: 40px; ">'
                        + '<div class="jfk-bubble-content-id"><div id="gtx-host" style="min-width: 200px; max-width: 400px;">'
                        + '<div id="bubble-content" style="min-width: 200px; max-width: 400px;" class="gtx-content">'
                        + '<div id="translation" style="min-width: 200px; max-width: 400px; display: inline;">'
                        +  '<div style="font-size: 80%;" class="gtx-language">Choose the most appropriate translation:</div>';


            append += addOptionsForQuiz();


            append += '</div></div></div></div>'
                        + '<div class="jfk-bubble-arrow-id jfk-bubble-arrow jfk-bubble-arrowup" style="left: 117px;">'
                        + '<div class="jfk-bubble-arrowimplbefore"></div>'
                        + '<div class="jfk-bubble-arrowimplafter"></div></div></div>';

            contentToPopupForDisplayId[id + "_popup"] = append;
        }


        $(document).off('click.wordnews').on('click.wordnews', "input[name*='inlineRadioOptions']", documentClickOnInlineRadioButton);

        var parts = text.split(new RegExp('\\b' + sourceWord + '\\b'));
        var result = '';
        if (parts.length > 1) {
            var n = occurrences(parts[0],'\"');
            //if (n%2 === 1) {  // TODO figure out the goal of this code...
                //result += parts[0] + '"' + joinString + '"';
            //} else {
                result += parts[0] + joinString;
            //}
            parts.splice(0, 1);
        }

        result += parts.join(' ' + sourceWord + ' ');

        paragraph.innerHTML = result;
    }


    $(document).off('mousedown.wordnews').on('mousedown.wordnews', function (e) {
        e = e || window.event;
        var id = (e.target || e.srcElement).id;
        var thisClass = (e.target || e.srcElement).className;
        var container = $('.jfk-bubble')

        var currentTime = new Date();
        var timeElapsed = currentTime - startTime; 

        var loggingUrl = hostUrl + 'log?' + 'id=' + encodeURIComponent(userAccount) +
                         '&time=' + encodeURIComponent(timeElapsed) + '&move=';  // missing move param, to be added when sending log
        var httpClient = new HttpClient();

        if (container[0]) {   
            if ( !container.is(e.target) && container.has(e.target).length === 0) { // if the target of the click isn't the container... // ... nor a descendant of the container
            
                var id = container.attr('id');
                var englishWord = id.split('_')[1];
                var tempWordID = id.split('_')[2];
                var mainOrTest = id.split('_')[4];
                
                if (mainOrTest === '0') {
                    // increase the number of words encountered
                    httpClient.get(hostUrl+'remember?name='+userAccount+'&wordID='+tempWordID+'&isRemembered=1'+'&url='+document.URL, function(answer) {
                        ////console.log("this is answer: "+answer);
                    });

                    httpClient.post(loggingUrl + 'see_' + tempWordID, function(dummy) {
                        //console.log('log sent');
                    });

                    // add to page's learned words
                    pageWordsLearned.add(tempWordID);
                }

                document.body.removeChild(container[0]);
            }

            if (thisClass === 'myIdMore') {
                
                id = container.attr('id');
               
                var englishWord = id.split('_')[1];
                var tempWordID = id.split('_')[2];

                httpClient.post(loggingUrl + 'myId_more_wordID_' + tempWordID, function(dummy) {
                    //console.log('log sent');
                });


                httpClient.get(hostUrl+'remember?name='+userAccount+'&wordID='+tempWordID+'&isRemembered=0'+"&url="+document.URL, function(answer) {
                    ////console.log("this is answer: "+answer);
                });
            }

            if (thisClass === 'audioButton') {
                ////console.log("clicked id is "+id);
                var myAudio = document.getElementById("myAudio_"+id);

                httpClient.post(loggingUrl + 'clickAudioButton_wordID_' + id, function(dummy) {
                    //console.log("log sent");
                });

                if (myAudio.paused) {
                    myAudio.play();
                } else {
                    myAudio.pause();
                }
            }
        
            if (thisClass === 'fyp_choice_class') {
              
                var tempWordID = id.split("_")[0];
                var isCorrect = id.split("_")[1];
                var remembered = new HttpClient();
                if (isCorrect === 'c') {
                    remembered.post(loggingUrl + 'correct_quiz_answer_wordId_' + tempWordID, function(dummy) {
                        //console.log("log sent");
                    });

                    remembered.get(hostUrl+'remember?name='+userAccount+'&wordID='+tempWordID+'&isRemembered=1'+"&url="+document.URL, function(answer) {
                        //console.log("select the correct answer");
                    });

                    $('.jfk-bubble').css("background-image", "url('https://lh4.googleusercontent.com/-RrJfb16vV84/VSvvkrrgAjI/AAAAAAAACCw/K3FWeamIb8U/w725-h525-no/fyp-correct.jpg')");                

                    $('.jfk-bubble').css("background-size", "cover");

                    $('.content').css("background-color", "#cafffb");
                } else {
                    remembered.post(loggingUrl + 'wrong_quiz_answer_wordID_' + tempWordID, function(dummy) {
                        //console.log("log sent");
                    });
                    remembered.get(hostUrl+'remember?name='+userAccount+'&wordID='+tempWordID+'&isRemembered=0'+"&url="+document.URL, function(answer) {
                        //console.log("select the wrong answer");
                    });
                    $('.jfk-bubble').css("background-image", "url('https://lh6.googleusercontent.com/--PJRQ0mlPes/VSv52jGjlUI/AAAAAAAACDU/dU3ehfK8Dq8/w725-h525-no/fyp-wrong.jpg')");                
                    $('.jfk-bubble').css("background-size", "cover");
                }

            }
        }
    }); 

    $(".fypSpecialClass").off('click.wordnews').on('click.wordnews', appendPopUp);

    $('.fypSpecialClass').mouseover(function(){
        $(this).css("color","#FF9900");
        $(this).css("cursor","pointer");
    });
    $('.fypSpecialClass').mouseout(function(){
        $(this).css("color","black");
    });
}

function documentClickOnInlineRadioButton() {
        var id = $(this).attr('id');
        var tempWordID = $(this).attr('value').split('_')[0];
        var httpClient = new HttpClient();

        document.getElementById('inlineRadio1').disabled = true;
        document.getElementById('inlineRadio2').disabled = true;
        document.getElementById('inlineRadio3').disabled = true;
        document.getElementById('inlineRadioCorrect').disabled = true;

        if (document.getElementById('inlineRadioCorrect').checked) {
            httpClient.get(hostUrl+'remember?name='+userAccount+'&wordID='+tempWordID+'&isRemembered=1'+"&url="+document.URL, function(answer) {
                //console.log("selected the correct answer");
            });

            document.getElementById('alertSuccess').style.display = 'inline-flex';
            setTimeout(function() {$('.fypSpecialClass').popover('hide')},1000);
        } else {
            httpClient.get(hostUrl+'remember?name='+userAccount+'&wordID='+tempWordID+'&isRemembered=0'+"&url="+document.URL, function(answer) {
                //console.log("selected the wrong answer");
            });

            document.getElementById('alertDanger').style.display = 'inline-flex';
            setTimeout(function() {$('.fypSpecialClass').popover('hide')},2500);
        }

}

function appendPopUp(event) {
    var id = $(this).attr('id');

    var element = document.getElementById(id);
    var rect = cumulativeOffset(element);

    displayID = id + "_popup";
    var myElem = document.getElementById(displayID);
    if (myElem != null) {
        document.body.removeChild(myElem);
    }

    $('body').append(contentToPopupForDisplayId[id + '_popup']);
    document.getElementById(id + '_popup').style.left = (rect.left - 100) + 'px';
    // Fix left overflow out of screen
    if(rect.left - 100 < 0) {
    document.getElementById(id + '_popup').style.left = '0';
    }
    // TODO: Fix right overflow out of screen with screenWidth
    document.getElementById(id + '_popup').style.top = (rect.top + 30) + 'px';
}


vocabularyListDisplayed = 0;


function paragraphsInArticle() {
    var paragraphs;
    if (document.URL.indexOf('cnn.com') !== -1) {
        paragraphs = $('.zn-body__paragraph').get();
    } else {
        paragraphs = document.getElementsByTagName('p');
    }
    return paragraphs;
}

if (typeof chrome != 'undefined') {
  console.log('Chrome, initializating with chrome storage.');
  chrome.storage.sync.get(null, handleInitResult);
} else {
  console.log('Not chrome, waiting for manual initialization.');
}

// This function is called from Android client, with appropriate params
function initFromAndroid(androidID, andoridScreenWidth) {
    console.log('initFromAndroid: ' + androidID + ' ' + andoridScreenWidth);
    handleInitResult({
        userAccount: androidID
    });
}

function saveSetting(obj) {
    if (typeof chrome != 'undefined') {
        // console.log('saving setting for ', JSON.stringify(obj, null, '\t'));
        chrome.storage.sync.set(obj);
    } else {
        console.log('saving setting for other clients not implemented.');
    }
}

function handleInitResult(result, androidID) {

    var allKeys = Object.keys(result);

    userAccount = result.userAccount || undefined;
    isWorking = result.isWorking || undefined;
    wordDisplay = result.wordDisplay || undefined;
    wordsReplaced = result.wordsReplaced || undefined;
    websiteSetting = result.websiteSetting || undefined;

    console.log(result.translationUrl);
    if (typeof result.translationUrl !== 'undefined') {
        translationUrl = result.translationUrl;
    }

    //console.log("user acc: "+ result.userAccount);
    //console.log("user isWorking: "+ result.isWorking);
    //console.log("user wordDisplay: "+ result.wordDisplay);
    //console.log("user wordsReplaced: "+ result.wordsReplaced);
    //console.log("user websiteSetting: "+ result.websiteSetting);

    if (userAccount == undefined) {
        var d = new Date();
        userAccount = 'id' + d.getTime() + '_1';
        saveSetting({'userAccount': userAccount});
    }

    if (isWorking == undefined) {
        isWorking = 1;
        saveSetting({'isWorking': isWorking});
    }

    if (wordDisplay == undefined) {
        wordDisplay = TranslationDirection.ENGLISH; 
        saveSetting({'wordDisplay': wordDisplay});
    }

    if (wordsReplaced == undefined) {
        wordsReplaced = 6;
        //console.log("Setting words to replace to : " + wordsReplaced + " (default setting)");
        saveSetting({'wordsReplaced': wordsReplaced});
    }

    if (websiteSetting == undefined) {
        websiteSetting = "cnn.com_bbc.co";
        //console.log("Setting websites to use to : " + websiteSetting + " (default setting)");
        saveSetting({'websiteSetting': websiteSetting});
    }

    startTime = new Date();  // this is used to track the time between each click

    userSettings.updateNumWords(wordsReplaced);

    var remembered = new HttpClient();

    var isWebsiteForTranslation = 0;
    var splitedWebsite = websiteSetting.split("_");

    if (websiteSetting.indexOf('all') !== -1) { 
        isWebsiteForTranslation = 1;
    } else {
        for (var k = 0; k < splitedWebsite.length; k++) {
            if (document.URL.indexOf(splitedWebsite[k]) !== -1 && websiteSetting !== "") {
                isWebsiteForTranslation = 1;
            }
        } 
    }

    console.log('isWorking ' + isWorking + ' websiteCheck ' + isWebsiteForTranslation);

    if (isWorking && isWebsiteForTranslation) {
        // request at the start
        //Notification.requestPermission();
        //spawnNotification(null, null, 'WordNews is replacing some words in this article');
        $(window).scroll(function() {
            // if the user scrolls to the button of the page, display the list of words learned
            if ($(window).scrollTop() + $(window).height() === $(document).height() - 300) {
                var wordList = []; 

                for (var key of pageWordsLearned) {
                    var value = idToOriginalWordDictionary[key];
                    wordList.push(value.toLowerCase());
                }

                var titleOfNotification = 'Words looked at in this article:';
                //if (wordList) {
                //    spawnNotification(wordList.join(', '), null, titleOfNotification);
                //}
            }
        });

        var paragraphs = paragraphsInArticle();

        var articleText = "";
        for (var i = 0; i < paragraphs.length; i++) {

            var sourceWords = [];
            var targetWords = [];

            var paragraph = paragraphs[i];
            
            // if the paragraph is followed or preceeded by another p, 
            // then translate it
            //if ((paragraph.nextSibling && (paragraph.nextSibling.nodeName.toLowerCase() === "p" || paragraph.nextSibling.nodeName.toLowerCase() === "#text")) || 
             //   (paragraph.previousSibling && (paragraph.previousSibling.nodeName.toLowerCase() === "p" || paragraph.previousSibling.nodeName.toLowerCase() === "#text"))) {

                var stringToServer = paragraph.innerText;

                var url = (typeof translationUrl === 'undefined' ? hostUrl + 'show' : translationUrl) ;
                articleText += stringToServer;

                if (isTranslatingByParagraph) {
                    var stringToServer = paragraph.innerText;

                    var params = 'text=' + encodeURIComponent(stringToServer) + '&url=' + encodeURIComponent(document.URL) + '&name=' + userAccount + '&num_words=' + userSettings.readNumWords();

                    requestTranslatedWords(url, params, i);
                }
            //} 
        }
        
        if (!isTranslatingByParagraph) {
            var params = 'text=' + encodeURIComponent(articleText) + '&url=' + encodeURIComponent(document.URL) + '&name=' + userAccount + '&num_words=' + userSettings.readNumWords();

            requestTranslatedWords(url, params, i);
        }
        }

};


var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
        if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
            aCallback(anHttpRequest.responseText);
        }
        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    }    
    this.post = function(url, callback) {
        var httpRequest = new XMLHttpRequest(); 
        httpRequest.onreadystatechange = function() { 
        if (httpRequest.readyState == 4 && httpRequest.status == 200)
            callback(httpRequest.responseText);
        }
        httpRequest.open( "POST", url, true );            
        httpRequest.send( null );

    }
}

function shuffle(o){ //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function occurrences(string, substring) {
    var n = 0;
    var pos = 0;
    var l = substring.length;

    while (true) {
        pos = string.indexOf(substring, pos);
        if (pos > -1) {
            n++;
            pos += l;
        } else {
            break;
        } 
    }
    return (n);
}

//this is test on 2015/3/6
var cumulativeOffset = function(element) {

    var top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);

    return {
        top: top,
        left: left
    };
};



// creates a notification
function spawnNotification(bodyOfNotification, iconOfNotification, titleOfNotification) {
  var actualBody = bodyOfNotification ? bodyOfNotification : '';
  var options = {
      body: actualBody,
      icon: iconOfNotification
  }

  var n = new Notification(titleOfNotification, options);
  window.setTimeout(function() {n.close();}, 5000);
}



