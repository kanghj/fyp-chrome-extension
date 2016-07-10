function launchGoogleLoginFlow(url) {
    console.log("Initialising new user account");
    chrome.identity.launchWebAuthFlow(
        {
            'url': url,
            'interactive': true
        },
        function (redirectedTo) {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
            } else {
                // Example: id_token=<(ID_TOKEN)>&authuser=0&hd=<.*>&session_state=<.*>&prompt=<.*>
                var response = redirectedTo.split('#', 2)[1];

                var id_token = response.match(/id_token=(.*)&authuser/)[1];

                $.post('https://wordnews-mobile.herokuapp.com/validate_google_id_token',
                    {
                        'id_token': id_token
                    }
                ).done(function (data) {
                    var userAccount = data['email'];
                    chrome.storage.sync.set({'userAccount': userAccount});
                });
            }
        }
    );
}

function makeUrlForGoogleOAuth() {
    var manifest = chrome.runtime.getManifest();

    var clientId = encodeURIComponent(manifest.oauth2.client_id);
    var scopes = encodeURIComponent(manifest.oauth2.scopes.join(' '));
    var redirectUri = encodeURIComponent('https://' + chrome.runtime.id + '.chromiumapp.org');

    var url = 'https://accounts.google.com/o/oauth2/auth' +
        '?client_id=' + clientId +
        '&response_type=id_token' +
        '&access_type=offline' +
        '&redirect_uri=' + redirectUri +
        '&scope=' + scopes;
    return url;
}
