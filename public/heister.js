(function (factory) {
    var glob;

    try {
        glob = window;
    } catch (e) {
        glob = self;
    }

    glob.Heister = { ...factory(), ...glob.Heister };
}(function () {

    async function loadScript(src) {
        const script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);

        return new Promise((resolve, reject) => {
            script.addEventListener('load', resolve);
            script.addEventListener('error', reject);
        });
    }

    function checkNotification() {
        // check for notification permission
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "denied") alert("Notification permission is necessary for alerts");
            });
        }
    }

    function dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const headerElement = document.getElementById(elmnt.id + "header");
        if (headerElement) {
            document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
            document.addEventListener('touchstart', touchStart, { passive: false });
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }

        // Cache the element being dragged
        let currentElement = null, initialTop, initialLeft;

        function touchStart(e) {
            currentElement = elmnt;  // Capture the draggable element
            if (!currentElement || !currentElement.classList.contains('draggable')) {
                return;
            }

            if (e.target !== headerElement) {
                return; // Only allow dragging if initiated on the header
            }
            e.preventDefault();

            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
            initialTop = elmnt.offsetTop;
            initialLeft = elmnt.offsetLeft;

            document.addEventListener('touchmove', elementDragTouch, { passive: false });
            document.addEventListener('touchend', closeDragElementTouch);
        }

        function elementDragTouch(e) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();

            const pos1 = pos3 - e.touches[0].clientX;
            const pos2 = pos4 - e.touches[0].clientY;

            elmnt.style.top = (initialTop - pos2) + "px";
            elmnt.style.left = (initialLeft - pos1) + "px";
        }

        function closeDragElementTouch() {
            document.removeEventListener('touchmove', elementDragTouch);
            document.removeEventListener('touchend', closeDragElementTouch);
            currentElement = null;  // Release the cached element
        }
    }

    function hashWithMD5(data) {
        // check for spark-md5 in global context
        if (typeof SparkMD5 === 'undefined') {
            throw new Error('SparkMD5 not found');
        }
        const spark = new SparkMD5();
        spark.append(data);
        return spark.end().toString().toUpperCase();
    }

    function Tt() {
        return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (e) {
            var t = Math.random() * 16 | 0
                , a = e === "x" ? t : t & 3 | 8;
            return a.toString(16)
        })
    }

    async function request(url, method, body) {
        let data, signature;
        try {
            data = {
                random: Tt(),
                ...JSON.parse(`${body}`)
            }
        } catch (e) {
            console.error(e);
        }

        const i = JSON.parse(JSON.stringify(data));
        const d = ["signature", "track", "xosoBettingData"];
        const r = {}
        let l = Object.keys(data);
        l = l.sort();
        l.forEach(m => {
            i[m] !== null && i[m] !== "" && !d.includes(m) && (r[m] = i[m] === 0 ? 0 : i[m])
        })

        try {
            signature = hashWithMD5(JSON.stringify(r));
        } catch (e) {
            console.error("hashWithMD5 error: " + e);
        }
        const newData = {
            ...data,
            "signature": signature,
            "timestamp": Math.floor(Date.now() / 1e3)
        }

        const req = await fetch(url, {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9,ne;q=0.8,hi;q=0.7,ar;q=0.6",
                "authorization": `Bearer ${localStorage.token}`,
                "content-type": "application/json;charset=UTF-8",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site"
            },
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": JSON.stringify(newData),
            "method": method,
            "mode": "cors",
            "credentials": "include"
        });

        const json = await req.json();
        return json;
    }

    function throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    async function runAt5thSecond(runAt, callback, params = []) {
        const func = async () => await callback(...params);
        await func()
        const now = new Date();
        const delay = (60 - now.getSeconds()) * 1000 + (1000 - now.getMilliseconds()) + runAt;

        setTimeout(async () => {
            if (keepRunning) {
                await func()
                const intervalId = setInterval(async () => {
                    if (keepRunning) throttle(async () => { await func() }, 60000)();
                    else clearInterval(intervalId);
                }, 60000);
                window.Heister.APP.intervalIds.push(intervalId);
            }
        }, delay);
    }

    function stopBetting() {
        const startBettingContainer = document.querySelector(".startBettingContainer");
        const stopBettingContainer = document.querySelector(".stopBettingContainer");
        keepRunning = false;
        window.Heister.APP.intervalIds.forEach(id => clearInterval(id));
        window.Heister.APP.intervalIds = [];
        stopBettingContainer.style.display = "none";
        startBettingContainer.style.display = "flex";
    }

    async function startBetting(size, amount = document.querySelector("#betAmount").value) {
        // starting local betting loop
        const sizeValues = ["big", "small"];
        if (!size || !sizeValues.includes(size)) return showSnackbar("select valid size");

        let newAmount;
        try {
            newAmount = parseInt(amount) || 1;
        } catch (e) {
            showSnackbar("Please enter a valid amount");
            return;
        }

        // removing old intervals
        window.Heister.APP.intervalIds.forEach(id => clearInterval(id));
        window.Heister.APP.intervalIds = [];

        // changing start button to stop button
        const startBettingContainer = document.querySelector(".startBettingContainer");
        const stopBettingContainer = document.querySelector(".stopBettingContainer");
        keepRunning = true;
        startBettingContainer.style.display = "none";
        stopBettingContainer.style.display = "flex";

        checkBalance();
        runAt5thSecond(5000, async (size, amount) => {
            // check for strike count
            const history = await request(`${Heister.CONSTANT.API_URL}/api/webapi/GetMyEmerdList`, "POST", `
                {
                    "pageSize": 20,
                    "pageNo": 1,
                    "typeId": 1,
                    "language": 0
                }
            `);

            // calculate strike count and show notification if strike is more than 5
            const today = new Date(); // get today date
            const todayDate = today.getDate();
            const arr = [...history.data.list]; // duplicates array
            let currentPeriodSum = 0;
            let currentIssueNumber = "";
            let strikeCount = 0;

            for (const [index, item] of arr.entries()) {
                const itemDate = new Date(item.addTime).getDate();
                if (itemDate !== todayDate) break;
                if (currentIssueNumber === item.issueNumber) {
                    if (item.state === 1) {
                        if (item.amount >= 100) continue;
                        else {
                            currentPeriodSum += item.amount;
                            if (arr[index + 1]?.issueNumber !== item.issueNumber) {
                                if (currentPeriodSum >= 100) strikeCount++;
                                else break;
                            } else continue;
                        }
                    }
                    else break;
                } else {
                    currentIssueNumber = item.issueNumber;
                }

                if (item.state === 1) {
                    if (item.amount < 100) {
                        if (arr[index + 1]?.issueNumber === item.issueNumber) continue;
                        else break;
                    } else strikeCount++;
                }
                else if (item.state === 0) {
                    if (strikeCount >= 5) {
                        showNotification(`Strike ${strikeCount}`, `Stop watching anime. Focus on betting`, 'STRIKE')
                    }
                    break;
                }
            }

            const winningPage = document.querySelector("#app > div.WinGo__C > div.WinningTip__C");
            const refreshBtn = document.querySelector(`#app > div.WinGo__C > div.GameList__C > div.GameList__C-item:nth-child(${Heister.APP.RefreshBtnNo})`);
            const historyBtn = document.querySelector("#app > div.WinGo__C > div.RecordNav__C > div:nth-child(3)");
            const gameHistoryBtn = document.querySelector("#app > div.WinGo__C > div.RecordNav__C > div:nth-child(3)");

            // click on UI if UI elements are available
            try {
                winningPage.click();
                refreshBtn.click();
                historyBtn.click();
            } catch (error) { console.warn(error) }

            // bet on the selected size
            const sizeCode = size === "big" ? 13 : 14;
            const issueNumber = await getCurrentPeriod();
            const res = await request(`${Heister.CONSTANT.API_URL}/api/webapi/GameBetting`, "POST", `
                {
                    "typeId": 1,
                    "issuenumber": "${issueNumber.toString()}",
                    "amount": ${amount},
                    "betCount": 1,
                    "gameType": 2,
                    "selectType": ${sizeCode},
                    "language": 0
                }
            `);
            if (res.msgCode !== 402) {
                showNotification("Unable to bet on " + size, res.msgCode + " " + res.msg, 'ERROR');
            }

            // click on UI if UI elements are available
            try {
                refreshBtn.click();
                gameHistoryBtn.click();
                historyBtn.click();
                refreshBtn.click();
            } catch (error) { console.warn(error) }

            checkBalance();
            checkWager();
        }, [size, newAmount]);
    }

    async function startBettingOnPairedApps() {
        openWebSocketSettingContainer();
    }

    async function getCurrentPeriod() {
        const res = await request(`${Heister.CONSTANT.API_URL}/api/webapi/GetGameIssue`, "POST", `{
                "typeId": 1,
                "language": 0
            }
        `);
        return res.data.issueNumber;
    }

    async function findTodayStrikes(isLess, amount) {
        // code for getting yesterday date if needed for chaging date to yesterday
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // const todayDate = new Date().toLocaleDateString();
        const todayDate = today.toLocaleDateString();
        console.log(todayDate);

        const data = [];

        // getting data from server and storing it in data variable
        let i = 1;
        while (true) {
            const res = await request(`${Heister.CONSTANT.API_URL}/api/webapi/GetMyEmerdList`, "POST", `{
                "pageSize": 40,
                "pageNo": ${i++},
                "typeId": 1,
                "language": 0
            }`);

            let streakData = res.data.list;
            if (streakData.length === 0) break;
            // check first element of streak data
            const firstItemDate = new Date(streakData[0].addTime).toLocaleDateString();
            if (firstItemDate !== todayDate) break;

            // check last element of streak data
            let lastItem = streakData[streakData.length - 1];
            const lastItemDate = new Date(lastItem.addTime).toLocaleDateString();
            if (lastItemDate === todayDate) data.push(...streakData);
            else {
                // check mid element of streak data
                let midItem = streakData[Math.floor(streakData.length / 2)];
                let midItemDate = new Date(midItem.addTime).toLocaleDateString();
                if (midItemDate === todayDate) {
                    for (let i = Math.floor(streakData.length / 2); i < streakData.length; i++) {
                        const d = new Date(streakData[i].addTime).toLocaleDateString();
                        if (d !== todayDate) {
                            data.push(...streakData.slice(0, i));
                            break;
                        }
                    }
                } else {
                    for (let i = 1; i < Math.floor(streakData.length / 2); i++) {
                        const d = new Date(streakData[i].addTime).toLocaleDateString();
                        if (d !== todayDate) {
                            data.push(...streakData.slice(0, i));
                            break;
                        }
                    }
                }
            }
        }

        if (data.length === 0) {
            showSnackbar("No Strikes Found");
            return []; // returns empty array
        }

        // getting strikes out of the data
        let strikesFirstPeriod = [];
        let betCount = 0;
        let strikeCount = 0;
        let currentIssueNumber = "";
        let currentPeriodAmount = 0;
        let sameIssueNumberCount = 0;
        let sentDuplicateReport = false;
        for (const [index, item] of data.entries()) {
            betCount++;
            // logic for duplicate issueNumber (period)
            if (currentIssueNumber !== "" && currentIssueNumber === item.issueNumber) {
                if (item.state === 1) {
                    console.log("found duplicate", item.issueNumber);
                    if(!sentDuplicateReport) {
                        // send data file to telegram

                    }
                    sameIssueNumberCount++;
                    currentPeriodAmount += item.amount;
                    if (currentPeriodAmount >= amount) {
                        if (data[index + 1]?.issueNumber === item.issueNumber) continue;
                        else strikeCount++;
                    } else {
                        if (item.issueNumber === data[index + 1]?.issueNumber) {
                            currentPeriodAmount += item.amount;
                        } else {
                            if (strikeCount >= 3) strikesFirstPeriod.push({ issueNumber: data[index - sameIssueNumberCount - 1].issueNumber, strikeCount, strikeDetail: [...data.slice(index - betCount + 1, index - sameIssueNumberCount)] })
                            sameIssueNumberCount = 0;
                            strikeCount = 0;
                            betCount = 0;
                        }
                        continue;
                    };
                    continue;
                } else {
                    if (strikeCount >= 3) {
                        strikesFirstPeriod.push({ issueNumber: data[index - sameIssueNumberCount - 1].issueNumber, strikeCount, strikeDetail: [...data.slice(index - betCount + 1, index - sameIssueNumberCount)] })
                    }
                    sameIssueNumberCount = 0;
                    strikeCount = 0;
                    betCount = 0;
                    continue;
                };
            } else {
                currentIssueNumber = item.issueNumber; // if period is not duplicate
            }

            if (item.state === 1) {
                if (item.amount >= amount) {
                    if (data[index + 1]?.issueNumber !== item.issueNumber) strikeCount++;
                    else continue;
                } else {
                    if (item.issueNumber === data[index + 1]?.issueNumber) {
                        currentPeriodAmount = item.amount;
                        continue;
                    } else {
                        if (strikeCount >= 3) strikesFirstPeriod.push({ issueNumber: data[index - 1].issueNumber, strikeCount, strikeDetail: [...data.slice(index - betCount + 1, index)] })
                        strikeCount = 0;
                        betCount = 0;
                        // continue;
                    }
                };
            } else if (item.state === 0) {
                if (strikeCount >= 3) strikesFirstPeriod.push({ issueNumber: data[index - 1].issueNumber, strikeCount, strikeDetail: [...data.slice(index - betCount + 1, index)] });
                strikeCount = 0;
                betCount = 0;
            } // else continue;
        }

        window.Heister.APP.streakData.unsorted = strikesFirstPeriod;
        if (strikesFirstPeriod.length > 0) {
            window.Heister.APP.streakData.sorted = [...strikesFirstPeriod].sort((a, b) => b.strikeCount - a.strikeCount);
            streakDataSortToggle();
        }
        else {
            showSnackbar("No Strikes Found");
        }
        return strikesFirstPeriod;
    }

    // UI function 
    function getSetUserId() {
        const userId = document.getElementById("userId");
        const userIdValue = JSON.parse(localStorage.userInfo).userId ? JSON.parse(localStorage.userInfo).userId : 0;
        return userId.textContent = userIdValue;
    }

    function reloadModal() {
        const tabs = document.querySelectorAll(".modalTabContent");
        let currentTabIndex = 0;
        tabs.forEach((tab, index) => {
            if (tab.hidden === false) currentTabIndex = index;
        });

        console.log(tabs[currentTabIndex].id);
        switch (tabs[currentTabIndex].id) {
            case "modalHome":
                const tableData = document.getElementById("tableData");
                tableData.innerHTML = "";
                break;

            case "modalDetails":
                // updateBankCard();
                // getStreakBonusData();
                break;

            case "modalBonusResponse":
                getBonusResponse();
                break;

            default:
                break;
        }
    }

    function initSnackbar() {
        window.Heister.snackbarQueue = [];
        window.Heister.canShowNextSnackbar = true;
    }

    function showSnackbar(message) {
        window.Heister.snackbarQueue.push(message);
        window.Heister.displayNextSnackbar();
    }

    function displayNextSnackbar() {
        if (window.Heister.snackbarQueue.length === 0) return;
        if (window.Heister.canShowNextSnackbar === false) return;
        const message = window.Heister.snackbarQueue.shift();
        if (message) {
            const x = document.getElementById("snackbar");
            x.innerHTML = `<span>${message}</span>${window.Heister.snackbarQueue.length ? '<span class="message-count">' + window.Heister.snackbarQueue.length + '</span>' : ''}`;
            x.className = "show";
            window.Heister.canShowNextSnackbar = false;
            setTimeout(() => {
                x.className = x.className.replace("show", "");
                window.Heister.canShowNextSnackbar = true;
                window.Heister.displayNextSnackbar();
            }, 3000);
        }
    }

    function createTableData(data) {
        // sorting data
        const streakTableContainer = document.getElementById('streakTableContainer');
        streakTableContainer.hidden = false;
        const tableBody = document.getElementById('tableData');
        tableBody.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');
            const periodCell = document.createElement('td');
            periodCell.textContent = item.issueNumber;
            periodCell.onclick = () => {
                navigator.clipboard.writeText(item.issueNumber);
                showSnackbar('Period copied to clipboard!');
            }
            row.appendChild(periodCell);

            const strikeCountCell = document.createElement('td');
            strikeCountCell.textContent = item.strikeCount;
            row.appendChild(strikeCountCell);

            const claimButton = document.createElement('button');
            claimButton.textContent = "claim";
            claimButton.classList.add('copy-btn');
            claimButton.style.backgroundColor = 'orange';
            claimButton.addEventListener('click', (e) => {
                console.log(e);
                e.target.textContent = "Sending...";
                claimStrike(item.issueNumber).then(() => {
                    e.target.textContent = "Done!";
                });
            });
            const claimCell = document.createElement('td');
            claimCell.appendChild(claimButton);
            row.appendChild(claimCell);

            tableBody.appendChild(row);
        });
    }

    function openModalTab(tabId = "") {
        if (tabId === "" && tabBodiesClass === "") return;
        const switchToTab = document.getElementById(tabId);
        const tabs = document.querySelectorAll(".modalTabContent");
        tabs.forEach(tab => {
            tab.hidden = true;
        });
        switchToTab.hidden = false;
    }

    function showNotification(title, body = "", tag) {
        const icon = Heister.APP.APP_LOGO_URL;
        try {
            if ('Notification' in window) {
                new Notification(title, {
                    body, icon, tag
                });
            }
        } catch (error) {
            console.error("Notification creation failed:", error);
        }
    }

    async function checkBalance(showMessage = true) {
        const balance = await request(`${Heister.CONSTANT.API_URL}/${Heister.APP.BALANCE_URL}`, "POST", `{"language": 0}`)

        if (showMessage) {
            if (balance.data.amount < 100) showNotification(`You can't bet further ${balance.data.amount}`, 'LOW_BALANCE');
            else if (balance.data.amount < 200) showNotification("Balance is less than 200", `Please top up your account.\ncurrent balance: ${balance.data.amount}`, 'LOW_BALANCE');
        }

        const balStr = parseFloat(balance.data.amount).toLocaleString('en-US', { style: 'currency', currency: 'INR' });
        document.getElementById("balance").innerHTML = balStr;
        try {
            document.querySelector("div.Wallet__C-balance-l1 > div").innerText = balStr;
        } catch (error) { }

        let wager = await checkWager();
        return {
            balance: balance.data.amount,
            wager
        }
    }

    async function checkWager() {
        const wager = await request(`${Heister.CONSTANT.API_URL}/api/webapi/getWithdrawals`, "POST", `{
            "withdrawid": 1,
            "language": 0
        }`)

        const wagerElement = document.getElementById("wager");
        wagerElement.innerText = wager.data.withdrawalsrule.amountofCode;
        return wager.data.withdrawalsrule.amountofCode;
    }

    async function getSelfServiceUrl() {
        // const data = await request(`${window.Heister.CONSTANT.API_URL}/api/webapi/GetCustomerServiceList`, "POST", `{
        //     "typeId": 3,
        //     "language": 0
        // }`);
        return "";
    }

    function clickRefreshBtn() {
        const refreshBtn = document.querySelector(`#app > div.WinGo__C > div.GameList__C > div.GameList__C-item:nth-child(${Heister.APP.RefreshBtnNo})`);
        refreshBtn.click();
    }

    async function getBonusResponse() {
        let url = new URL(Heister.APP.SelfServiceUrl);
        url.protocol = "https:";
        const res = await fetch(`${Heister.CONSTANT.MY_API_URL}/strike/data`, {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "apiUrl": url.origin,
                "uid": Heister.CONSTANT.USER_ID,
                template: "E"
            })
        });

        const data = await res.json();
        if (!data.result) return data;
        let text = data.result[0] ? "Found Some Data" : "No Bonus Data Found 🥹: we'll get it!";
        showSnackbar(text);
        const modalBonusResponse = document.getElementById("modalBonusResponse");
        modalBonusResponse.innerHTML = "";
        data.result.forEach((item) => {
            modalBonusResponse.innerHTML += `
                <div style="display:flex; flex-direction:column; justify-content:space-between; margin:5px 0; padding:7px; border-radius:6px; background-color:#e4dcdc">
                    <div style="display:flex; justify-content: space-between; padding:7px;">
                        <div>${item.submitDate}</div>
                        ${item.status == 5 ? `<div style="color:red;font-weight:bolder">Rejected</div>` : `<div style="color:green;font-weight:bolder">${item.lottery}</div>`}
                    </div>
                    <div style="background-color: white; padding: ${item.responseMsg ? '10px' : '0'}; border-radius: 10px;">${item.responseMsg}</div>
                </div>`
        })
        return data;
    }

    function isValidTelegramUsername(username) {
        const telegramUsernameRegex = /^@[a-zA-Z0-9_]+$/;
        if (telegramUsernameRegex.test(username) && username.length >= 5 && username.length <= 32) {
            return true;
        } else {
            return false;
        }
    }

    function formatToINR(number) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,  // Ensures 2 decimal places for cents
        }).format(number);
    }

    async function checkTelegramUser(data) {
        // check user data from server
        const checkUserRes = await fetch(`${Heister.CONSTANT.MY_API_URL}/telegram/checkUser`, {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        let json = await checkUserRes.json();
        if (json.code === 0) {
            if(!json.data) return;
            localStorage.__heister__telegram = JSON.stringify(json.data);
        } else {
            localStorage.removeItem("__heister__telegram");
            alert(json.message);
            return;
        }
    }

    async function claimStrike(period) {
        let url, template = "E";
        if (Heister.APP.NAME.toLowerCase() === "91club") {
            url = new URL("https://91clubactivity.in");
            template = "F";
        } else if (Heister.APP.NAME.toLowerCase() === "tc") {
            if (!localStorage.__heister__telegram || !JSON.parse(localStorage.__heister__telegram)) {
                let user = prompt("Enter your telegram username or chatId");
                
                // checks if the user entered a valid telegram username
                const data = {}
                if (parseInt(user) > 0) {
                    data.id = user;
                } else if (isValidTelegramUsername(user)) {
                    data.username = user;
                } else {
                    alert("Invalid telegram username or chatId");
                    return;
                }

                await checkTelegramUser(data);
            } else {
                // checks for requirements for sending screenshot to user
                // check the user 
                if (!window.Heister.telegram.checklist) {
                    checkTelegramUser(JSON.parse(localStorage.__heister__telegram));

                    // get the bot token
                    const res = await fetch(`${Heister.CONSTANT.MY_API_URL}/telegram/getBotToken`, {
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/json"
                        }
                    });
                    const data = await res.json();
                    if(!data.token) return alert("Failed to get telegram token");
                    window.Heister.telegram.botToken = data.token;

                    // load the htmltocanvas library
                    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");

                    
                    window.Heister.telegram.checklist = true;
                } 

                // get the data
                let data = Heister.APP.streakData.unsorted.filter((item) => {
                    return item.issueNumber === period;
                });

                // convert data to table and table to image
                const newContainer = document.createElement('div');
                newContainer.classList.add('MyGameRecordList__C');
                data[0].strikeDetail.forEach(({addTime, selectType, issueNumber, profitAmount, realAmount, state}) => {
                    newContainer.innerHTML += `
                    <div class="MyGameRecordList__C-item">
                        <div class="MyGameRecordList__C-item-l MyGameRecordList__C-item-l-${selectType}">
                            ${selectType}
                        </div>
                        <div class="MyGameRecordList__C-item-m">
                            <div class="MyGameRecordList__C-item-m-top">
                                ${issueNumber}
                            </div>
                            <div class="MyGameRecordList__C-item-m-bottom">
                                ${addTime}
                            </div>
                        </div>
                        <div class="MyGameRecordList__C-item-r ${state && 'success'}">
                            <div class="${state && 'success'}">${state ? 'Succeed' : 'Failed'}</div>
                            <span>${state ? "+" + formatToINR(profitAmount) : formatToINR(-realAmount)}</span>
                        </div>
                    </div>
                    
                    <style>
                        .MyGameRecord__C {
                            width: ${Heister.telegram.ss.width};
                            margin: .32rem auto 0;
                        }

                        /* .MyGameRecordList__C-item {
                            border-top: .01333rem solid #e4e4e4;
                        } */

                        .MyGameRecord__C-body {
                            background-color: var(--darkBg, #FFF);
                            padding: 0 .32rem;
                        }

                        .MyGameRecordList__C {
                            background-color: white;
                        }

                        .MyGameRecordList__C-item {
                            height: 1.81333rem;
                            padding: .37333rem .13333rem;
                            display: -webkit-box;
                            display: -webkit-flex;
                            display: flex;
                            -webkit-box-align: center;
                            -webkit-align-items: center;
                            align-items: center;
                            border-top: .01333rem solid #e4e4e4;
                        }

                        .MyGameRecordList__C-item-l {
                            height: .96rem;
                            width: .96rem;
                            line-height: .96rem;
                            text-align: center;
                            border-radius: .26667rem;
                            color: #fff;
                            font-size: .64rem;
                            margin-right: .29333rem;
                            -webkit-box-flex: 0;
                            -webkit-flex: none;
                            flex: none;
                            overflow: hidden;
                        }
                        
                        .MyGameRecordList__C-item-l-big {
                            background: #FEAA57;
                            font-size: .32rem;
                        }
                        
                        .MyGameRecordList__C-item-l-small {
                            background: #6EA8F4;
                            font-size: .32rem;
                        }

                        .MyGameRecordList__C-item-m {
                            -webkit-box-flex: 0;
                            -webkit-flex: none;
                            flex: none;
                        }

                        .MyGameRecordList__C-item-m-top {
                            height: .45333rem;
                            line-height: .45333rem;
                            font-size: .37333rem;
                            color: var(--darkTextW, var(--text_color_L1));
                            margin-bottom: .24rem;
                        }
                        .MyGameRecordList__C-item-m-bottom {
                            font-size: .29333rem;
                            color: var(--text_color_L2);
                        }
                        
                        .MyGameRecordList__C-item-r {
                            -webkit-box-flex: 1;
                            -webkit-flex: 1;
                            flex: 1;
                            font-weight: 500;
                            font-size: .37333rem;
                            height: .96rem;
                            color: var(--norm_red-color);
                            display: -webkit-box;
                            display: -webkit-flex;
                            display: flex;
                            -webkit-box-align: end;
                            -webkit-align-items: flex-end;
                            align-items: flex-end;
                            -webkit-box-pack: center;
                            -webkit-justify-content: center;
                            justify-content: center;
                            -webkit-box-orient: vertical;
                            -webkit-box-direction: normal;
                            -webkit-flex-direction: column;
                            flex-direction: column;
                        }

                        .MyGameRecordList__C-item-r.success {
                            color: var(--norm_green-color);
                        }

                        .MyGameRecordList__C-item-r.success div {
                            color: var(--norm_green-color);
                            border-color: var(--norm_green-color);
                        }

                        .MyGameRecordList__C-item-r div {
                            color: var(--norm_red-color);
                            border: .01333rem solid var(--norm_red-color);
                            border-radius: .13333rem;
                            height: .48rem;
                            line-height: .48rem;
                            font-size: .29333rem;
                            padding: 0 .48rem;
                            margin-bottom: .08rem;
                        }

                        .MyGameRecordList__C-item-r span {
                            word-wrap: break-word;
                            word-break: break-all;
                        }
                    </style>`;
                })
                const gameRecordContainer = document.createElement('div');
                gameRecordContainer.classList.add("MyGameRecord__C", "game-record", "__screenshot");
                gameRecordContainer.style.position = "absolute";

                const tbody = document.createElement('div');
                tbody.classList.add("MyGameRecord__C-body");

                tbody.appendChild(newContainer);
                gameRecordContainer.appendChild(tbody);
                gameRecordContainer.style.left = "100%";
                document.body.appendChild(gameRecordContainer);

                html2canvas(gameRecordContainer).then(function(canvas) {
                    // const imgData = canvas.toDataURL('image/png');

                    // sending image to telegram
                    const id = parseInt(JSON.parse(localStorage.__heister__telegram).id);
                    console.log("Sending Image");
                    canvas.toBlob(function(blob) {
                        const formData = new FormData();
                        formData.append('chat_id', id);
                        formData.append('photo', blob, 'image.png');  // Blob is the image file
            
                        // Attempt to send to Telegram Bot API (this will fail due to CORS)
                        fetch(`https://api.telegram.org/bot${Heister.telegram.botToken}/sendPhoto`, {
                            method: 'POST',
                            body: formData
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log('Image sent successfully:', data);
                            const __screenshot = document.getElementsByClassName("__screenshot");
                            for (let i = 0; i < __screenshot.length; i++) {
                                __screenshot[i].remove();
                            }
                        })
                        .catch(error => {
                            console.error('Error sending image:', error);
                        });
                    });
                    // downloadImage(imgData, 'data-image.png'); 
                });

                // removing screenshot from document
            }
            return;
        } else {
            url = new URL(Heister.APP.SelfServiceUrl);
        }
        url.protocol = "https:";
        const res = await fetch(`${Heister.CONSTANT.MY_API_URL}/strike/claim`, {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "apiUrl": url.origin,
                "uid": Heister.CONSTANT.USER_ID,
                "period": period,
                "template": template
            })
        });
        const data = await res.json();
        showSnackbar(data.message);
    }

    function downloadImage(dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
    }

    function openWebSocketSettingContainer() {
        const modal = document.querySelector(".modal");
        const webSocketContainer = document.getElementById("webSocketContainer");

        modal.style.left = "-100%";
        webSocketContainer.style.left = "0";
    }

    function openMainModal() {
        const modal = document.querySelector(".modal");
        const webSocketContainer = document.getElementById("webSocketContainer")

        modal.style.left = "0";
        webSocketContainer.style.left = "100%"
    }

    // get RefreshBtnNo
    async function getRefreshBtnNo() {
        const res = await request(`${Heister.CONSTANT.API_URL}/api/webapi/GetTypeList`, "POST", `
                {
                    "language": 0
                }
            `);
        res.data.sort((a, b) => b.sort - a.sort);
        for (const item of res.data) {
            if (item.intervalM === 1) {
                window.Heister.APP.RefreshBtnNo = res.data.indexOf(item) + 1;
                return window.Heister.APP.RefreshBtnNo;
            };
        }
    }

    // get customer service link
    async function getCustomerServiceLink() {
        const res = await request(`${Heister.CONSTANT.API_URL}/api/webapi/GetSelfCustomerServiceLink`, "POST", `{
            "webSite": "https%3A%2F%2F${location.hostname}",
            "language": 0
        }`);
        return res.data;
    }

    // open url and hides the hover-icons
    async function openUrl(url, callback = null) {
        document.querySelector(".hover-icons-container").style.display = "none";
        location.replace(url);
        callback && callback();
    }

    async function loginOff() {
        const res = await request(`${Heister.CONSTANT.API_URL}/api/webapi/LoginOff`, "POST", `{
            "language": 0
        }`);
        return res.data;
    }

    // socket.io
    function streakDataSortToggle() {
        const streakDataLen = window.Heister.APP.streakData?.sorted.length;
        const streakData = window.Heister.APP.streakData;
        if (streakDataLen > 0) {
            const data = streakData.showSorted ? streakData.sorted : streakData.unsorted;
            createTableData(data);
            streakData.showSorted = !streakData.showSorted;
        }
    }

    async function init() {
        window.Heister.media = {};
        window.Heister.CONSTANT = Object.freeze({
            HOSTNAME: window.location.hostname,
            API_URL: window.CONFIG.VITE_API_URL,
            MY_API_URL: "https://betting-api-eosin.vercel.app",
            // MY_API_URL: "http://localhost:1234",
            USER_ID: JSON.parse(localStorage.userInfo).userId ? JSON.parse(localStorage.userInfo).userId : 0
        })

        window.Heister.APP = {
            NAME: document.title,
            APP_LOGO_URL: "",
            BALANCE_URL: "api/webapi/GetBalance",
            RefreshBtnNo: 2,
            SelfServiceUrl: "",
            streakData: {
                showSorted: true,
                sorted: [],
                unsorted: []
            },
            intervalIds: []
        }

        // global variables
        window.Heister.keepRunning = true;
        window.Heister.telegram = {
            checklist: false,
            ss: {
                width: "10rem"
            }
        }

        // intialize Heister
        checkNotification();
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.js');
        window.Heister.APP.SelfServiceUrl = await getSelfServiceUrl(); // getting self service URL

        // setting variables
        // setRefreshBtnPosition();
        window.Heister.APP.APP_LOGO_URL = JSON.parse(localStorage.SettingStore).projectLogo;
        history.pushState(null, '', '/#/');
        location.replace("/#/home/AllLotteryGames/WinGo?id=1");

        const liteModal = document.createElement("div");
        liteModal.innerHTML += `
                    <div id="topContainer" class="draggable">
                        <span id="balanceContainer">
                            <span id="wager"></span>
                            <span id="balance"></span>
                            <img src="/assets/png/refireshIcon-2bc1b49f.png" alt="gear icon" width="25" onclick="Heister.checkBalance(false)">
                            <span class="timeLeft" id="topContainerheader"></span>
                        </span>
                    </div>
                    <div class="hover-icons-container">
                        <div class="hover-icons">
                            <span onclick="Heister.openUrl('/#/vip')">VIP Bonus</span>
                            <span onclick="Heister.openUrl('/#/main')">Profile</span>
                            <span onclick="Heister.openUrl('/#/activity/DailySignIn')">Attendence Bonus</span>
                            <span onclick="Heister.openUrl('/#/activity/DailyTasks')">Activity Reward</span>
                            <span onclick="Heister.openUrl('/#/home/AllLotteryGames/WinGo?id=1');setTimeout(()=>{Heister.clickRefreshBtn()},1500)">Wingo Game</span>
                            <span onclick="Heister.openUrl('/#/activity/Turntable')">Turnable Wheel</span>
                            <span onclick="Heister.openUrl('/#/wallet/TransAction')">Transaction</span>
                            <span onclick="Heister.openUrl('/#/wallet/RechargeHistory')">Deposit History</span>
                            <span onclick="Heister.openUrl('/#/wallet/WithdrawHistory')">Withdrawal History</span>
                            <span onclick="Heister.openUrl('/#/main/GameStats')">Game Statistics</span>
                            <span onclick="Heister.getCustomerServiceLink().then((res)=>{window.open(res);});">Customer Service</span>
                            <span onclick="Heister.openUrl('/#/promotion')">Promotion Page</span>
                            <span onclick="Heister.openUrl('/#/activity')">Activity Page</span>
                            <span onclick="Heister.loginOff();Heister.openUrl('/#/login')">Log Out</span>
                        </div>
                    </div>
                    <div id="openModalButton">
                        <span class="btnIcon">&LeftAngleBracket;</span>
                        <span class="btnIcon2"></span>
                    </div>
                    <div class="snackbar" id="snackbar"></div>

                    <div class="modalContainer" hidden>
                        <div id="modalOverflow">
                            <!-- Main Modal -->
                            <div class="modal" hidden>
                                <div class="topSection spaceBetweenCenter">
                                    <div >
                                        <span id="userIdContainer">
                                            <span id="userId"></span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="20" viewBox="0 0 24 24" fill="none" onclick="navigator.clipboard.writeText(window.Heister.CONSTANT.USER_ID); Heister.showSnackbar('Copied!')">
                                                <rect x="6.5" y="6.5" width="9" height="13" rx="1.5" stroke="#ffffff"></rect>
                                                <path d="M8.5 6C8.5 5.17157 9.17157 4.5 10 4.5H16C16.8284 4.5 17.5 5.17157 17.5 6V16C17.5 16.8284 16.8284 17.5 16 17.5" stroke="#ffffff"></path>
                                            </svg>
                                        </span>
                                    </div>
                                    <div class="flex" id="tool">
                                        <span class="webSocketSetting" title="open web socket setting" onclick="Heister.openWebSocketSettingContainer()">⚙️</span>
                                        <span class="selfService" title="Self Service" onclick="window.open(Heister.APP.SelfServiceUrl)">❓</span>
                                        <span class="reload" title="Reload Header Tabs" id="modalReloadBtn" onclick="Heister.reloadModal()">
                                            <img src="/assets/png/refireshIcon-2bc1b49f.png" alt="gear icon" width="25">
                                        </span>
                                        <span class="close" id="modalCloseBtn">&times;</span>
                                    </div>
                                </div>

                                <!-- betting start and stop related -->
                                <div class="startBettingContainer">
                                    <div class="buttons">
                                        <button class="startBettingBig" onclick="Heister.startBetting('big')">Big</button>
                                        <input type="tel" id="betAmount" placeholder="Enter Amount" value="100">
                                        <button class="startBettingSmall" onclick="Heister.startBetting('small')">Small</button>
                                    </div>
                                </div>
                                <div class="stopBettingContainer" hidden>
                                    <button onclick="Heister.stopBetting()">Stop Betting</button>
                                </div>

                                <!-- Modal Header Section -->
                                <div id="modalHeader">
                                    <span class="modalTabs" title="Home" onclick="Heister.openModalTab('modalHome')">🏠</span>
                                    <span class="modalTabs" title="Bonus" onclick="Heister.openModalTab('modalBonusResponse')">💵</span>
                                    <button class="modalTabs" title="Look for Strikes" onclick="Heister.findTodayStrikes(false, 100)">😯</button>
                                    <span class="modalTabs" title="Coming Soon" onclick="Heister.showSnackbar('Coming Soon')">🤯</span>
                                    <!-- <span class="modalTabs" title="BlastIt" onclick="Heister.">🤯</span> -->
                                </div>

                                <!-- modal content container 1 -->
                                <div class="modalTabContent" id="modalHome">
                                    <div id="streakTableContainer" hidden>
                                        <div class="spaceBetweenCenter">
                                            <input type="number" id="filterInput" placeholder="Filter by Streak Count">
                                            <span style="font-size: 20px" onclick="Heister.streakDataSortToggle()">🔝</span>
                                        </div>
                                        <table id="strikeTable">
                                            <thead></thead>
                                            <tbody id="tableData"></tbody>
                                        </table>
                                    </div>
                                </div>
                                <!-- modal content container 2 -->
                                <div class="modalTabContent" id="modalDetails" hidden>
                                    <div class="sectionHeader">Bank Card</div>
                                    <div id="bankCard">
                                        <div>
                                            <span id="userName"></span>
                                            <span id="mobile"></span>
                                        </div>
                                        <div>
                                            <div id="bankName"></div>
                                            <div id="cardNumber"></div>
                                        </div>
                                    </div>
                                    <div class="sectionHeader">Bonus</div>
                                    <div id="todayBonuses"></div>
                                </div>
                                <!-- modal content container 3 -->
                                <div class="modalTabContent" id="modalBonusResponse" hidden></div>
                            </div>

                            <!-- setting modal container -->
                            <div id="webSocketContainer" hidden>
                                <div class="topSection spaceBetweenCenter">
                                    <div onclick="Heister.openMainModal()">&lt;</div>
                                    <br />
                                    <br />
                                    <div>
                                        <span></span>
                                        <button onclick="this.previousElementSibling.innerHTML = JSON.parse(localStorage.getItem('__heister__telegram')).username + '(' + JSON.parse(localStorage.getItem('__heister__telegram')).id + ')';">load telegram Details</button>
                                    </div>
                                    <br />
                                    <button onclick="localStorage.removeItem('__heister__telegram'); Heister.telegram.checklist = false;Heister.showSnackbar('cleared the data')">clear telegram data</button>
                                </div>
                            </div>
                        </div>

                    </div>

                    <style>
                        :root {
                            --modalWidth: 250px;
                            --modalHeight: 400px;
                        }

                        * {
                            box-sizing: border-box;
                        }

                        
                        .spaceBetweenCenter {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }

                        .flex {
                            display: flex;
                        }

                        .flexColumn {
                            display: flex;
                            flex-direction:column
                        }

                        #topContainer {
                            position: fixed;
                            top: 15px;
                            left: 50%;
                            z-index: 9999;
                            color: white;
                            padding: 5px;
                            font-size: 10px;
                            transform: translateX(-50%);
                        }

                        #balanceContainer {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 15px;
                            background-color: white;
                            color: black;
                            border-radius: 10px;
                            min-height: .58667rem;
                            line-height: .58667rem;
                            text-align: center;
                            font-weight: 700;
                            font-size: .48rem;
                            overflow: hidden;
                        }

                        #wager {
                            padding: 5px 10px;
                            background-color: burlywood;
                        }

                        .timeLeft {
                            padding: 5px;
                            background-color: rgba(255, 0, 0);
                            cursor: move;
                            width: 50px;
                        }

                        #openModalButton {
                            position: fixed;
                            top: 50%;
                            right: 0;
                            color: white;
                            border-radius: 10px 0 0 10px;
                            cursor: pointer;
                            z-index: 9998;
                            font-size: xx-large;
                            height: 80px;
                            display: flex;
                            flex-direction: column;
                        }

                        .hover-icons-container {
                            display: none;
                            width: 100%;
                            height: 100%;
                            background-color: #000000f0;
                            position: fixed;
                            z-index: 9999;
                            left: 0;
                            top: 0;
                        }

                        #openModalButton .btnIcon {
                            padding: 5px;
                            background-color: blueviolet;
                            border-top-left-radius: 10px;
                        }

                        #openModalButton .btnIcon2 {
                            padding: 5px;
                            background-color: red;
                            border-bottom-left-radius: 10px;
                            height: 100%;
                        }

                        .hover-icons {
                            position: absolute;
                            left: 50%;
                            top: 50%;
                            transform: translate(-50%, -50%);
                            z-index: -10;
                            padding: 10px;
                            width: 8rem;
                            height: 100vh;
                            padding: 50px 0;
                            overflow: auto;
                            scrollbar-width: none;
                        }

                        .hover-icons > span {
                            width: 100%;
                            height: 50px;
                            font-size: 20px;
                            text-align: left;
                            background-color: white;
                            border-radius: 100px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            margin-bottom: 25px;
                        }

                        #snackbar {
                            opacity: 0;
                            visibility: hidden;
                            min-width: 250px;
                            background-color: #333;
                            color: #fff;
                            text-align: center;
                            border-radius: 2px;
                            padding: 8px;
                            position: fixed;
                            z-index: 99999;
                            left: 50%;
                            transform: translateX(-50%);
                            transition: visibility 0s, opacity 0.5s ease-in-out;
                            bottom: 30px;
                            font-size: 18px;
                        }

                        #snackbar.show {
                            visibility: visible;
                            opacity: 1;
                        }
                        
                        .message-count {
                            position: absolute;
                            top: -5px;
                            right: -5px;
                            width: 20px;
                            height: 20px;
                            background: red;
                            border-radius: 100%;
                        }

                        .modalContainer, .hover-icon-container {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.9);
                            display: none;
                            justify-content: center;
                            align-items: center;
                            z-index: 9999;
                        }

                        #modalOverflow {
                            position: relative;
                            padding: 50px 10px 50px 10px;
                            width: var(--modalWidth);
                            height: var(--modalHeight);
                            background-color: whitesmoke;
                            display: flex;
                            flex-direction: column;
                            border-radius: 10px;
                            font-family: sans-serif;
                            overflow: hidden;
                            scrollbar-width: none;
                        }

                        .modal, #webSocketContainer {
                            position: absolute;
                            top: 0;
                            left: 0;
                            padding: 50px 10px 50px 10px;
                            width: var(--modalWidth);
                            height: var(--modalHeight);
                            display: flex;
                            flex-direction: column;
                            scrollbar-width: none;
                            overflow: auto;
                            transition: all 0.5s ease-in-out;
                        }

                        .topSection {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            padding: 10px 10px;
                        }

                        #webSocketContainer {
                            left: 100%;
                        }

                        #modalHeader {
                            display: flex;
                            justify-content: space-between;
                            padding-top: 5px;
                        }

                        .modalTabs {
                            padding: 6px 10px;
                            margin: 3px 2px;
                            border-radius: 5px;
                            font-size: 20px;
                            border: 2px solid black;
                            cursor: pointer;
                            background-color: #797979;
                        }

                        .modalTabs:hover {
                            background-color: #4b4b4b;
                        }

                        #tool {
                            font-size: 17px;
                        }

                        #tool span {
                            opacity: 0.6;
                        }

                        #tool span:hover {
                            opacity: 1;
                        }

                        .close {
                            position: absolute;
                            top: 0;
                            right: 0;
                            padding: 5px 10px;
                            cursor: pointer;
                            background-color: red;
                            color: white;
                            border-radius: 10px;
                            font-size: 20px;
                            font-weight: bolder;
                            position: fixed;
                            z-index: 10;
                        }

                        #userIdContainer {
                            display: flex;
                            align-items: center;
                            background-color: #9c15e1;
                            padding: 2px 5px;
                            border-radius: 5px;
                            color: white;
                        }

                        .startBettingContainer input {
                            width: 40%;
                            padding: 5px 10px;
                            border: 1px solid black;
                            text-align: center;
                        }

                        .startBettingContainer {
                            display: flex;
                            flex-direction: column;
                            gap: 10px;
                        }

                        .startBettingContainer .buttons {
                            display: flex;
                        }

                        .modal .buttons button {
                            width: 50%;
                            padding: 10px;
                            color: white;
                            border: none;
                            cursor: pointer;
                            font-size: 15px;
                        }

                        .startBettingBig {
                            background-color: #e3af0d;
                            border-radius: 10px 0 0 10px;
                        }

                        .startBettingSmall {
                            background-color: #359220;
                            border-radius: 0 10px 10px 0;
                        }

                        .stopBettingContainer {
                            display: none;
                            justify-content: center;
                        }

                        .stopBettingContainer button {
                            background-color: red;
                            color: white;
                            border-radius: 10px;
                            padding: 10px 20px;
                            border: none;
                        }

                        .strikeBtn {
                            float: left;
                            padding: 6px 10px;
                            margin: 3px 2px;
                            background-color: #ffd300;
                            border-radius: 5px;
                        }

                        #streakTableContainer {
                            margin-top: 5px;
                        }

                        #strikeTable {
                            margin-top: 10px;
                            width: 100%;
                            height: 20px;
                        }

                        #strikeTable,
                        #strikeTable th,
                        #strikeTable td {
                            border-collapse: collapse;
                            text-align: center;
                            padding: 3px;
                        }

                        #strikeTable tr:hover {
                            background-color: #efcc8b;
                        }

                        #strikeTable>tbody>tr>td:nth-child(2) {
                            width: 30px;
                        }

                        #filterInput {
                            width: 100%;
                            padding: 5px 10px;
                            border: 1px solid black;
                        }

                        .copy-btn {
                            padding: 2px;
                            cursor: pointer;
                            background-color: #5cba47;
                            color: black;
                            width: 100%;
                            padding: 1px 3px;
                        }

                        #bankCard {
                            background-color: #edcabf;
                            padding: 7px;
                            border-radius: 10px;
                        }

                        #bankCard > div{
                            display: flex;
                            justify-content: space-between;
                        }

                        .sectionHeader {
                            border-bottom: 2px solid gray;
                            margin: 10px 0;
                            padding: 5px;
                        }

                        /* CSS for hover effect on sidebar */
                        .sidebar-button {
                            position: fixed;
                            bottom: 20px;
                            left: 20px;
                            background-color: #fff;
                            border-radius: 50%;
                            box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.3);
                            cursor: pointer;
                        }

                        .hover-circle {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 200px;
                            height: 200px;
                            border-radius: 50%;
                            background-color: rgba(0, 0, 0, 0.1);
                            display: flex;
                            justify-content: space-around;
                            align-items: center;
                            opacity: 0;
                            transition: opacity 0.3s ease-in-out;
                        }

                        .sidebar-button:hover .hover-circle {
                            opacity: 1;
                        }

                        .hover-circle i {
                            color: #fff;
                            font-size: 24px;
                            cursor: pointer;
                        }
                        </style>
                    `;
        document.querySelector("#app").appendChild(liteModal);

        // clock related stuff
        const timeLeft = document.querySelector(".timeLeft");
        setInterval(() => {
            const date = new Date();
            timeLeft.innerHTML = 60 - date.getSeconds();
        }, 1000);

        dragElement(document.getElementById("topContainer"));// making top Container draggable
        getSetUserId(); // setting userId
        checkBalance(false); // checking Balance
        initSnackbar(); // Intializing Snackbar
        getRefreshBtnNo()
        getBonusResponse(); // getting bonus response and updating it in the html

        // modal related stuff
        const modalContainer = document.querySelector(".modalContainer");
        const closeBtn = document.querySelector("#modalCloseBtn");
        const openModalBtn = document.querySelector("#openModalButton .btnIcon");
        openModalBtn.onclick = (e) => modalContainer.style.display = "flex";
        closeBtn.onclick = () => modalContainer.style.display = "none";
        modalContainer.onclick = (event) => (event.target === modalContainer) ? modalContainer.style.display = 'none' : "";

        // navigation buttons related stuff
        const hoverIconsContainer = document.querySelector(".hover-icons-container");
        const openModalBtn2 = document.querySelector("#openModalButton .btnIcon2");
        openModalBtn2.onclick = (e) => hoverIconsContainer.style.display = "flex";
        hoverIconsContainer.onclick = (event) => (event.target === hoverIconsContainer) ? hoverIconsContainer.style.display = 'none' : "";

        // Event Listener for Filtering Table of Strikes
        const filterInput = document.getElementById('filterInput');
        filterInput.addEventListener('keyup', function () {
            const tableBody = document.getElementById('tableData');
            const filterValue = this.value.toLowerCase();
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const strikeCountCell = row.querySelector('td:nth-child(2)');
                const strikeCount = strikeCountCell.textContent.toLowerCase();
                if (strikeCount.includes(filterValue)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });

        // changing refreshNo automatically
        window.navigation.addEventListener("navigate", (event) => {
            const pathname = new URL(event.destination.url).hash;
            if (pathname === "#/home/AllLotteryGames/WinGo?id=1" || pathname.indexOf("#/home/AllLotteryGames/WinGo") === 0) Heister.clickRefreshBtn()
        })
    }

    return {
        init, loadScript, checkNotification, dragElement, hashWithMD5,
        checkBalance, startBetting, stopBetting, findTodayStrikes, getCurrentPeriod,
        request, createTableData, Tt, runAt5thSecond, showSnackbar, displayNextSnackbar,
        openModalTab, reloadModal, getSelfServiceUrl, clickRefreshBtn, getBonusResponse,
        claimStrike, openWebSocketSettingContainer, openMainModal, startBettingOnPairedApps,
        streakDataSortToggle, getRefreshBtnNo, openUrl, getCustomerServiceLink, loginOff,
        isValidTelegramUsername, formatToINR
    };
}));

Heister.init()
