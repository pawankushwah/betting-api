// utility functions
function getDataFromStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (data) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
            } else {
                resolve(data[key]);
            }
        });
    });
}

function setDataInStorage(key, data) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: data }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
            } else {
                resolve();
            }
        });
    });
}

function getActiveTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
            } else if (tabs.length > 0) {
                resolve(tabs[0]);
            } else {
                reject('No active tab found');
            }
        });
    });
}

function executeScriptOnTabs(tabs, script, func) {
    return new Promise((resolve, reject) => {
        chrome.tabs.executeScript(tabs.id, { code: script }, (results) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
            } else {
                func(results);
                resolve();
            }
        });
    });
}

module.exports = {
    getDataFromStorage,
    setDataInStorage,
    getActiveTab,
    executeScriptOnTabs
}