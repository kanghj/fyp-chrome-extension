var HttpClient = function() {
	this.get = function(aUrl, aCallback) {
		anHttpRequest = new XMLHttpRequest();
		anHttpRequest.onreadystatechange = function() {
			if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
				aCallback(anHttpRequest.responseText);
		}
		anHttpRequest.open('GET', aUrl, true);
		anHttpRequest.send(null);
	}
}

// var hostUrl = 'http://wordnews-mobile.herokuapp.com/';
var hostUrl = 'http://wordnews.herokuapp.com/';
// var hostUrl = 'http://localhost:3000/';

var userAccount = '';
var isWorking = ''; // 0: disable, 1: learn, 2: annotation
var categoryParameter = '';
var wordDisplay = '';
var wordsReplaced = '';
var websiteSetting = '';
var translationUrl = '';


function syncUser() {
	chrome.storage.sync
			.get(
					null,
					function(result) {
						userAccount = result.userAccount;
						// console.log('user acc: '+ result.userAccount);

						if (userAccount == undefined || typeof userAccount == "string") {
                            //TODO: Need to get the server to generate the User ID
                            
                            //This temporary method of generating will not create a true unique ID
							var i = new Date().getTime();;
                            i = i & 0xffffffff;
							userAccount = (i + Math.floor(Math.random() * i));//'id' + d.getTime() + '_1';
                            
							chrome.storage.sync.set({
								'userAccount' : userAccount
							}, function() {
							});
						}
						// console.log('userAccount ' + userAccount);

						isWorking = result.isWorking;
						if (isWorking == undefined) {
							isWorking = 1;
							chrome.storage.sync.set({
								'isWorking' : isWorking
							});
						}
						// console.log('isWorking '+isWorking);

						$("#mode .btn").removeClass('active');
						$("#mode .btn").removeClass('btn-primary');
						$("#mode .btn").addClass('btn-default');

						if (isWorking == 0) { // disable
							$('.website-checkbox input').prop('disabled', true);
							$('#displayEnglish').prop('disabled', true);
							$('#displayChinese').prop('disabled', true);
							$("#translationUrl .btn").prop('disabled', true);

							$("#mode #disable").addClass('active btn-primary');
							unpaintCursor();

						} else if (isWorking == 1) { // learn
							$('.website-checkbox input')
									.prop('disabled', false);
							$('#displayEnglish').prop('disabled', false);
							$('#displayChinese').prop('disabled', false);
							$("#translationUrl .btn").prop('disabled', false);

							$("#mode #learn").addClass('active btn-primary');
							unpaintCursor();

						} else { // annotate
							$('#displayEnglish').prop('disabled', true);
							$('#displayChinese').prop('disabled', true);
							$('.website-checkbox input')
									.prop('disabled', false);
							$('#translationUrl .btn').prop('disabled', true);

							$("#mode #annotate").addClass('active btn-primary');
							// removeAnnotationContextMenu();
							// addAnnotationContextMenu();
							paintCursor();
						}

						wordDisplay = result.wordDisplay;
						if (wordDisplay == undefined) {
							wordDisplay = 1;
							chrome.storage.sync.set({
								'wordDisplay' : wordDisplay
							});
						}
						console.log('wordDisplay ' + wordDisplay);
						if (wordDisplay == 0) {
							document.getElementById('displayEnglish').className = 'btn btn-default';
							document.getElementById('displayChinese').className = 'btn btn-primary active';
						} else {
							document.getElementById('displayEnglish').className = 'btn btn-primary active';
							document.getElementById('displayChinese').className = 'btn btn-default';
						}

						translationUrl = result.translationUrl
								|| "http://wordnews-mobile.herokuapp.com/";
						console.log('transUrl', translationUrl);
						if (translationUrl.indexOf('mobile') >= 0) {
							document.getElementById('dictionaryTranslations').className = 'btn btn-default';
							document.getElementById('imsTranslations').className = 'btn btn-default';
							document.getElementById('bingTranslations').className = 'btn btn-primary active';
						} else if (translationUrl.indexOf('wordnews') >= 0
								&& translationUrl.indexOf('ims') < 0) {
							document.getElementById('dictionaryTranslations').className = 'btn btn-primary active';
							document.getElementById('imsTranslations').className = 'btn btn-default';
							document.getElementById('bingTranslations').className = 'btn btn-default';
						} else {
							document.getElementById('dictionaryTranslations').className = 'btn btn-default';
							document.getElementById('imsTranslations').className = 'btn btn-primary active';
							document.getElementById('bingTranslations').className = 'btn btn-default';
						}

						wordsReplaced = result.wordsReplaced;
						// console.log('wordsReplaced '+wordsReplaced);
						if (wordsReplaced == undefined) {
							wordsReplaced = 2;
							// console.log('Set to default wordsReplaced
							// setting');
							chrome.storage.sync.set({
								'wordsReplaced' : wordsReplaced
							});
						} else {
							// document.getElementById('wordsReplaced').value =
							// wordsReplaced;
							$('#wordsReplaced').slider({
								precision : 2,
								value : wordsReplaced
							// Slider will instantiate showing 8.12 due to
							// specified precision
							});
						}

						websiteSetting = result.websiteSetting;
						// console.log('websiteSetting '+websiteSetting);
						if (websiteSetting == undefined) {
							websiteSetting = 'cnn.com_bbc.co';
							// console.log('Set to default website setting');
							chrome.storage.sync.set({
								'websiteSetting' : websiteSetting
							});
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

						remembered
								.get(
										hostUrl + '/getNumber?name='
												+ userAccount,
										function(answer) {
											var obj = JSON.parse(answer);
											if ('learnt' in obj) {
												document
														.getElementById('learnt').innerHTML = obj['learnt'];
											}
											if ('toLearn' in obj) {
												document
														.getElementById('toLearn').innerHTML = obj['toLearn'];
											}
										});
					});
}

function setWordReplace() {
	$('#wordsReplaced').on('slide', function(slideEvt) {
		chrome.storage.sync.set({
			'wordsReplaced' : slideEvt.value
		});
	});
}

function setWebsite() {
	$('input').change(function() {

		websiteSetting = '';
		if (document.getElementById('inlineCheckbox1').checked == true) {
			if (websiteSetting !== '')
				websiteSetting += '_';
			websiteSetting += document.getElementById('inlineCheckbox1').value;
		}

		if (document.getElementById('inlineCheckbox2').checked == true) {
			if (websiteSetting !== '')
				websiteSetting += '_';
			websiteSetting += document.getElementById('inlineCheckbox2').value;
		}
		if (document.getElementById('inlineCheckbox3').checked == true) {
			if (websiteSetting !== '')
				websiteSetting += '_';
			websiteSetting += document.getElementById('inlineCheckbox3').value;
		}

		// Comment out temporarily for now, to prevent the use of 'All website'
		/*
		 * if(document.getElementById('inlineCheckbox4').checked == true) {
		 * if(websiteSetting !== '') websiteSetting += '_'; websiteSetting+=
		 * document.getElementById('inlineCheckbox4').value; }
		 */

		chrome.storage.sync.set({
			'websiteSetting' : websiteSetting
		});
		chrome.storage.sync.get('websiteSetting', function(result) {
			userAccount = result.websiteSetting;
			// console.log('user websiteSetting: '+ result.websiteSetting);
		});
	});
}

function setTranslation() {
	$('#translationUrl .btn')
			.click(
					function() {
						$("#translationUrl .btn").removeClass('active');
						$("#translationUrl .btn").removeClass('btn-primary');
						$("#translationUrl .btn").addClass('btn-default');

						translationUrl = $(this).attr('id');
						if (translationUrl.indexOf('ims') >= 0) {
							chrome.storage.sync
									.set({
										'translationUrl' : 'http://imsforwordnews.herokuapp.com/show'
									});
							$("#translationUrl #imsTranslations").addClass(
									'active btn-primary');
						} else if (translationUrl.indexOf('dictionary') >= 0) {
							chrome.storage.sync
									.set({
										'translationUrl' : 'http://wordnews.herokuapp.com/show'
									});
							$("#translationUrl #dictionaryTranslations")
									.addClass('active btn-primary');
						} else {
							// this one uses Bing translator
							chrome.storage.sync
									.set({
										'translationUrl' : 'http://wordnews-mobile.herokuapp.com/show'
									});
							$("#translationUrl #bingTranslations").addClass(
									'active btn-primary');
						}
						reload();
					});
}

function setMode() {
	$('#mode .btn').click(function() {
		$("#mode .btn").removeClass('active');
		$("#mode .btn").removeClass('btn-primary');
		$("#mode .btn").addClass('btn-default');

		mode = $(this).attr('id');
		if (mode == 'learn') {
			isWorking = 1;
			chrome.storage.sync.set({
				'isWorking' : isWorking
			});
			$('#displayEnglish').prop('disabled', false);
			$('#displayChinese').prop('disabled', false);
			$('.website-checkbox input').prop('disabled', false);
			$("#translationUrl .btn").prop('disabled', false);
			$("#mode #learn").addClass('active btn-primary');
			// removeAnnotationContextMenu();
			unpaintCursor();

		} else if (mode == 'annotate') {
			isWorking = 2;
			chrome.storage.sync.set({
				'isWorking' : isWorking
			});
			// TODO: check the design
			$('#displayEnglish').prop('disabled', true);
			$('#displayChinese').prop('disabled', true);
			$('.website-checkbox input').prop('disabled', false);
			$("#translationUrl .btn").prop('disabled', true);
			$("#mode #annotate").addClass('active btn-primary');

			// removeAnnotationContextMenu();
			// addAnnotationContextMenu();
			paintCursor();
			window.close();

		} else { // disable
			isWorking = 0;
			chrome.storage.sync.set({
				'isWorking' : isWorking
			});
			$('.website-checkbox input').prop('disabled', true);
			$('#displayEnglish').prop('disabled', true);
			$('#displayChinese').prop('disabled', true);
			$("#translationUrl .btn").prop('disabled', true);
			$("#mode #disable").addClass('active btn-primary');
			// removeAnnotationContextMenu();
			unpaintCursor();
		}

		// TODO: Why call this?
		chrome.storage.sync.get(null, function(result) {
			isWorking = result.isWorking;
			console.log('user isworking: ' + result.isWorking);
		});

		// TODO: this function does not execute sometimes
		// alert("before");
		//reload();
	});
}

function addAnnotationContextMenu() {
	/*
	 * chrome.contextMenus.create({ title: "WordNews (Annotate)", contexts:
	 * ["selection"],
	 * 
	 * onclick: function () { alert("select") chrome.tabs.executeScript({ code:
	 * "window.getSelection().toString();" }, function (selection) {
	 * document.getElementById("output").value = selection[0];
	 * alert(selection[0]); }); } //onclick: select() });
	 * console.log("addAnnotationContextMenu");
	 */
}

function removeAnnotationContextMenu() {
	console.log("removeAnnotationContextMenu");
	chrome.contextMenus.removeAll();
}

function paintCursor() {
	console.log("paint cursor");
	chrome.tabs.query({
		active : true,
		currentWindow : true
	}, function(arrayOfTabs) {
		var cursor = chrome.extension.getURL('highlighter-orange.cur');
		console.log(cursor);
		//chrome.tabs.insertCSS({
		//	code : "body p { cursor: url(" + cursor + "), auto}"
		//});
		
		//chrome.tabs.executeScript(arrayOfTabs[0].id, {
			//code : "document.body.style.cursor = 'url(" + cursor + "),auto';"
			//file: "annotate.js"
		//});
		chrome.tabs.sendMessage(arrayOfTabs[0].id, {mode: "annotate", user_id: userAccount}, function(response) {
		});

	});
}

function unpaintCursor() {
	console.log("unpaint");
	chrome.tabs.query({
		active : true,
		currentWindow : true
	}, function(arrayOfTabs) {
		//chrome.tabs.executeScript(arrayOfTabs[0].id, {
			//code : "document.body.style.cursor = 'default';"
			//file: "unannotate.js"
		//});
		chrome.tabs.sendMessage(arrayOfTabs[0].id, {mode: "unannotate"}, function(response) {
		});
	});
}


// TODO: refine code
function setReplace() {
	$('.btn-toggle').click(function() {
		if (!isWorking) {
			return;
		}

		if ($(this).attr('id') == 'englishchinese') {
			$(this).find('.btn').toggleClass('btn-default');
			$(this).find('.btn').toggleClass('active');

			if (wordDisplay === 1) {
				wordDisplay = 0;
				chrome.storage.sync.set({
					'wordDisplay' : wordDisplay
				});
			} else {
				wordDisplay = 1;
				chrome.storage.sync.set({
					'wordDisplay' : wordDisplay
				});
			}

			chrome.storage.sync.get(null, function(result) {
				wordDisplay = result.wordDisplay;
				// console.log('user isworking: '+ result.wordDisplay);
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
		reload();
	});
}

function reload() {
	// alert("reload");
	console.log("reload");
	chrome.tabs.query({
		active : true,
		currentWindow : true
	}, function(arrayOfTabs) {
		var code = 'window.location.reload();';
		chrome.tabs.executeScript(arrayOfTabs[0].id, {
			code : code
		});
	});

	// window.location.reload();
	// chrome.tabs.reload();

}

function onWindowLoad() {
	syncUser();
	setWordReplace();
	setWebsite();
	setTranslation();
	setMode();
	setReplace();
	
	$('.btn-block').click(function() {
		window.open(hostUrl + 'displayHistory?name=' + userAccount);
	});
	// http://testnaijia.herokuapp.com/settings?name='+userAccount'
	$('#setting').click(function() {
		window.open(hostUrl + 'settings?name=' + userAccount);
	});
	// http://testnaijia.herokuapp.com/howtouse
	$('#documentation').click(function() {
		window.open(hostUrl + 'howtouse');
	});
}

window.onload = onWindowLoad;
