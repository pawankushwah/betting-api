// context menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        title: "Stop All",
        contexts: ["all"],
        id: "stopAll"
    });
    chrome.contextMenus.create({
        title: "Add to My List",
        contexts: ["all"],
        id: "addWeb"
    });
});

// context menu on click
chrome.contextMenus.onClicked.addListener(genericOnClick);

// listening for Messages
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === 'openAllWebsites') {
        const websites = await getDataFromStorage('websites');
        websites.forEach(({ url }) => {
            const newURL = 'https://' + url;
            chrome.tabs.create({ url: newURL }, (newTab) => {
                if (chrome.runtime.lastError) {
                    console.error('Error creating tab:', chrome.runtime.lastError);
                } else {
                    console.log('Tab created:', newTab);
                    chrome.scripting.executeScript({
                        target: { tabId: newTab.id },
                        files: ['openHeister.js']
                      }, function(result) {
                        if (chrome.runtime.lastError) {
                          console.error('Error injecting script:', chrome.runtime.lastError);
                        } else {
                          console.log('Script injected successfully');
                        }
                      });
                }
            });
        })
    }
});

// action button onclick event Listener
chrome.action.onClicked.addListener(async (tabs) => {
    console.log("clicked on action button", tabs);
})

// function for context menu working
async function genericOnClick(info) {
    switch (info.menuItemId) {
        case 'stopAll':
            chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
                console.log(tabs);
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                        // document.querySelector(".stopBettingContainer > button").click();
                        console.log('stopped betting');
                    }
                })
            });
            break;

        case 'addWeb':
            try {
                const activeTabs = await getActiveTab();
                const url = new URL(activeTabs.url);
                if (url.protocol === "chrome:") break;
                let data = await getDataFromStorage('websites');
                if (!data) data = [];
                await setDataInStorage('websites', [...data, {
                    id: activeTabs.id,
                    title: activeTabs.title,
                    url: url.host,
                    size: 'small'
                }]);
            } catch (error) {
                console.error(error);
            }
            break;

        default:
            console.log('Standard context menu item clicked.');
    }
}

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