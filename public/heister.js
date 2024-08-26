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

    async function runAt5thSecond(runAt, callback, params = []) {
        const func = async () => await callback(...params);
        func()
        const now = new Date();
        const delay = (60 - now.getSeconds()) * 1000 + (1000 - now.getMilliseconds()) + runAt;

        setTimeout(async () => {
            if (keepRunning) {
                await func();
                const intervalId = setInterval(async () => {
                    if (keepRunning) await func();
                    else clearInterval(intervalId);
                }, 60000);
            }
        }, delay);
    }

    function stopBetting() {
        const startBettingContainer = document.querySelector(".startBettingContainer");
        const stopBettingContainer = document.querySelector(".stopBettingContainer");
        keepRunning = false;
        stopBettingContainer.style.display = "none";
        startBettingContainer.style.display = "flex";
    }

    async function startBetting(size, amount = document.querySelector("#betAmount").value) {
        // starting local betting loop
        const sizeValues = ["big", "small"];
        if (!size || !sizeValues.includes(size)) return showSnackbar("select valid size");

        let newAmount;
        try{
            newAmount = parseInt(amount) || 1;
        } catch (e){
            showSnackbar("Please enter a valid amount");
            return;
        }
        
        // changing start button to stop button
        const startBettingContainer = document.querySelector(".startBettingContainer");
        const stopBettingContainer = document.querySelector(".stopBettingContainer");
        keepRunning = true;
        startBettingContainer.style.display = "none";
        stopBettingContainer.style.display = "flex";

        checkBalance();
        runAt5thSecond(5000, async (size, amount) => {
            // get the history of game played
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
                if (currentIssueNumber === item.issueNumber){
                    if(item.state === 1) {
                        if(item.amount >= 100) continue;
                        else {
                            currentPeriodSum += item.amount;
                            if(arr[index+1].issueNumber !== item.issueNumber) {
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
                        if (arr[index+1].issueNumber === item.issueNumber) continue;
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
        let strikesFirstPeriod = [];
        let strikeCount = 0;
        let runLoop = true;
        let i = 1;
        let data = [];

        // getting data from server and storing it in data variable
        const todayDate = new Date().getDate();
        while (runLoop) {
            const res = await request(`${Heister.CONSTANT.API_URL}/api/webapi/GetMyEmerdList`, "POST", `{
                "pageSize": 40,
                "pageNo": ${i++},
                "typeId": 1,
                "language": 0
            }`);

            if (res.data.list.length === 0) break;
            data.push(...res.data.list);
            let item = res.data.list[res.data.list.length - 1];
            const itemDate = new Date(item.addTime).getDate();
            if (itemDate !== todayDate) {
                runLoop = false;
            }
        }

        if(data.length === 0){
            showSnackbar("No Strikes Found");
            return strikesFirstPeriod;
        } 

        // getting strikes out of the data
        let currentIssueNumber = "";
        for (const [index, item] of data.entries()) {
            const itemDate = new Date(item.addTime).getDate();
            if (itemDate !== todayDate) break;
            if (currentIssueNumber === item.issueNumber) strikeCount--;
            else currentIssueNumber = item.issueNumber;

            if (item.state === 1) {
                if (isLess) {
                    if (item.amount >= amount) continue;
                    else strikeCount++;
                } else {
                    if (item.amount < amount) continue;
                    else strikeCount++;
                }
            }
            else if (item.state === 0) {
                strikeCount >= 3 && index - 1 >= 0 && strikesFirstPeriod.push({ issueNumber: data[index - 1].issueNumber, strikeCount });
                strikeCount >= 3 && index - 1 == -1 && strikesFirstPeriod.push({ issueNumber: parseInt(data[index].issueNumber) - 1, strikeCount });
                strikeCount = 0;
            }
        }

        if(strikesFirstPeriod.length > 0) createTableData(strikesFirstPeriod);
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
                updateBankCard();
                getStreakBonusData();
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
        const strikeTableContainer = document.getElementById('strikeTableContainer');
        strikeTableContainer.hidden = false;
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
            claimButton.addEventListener('click', () => {
                claimStrike(item.issueNumber);
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

        checkWager();
        return balance.data.amount;
    }

    async function checkWager() {
        const wager = await request(`${Heister.CONSTANT.API_URL}/api/webapi/getWithdrawals`, "POST", `{
            "withdrawid": 1,
            "language": 0
        }`)

        const wagerElement = document.getElementById("wager");
        wagerElement.innerText = wager.data.withdrawalsrule.amountofCode;
    }

    async function getSelfServiceUrl() {
        const data = await request(`${window.Heister.CONSTANT.API_URL}/api/webapi/GetCustomerServiceList`, "POST", `{
            "typeId": 3,
            "language": 0
        }`);
        return data.data[0].url;
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
                "uid": Heister.CONSTANT.USER_ID
            })
        });

        const data = await res.json();
        if (!data.result) return data;
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
                </div>
            `
        })
        return data;
    }

    async function claimStrike(period) {
        let url = new URL(Heister.APP.SelfServiceUrl);
        url.protocol = "https:";
        const res = await fetch(`${Heister.CONSTANT.MY_API_URL}/strike/claim`, {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "apiUrl": url.origin,
                "uid": Heister.CONSTANT.USER_ID,
                "period": period
            })
        });

        const data = await res.json();
        showSnackbar(data.message);
    }

    async function blastIt() {
        // get audio file from server
        window.Heister.media.blast = [];
        window.Heister.media.blast[0] = new Audio(`${Heister.CONSTANT.MY_API_URL}/blast.mp3`);
        window.Heister.media.blast[1] = new Audio(`${Heister.CONSTANT.MY_API_URL}/blast2.mp3`);

        // getting strikes data from server
        let periodList = await findTodayStrikes(false, 100);
        if (periodList.length == 0) return;
        
        // send claim All server request
        let url = new URL(Heister.APP.SelfServiceUrl);
        url.protocol = "https:";
        const res = await fetch(`${Heister.CONSTANT.MY_API_URL}/strike/claimAll`, {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "apiUrl": url.origin,
                "uid": Heister.CONSTANT.USER_ID,
                "periodList": periodList
            })
        });

        // show snackbar and plays audio on success message
        let playAudio = true;
        const responseList = await res.json();
        responseList.forEach((item) => {
            showSnackbar(item.message);
            if (item.message == "success" && playAudio) {
                const rand = (Math.floor(Math.random() * 2) + 1) - 1;
                window.Heister.media.blast[rand].play();
                playAudio = false;
            }
        })
    }

    function openWebSocketSettingContainer(){
        const modal = document.querySelector(".modal");
        const webSocketContainer = document.getElementById("webSocketContainer");

        modal.style.left = "-100%";
        webSocketContainer.style.left = "0";
    }

    function openMainModal(){
        const modal = document.querySelector(".modal");
        const webSocketContainer = document.getElementById("webSocketContainer")
    
        modal.style.left = "0";
        webSocketContainer.style.left = "100%"
    }

    async function init() {
        window.Heister.media = {};
        window.Heister.CONSTANT = Object.freeze({
            HOSTNAME: window.location.hostname,
            API_URL: window.CONFIG.VITE_API_URL,
            MY_API_URL: "https://betting-api-eosin.vercel.app",
            // MY_API_URL: "http://localhost:1234",
            websites: {
                _91club: ["91club-2.com", "91club-3.com", "91club-4.com", "91club-5.com"],
                _51club: ["55222.in"],
                rajawager: ["rajawager.com"],
                nngames: ["nngames.com", "nngmas33.com", "nngames33.com"],
                in999: ["in999.club"]
            },
            USER_ID: JSON.parse(localStorage.userInfo).userId ? JSON.parse(localStorage.userInfo).userId : 0
        })

        window.Heister.APP = {
            APP_LOGO_URL: "",
            BALANCE_URL: "api/webapi/GetBalance",
            RefreshBtnNo: 2,
            SelfServiceUrl: ""
        }

        // global variables
        window.Heister.keepRunning = true;

        // intialize Heister
        checkNotification();
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.js');
        window.Heister.APP.SelfServiceUrl = await getSelfServiceUrl(); // getting self service URL

        // setting variables
        // setRefreshBtnPosition();
        window.Heister.APP.APP_LOGO_URL = JSON.parse(localStorage.SettingStore).projectLogo;

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
                    <div id="openModalButton">
                        <span class="btnIcon">&LeftAngleBracket;</span>
                        <div class="hover-icons">
                            <span onclick="location.replace('/#/vip')">VIP</span>
                            <span onclick="location.replace('/#/activity/DailySignIn')">A</span>
                            <span onclick="location.replace('/#/activity/DailyTasks')">Ac</span>
                            <span onclick="location.replace('/#/home/AllLotteryGames/WinGo?id=1');setTimeout(()=>{Heister.clickRefreshBtn()},1500)">W</span>
                        </div>
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
                                    <input type="tel" id="betAmount" placeholder="Enter Amount" value="100">
                                    <div class="buttons">
                                        <button class="startBettingBigAll" onclick="Heister.startBettingOnPairedApps()">⚡</button>
                                        <button class="startBettingBig" onclick="Heister.startBetting('big')">Big</button>
                                        <button class="startBettingSmall" onclick="Heister.startBetting('small')">Small</button>
                                        <button class="startBettingSmallAll" onclick="Heister.startBettingOnPairedApps()">⚡</button>
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
                                    <span class="modalTabs" title="BlastIt" onclick="showSnackbar('Coming Soon')">🤯</span>
                                    <!-- <span class="modalTabs" title="BlastIt" onclick="Heister.blastIt()">🤯</span> -->
                                </div>

                                <!-- modal content container 1 -->
                                <div class="modalTabContent" id="modalHome">
                                    <div id="strikeTableContainer" hidden>
                                        <input type="number" id="filterInput" placeholder="Filter by Strike Count">
                                        <br>
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
                                    <div></div>
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
                            background-color: rgba(255, 0, 0, 0.342);
                            color: white;
                            padding: 5px;
                            border-radius: 10px 0 0 10px;
                            cursor: pointer;
                            z-index: 9998;
                            font-size: xx-large;
                        }

                        #openModalButton:hover {
                            background-color: rgb(255, 0, 0);
                        }

                        #openModalButton:hover .hover-icons {
                            display: flex;
                        }

                        .hover-icons {
                            position: absolute;
                            top: 50%;
                            left: 100%;
                            width: 100px;
                            height: 100px;
                            transform: translate(-100%, -50%);
                            display: none;
                            z-index: -10;
                            border-radius: 100% 0% 0% 100%;
                        }

                        .hover-icons > span {
                            width: 50px;
                            height: 50px;
                            font-size: 20px;
                            position: absolute;
                            left: 25%;
                            top: 50%;
                            transform: translate(-50%, -50%) rotate(calc(var(--index) * 360deg / 6));
                            text-align: left;
                            transform-origin: 90px center;
                            background-color: darkseagreen;
                            border-radius: 100%;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        }

                        .hover-icons span:nth-child(1) { --index: -1.2; }
                        .hover-icons span:nth-child(2) { --index: -0.4; }
                        .hover-icons span:nth-child(3) { --index: 0.4; }
                        .hover-icons span:nth-child(4) { --index: 1.2; }

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

                        .modalContainer {
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
                            width: 100%;
                            padding: 5px 10px;
                            border-radius: 10px;
                            border: 1px solid black;
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

                        .startBettingBigAll {
                            background-color: #e3af0d;
                            border-radius: 10px 0 0 10px;
                        }

                        .startBettingSmallAll {
                            background-color: #359220;
                            border-radius: 0 10px 10px 0;
                        }

                        .startBettingBig {
                            background-color: #ffc511;
                        }

                        .startBettingSmall {
                            background-color: #5cba47;
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
                            margin-top: 10px;
                            width: 100%;
                            padding: 5px 10px;
                            border-radius: 10px;
                            border: 1px solid black;
                        }

                        .copy-btn {
                            padding: 2px;
                            cursor: pointer;
                            background-color: #5cba47;
                            color: black;
                            border-radius: 10px;
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
        // getStreakBonusData(); // getting steak bonus data and updating it in the html
        getBonusResponse(); // getting bonus response and updating it in the html

        // modal related stuff
        const modalContainer = document.querySelector(".modalContainer");
        const modal = document.querySelector(".modal");
        const closeBtn = document.querySelector("#modalCloseBtn");
        const openModalBtn = document.querySelector("#openModalButton");
        openModalBtn.onclick = (e) => {
            if (e.target !== openModalBtn.querySelector(".btnIcon")) return;
            modalContainer.style.display = "flex";
        }
        closeBtn.onclick = () => modalContainer.style.display = "none";
        modalContainer.onclick = (event) => (event.target === modalContainer) ? modalContainer.style.display = 'none' : "";

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
    }

    return {
        init, loadScript, checkNotification, dragElement, hashWithMD5,
        checkBalance, startBetting, stopBetting, findTodayStrikes, getCurrentPeriod,
        request, createTableData, Tt, runAt5thSecond, showSnackbar, displayNextSnackbar,
        openModalTab, reloadModal, getSelfServiceUrl, clickRefreshBtn, getBonusResponse,
        claimStrike, blastIt, openWebSocketSettingContainer, openMainModal, startBettingOnPairedApps
    };
}));

Heister.init()