let websites = [];
let heister = {
    isRunning: false
};

(async () => {
    // Send message to content script in all tabs
    // const tabs = await chrome.tabs.query({})
    // for (const tab of tabs) {
    //     chrome.tabs.sendMessage(tab.id, { active: true, enabled: true })
    //     .then((response) => {
    //             console.info(response)
    //     })
    //     .catch((error) => {
    //             console.warn("Popup could not send message to tab %d", tab.id, error)
    //         })
    // }

    // getting active tab
    // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //     chrome.scripting.executeScript({
    //             target: { tabId: tabs[0].id },
    //             files: ["heister.js"],
    //         })
    //         .then(() => console.log("script injected"));
    // });


    // set 
    const data = await getDataFromStorage("websites");
    websites = data ? data : [];
    const data2 = await getDataFromStorage("heister");
    if (data2) heister = data2;
    getLatestTabId();
    getBalanceAndWager();
    await setDataInStorage("websites", websites);
    createDataTable(websites);
    console.log(websites);
})();

function getLatestTabId() {
    if (websites.length === 0) return;
    chrome.tabs.query({}, (tabs) => {
        for (const [index, website] of websites.entries()) {
            websites[index].active = false;
            console.log(websites[index], index, websites[index].active);
            for (const tab of tabs) {
                const tabUrl = (new URL(tab.url)).host;
                if (website.url === tabUrl) {
                    websites[index].id = tab.id;
                    websites[index].active = true;
                    break;
                }
            }
        }
    })
}

function getBalanceAndWager(){
    if (websites.length === 0) return;
    websites.forEach((website, index) => {
        chrome.tabs.sendMessage(website.id, { type: "balance_wager" }, (response) => {
            console.log(response);
            // websites[index].balance = response.balance;
            // websites[index].wager = response.wager;
        })
    })
}

function changeSize(event, tabId) {
    let size;
    websites.forEach(({ id, size }, index) => {
        if (id === tabId) {
            websites[index].size = (size === "small") ? "big" : "small";
            event.target.textContent = websites[index].size;
            event.target.style.backgroundColor = size === "small" ? "yellow" : "limegreen";
        }
    })
}

function removeTab(tabId) {
    if (!tabId) return;
    const filtered = websites.filter(({ id }) => id !== tabId);
    console.log("filtered", filtered);
    websites = filtered;
    createDataTable(websites);
}

// {id, url, amount, wager, size, isRunning, active}
function createDataTable(data) {
    const websitesData = document.getElementById("websitesData");
    if (!data || data.length === 0) return websitesData.innerHTML = "No data found";
    websitesData.innerHTML = '';
    data.forEach((website, index) => {
        const tr = document.createElement("tr");

        if (!heister.isRunning) {
            const activeCell = document.createElement("td");
            const activeCellSign = document.createElement("span");
            activeCellSign.style.color = website.active ? "green" : "red";
            activeCellSign.textContent = website.active ? "✓" : "✗";
            activeCellSign.width = "30px";
            activeCell.onclick = () => {
                if (website.active) {
                    chrome.tabs.remove(website.id, async () => {
                        websites[index].active = false;
                        await setDataInStorage("websites", websites);
                        createDataTable(websites);
                    });
                    return;
                }
                const newURL = "https://" + website.url;
                chrome.tabs.create({ url: newURL }, async (newTab) => {
                    websites[index].id = newTab.id;
                    websites[index].active = true;
                    await setDataInStorage("websites", websites);
                });
            };
            activeCell.appendChild(activeCellSign);
            tr.appendChild(activeCell);
        }

        const idCell = document.createElement("td");
        idCell.textContent = website.id ? website.id.toString().slice(-5) : "-";
        idCell.onclick = () => navigator.clipboard.writeText(website.id);
        tr.appendChild(idCell);

        const url = document.createElement("td");
        url.textContent = website.url ? website.url : "-";
        url.onclick = (event) => navigator.clipboard.writeText(event.target.textContent);
        tr.appendChild(url);

        const balanceCell = document.createElement("td");
        balanceCell.textContent = website.balance ? website.balance : "-";
        tr.appendChild(balanceCell);

        const wagerCell = document.createElement("td");
        wagerCell.textContent = website.wager ? website.wager : "-";
        tr.appendChild(wagerCell);

        const sizeCell = document.createElement("td");
        const size = document.createElement("span");
        sizeCell.width = "50px";
        size.textContent = website.size ? website.size : "-";
        size.style.backgroundColor = website.size === "small" ? "limegreen" : "yellow";
        size.style.padding = "2px 5px";
        size.onclick = (event) => changeSize(event, website.id);
        sizeCell.appendChild(size);
        tr.appendChild(sizeCell);

        if (heister.isRunning) {
            const actionCell = document.createElement("td");
            const btn = document.createElement("span");
            btn.innerHTML = `<img src="/icons/${website.isRunning ? 'stop.svg' : 'play.png'}" width="15">`;
            btn.style.cursor = "pointer";
            btn.onclick = async () => {
                if (website.isRunning) {
                    websites[index].isRunning = false;
                    console.log("stopped ", website.url);
                    btn.innerHTML = `<img src="/icons/play.png" width="12">`;
                } else {
                    websites[index].isRunning = true;
                    console.log("started ", website.url);
                    btn.innerHTML = `<img src="/icons/stop.svg" width="15">`;
                }
                await setDataInStorage("websites", websites);
            }
            actionCell.appendChild(btn);
            tr.appendChild(actionCell);
        } else {
            const actionCell = document.createElement("td");
            const removeBtn = document.createElement("span");
            removeBtn.innerHTML = `<img src="/icons/bin.svg" width="15" alt="delete">`;
            removeBtn.style.cursor = "pointer";
            removeBtn.onclick = () => removeTab(website.id);
            actionCell.appendChild(removeBtn);
            tr.appendChild(actionCell);
        }

        websitesData.appendChild(tr);
    })
}

document.getElementById("save").onclick = () => {
    const msg = document.getElementById("msg");
    setDataInStorage("websites", websites).then(() => {
        msg.innerHTML = "Data saved successfully!";
        msg.classList.add("success");
    }, (error) => {
        msg.innerHTML = "Error: " + error.message;
        msg.classList.add("error");
    })
    msg.hidden = false;
    setTimeout(() => msg.hidden = true, 3000);
}

document.getElementById("clear").onclick = () => {
    websites = [];
    createDataTable(websites);
    const msg = document.getElementById("msg");
    setDataInStorage("websites", websites).then(() => {
        msg.innerHTML = "Data cleared successfully!";
        msg.classList.add("success");
    }, (error) => {
        msg.innerHTML = "Error: " + error.message;
        msg.classList.add("error");
    })
    msg.hidden = false;
    setTimeout(() => msg.hidden = true, 3000);
}

document.getElementById("openAll").onclick = () => {
    websites.forEach(({ url, active }) => {
        if (active) return;
        const newURL = 'https://' + url;
        chrome.tabs.create({ url: newURL });
    })
    // show message
    const msg = document.getElementById("msg");
    msg.innerHTML = "All websites are already opened";
    msg.classList.add("error");
    msg.hidden = false;
    setTimeout(() => msg.hidden = true, 3000);
}

document.getElementById("startStopBtn").onclick = async () => {
    await setDataInStorage("websites", websites);
    const betAmount = document.getElementById("betAmount").value;
    heister.isRunning = !heister.isRunning;
    websites.forEach(({ id, active }, index) => {
        if (active) {
            // startBetting(id, betAmount);
            websites[index].isRunning = true;
        } else {
            websites[index].isRunning = false;
        }
    })
    await setDataInStorage("heister", heister);
    createDataTable(websites);
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