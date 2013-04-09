
// requires: file, client, settings
var client = new Client();
var extensionId = ''; // extension id for reload


// storage and reload

chrome.storage.sync.get(function (data) {
    settings.data = data;
    settings.sort();

    file.load('config/server.json', function (err, data) {
        if (err) throw err;
        var config = JSON.parse(data);
        client.connect(config, settings.data, function (e) {
            // ..
        });
    });
});

client.on('change', function (key, options) {
    if (options.extension) {
        extensionId = key;
        return disable();
    }
    // site
    chrome.tabs.query({}, function (tabs) {
        for (var i=0; i < tabs.length; i++) {
            var url = parseUrl(tabs[i].url);
            var path = settings.match(url.host + (url.path || ''));
            if (!path) continue;
            chrome.tabs.reload(tabs[i].id);
        }
    });
});

// inject

chrome.extension.onMessage.addListener(function (req, sender, sendResponse) {
    switch (req.message) {
        case 'onload':
            onload(sender.tab, sendResponse);
        break;
    }
    return true;
});

function onload (tab, cb) {
    var url = parseUrl(tab.url);
    inject(url, function (err, code) {
        if (err) cb({message: 'error'});
        cb({message: 'inject', code: code});
    });
}

// extension reload

function enable (cb) {
    chrome.management.setEnabled(extensionId, true, cb);
}
function disable (cb) {
    chrome.management.setEnabled(extensionId, false, cb);
}

chrome.management.onDisabled.addListener(function (extension) {
    if (extension.id !== extensionId) return;
    enable(function () {
        extensionId = '';
    });
});
