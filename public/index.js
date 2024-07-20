(function (factory) {
    var glob;

    try {
        glob = window;
    } catch (e) {
        glob = self;
    }

    glob.Heister = { ...factory(), ...glob.Heister };
}(function () {

    var Heister = {};

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

    function initServiceWorker(filename) {
        navigator.serviceWorker.register(filename)
            .then(function (registration) {
                console.log('Service worker registration successful:', registration);
            })
            .catch(function (err) {
                console.warn('Service worker registration failed:', err);
                alert("Unable to start Notification in this browser", err);
            });
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
            throw new Error(e);
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
            throw new Error("hashWithMD5 error: " + e);
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
        const startBettingContainer = document.querySelector(".startBettingContainer");
        const stopBettingContainer = document.querySelector(".stopBettingContainer");
        keepRunning = true;
        startBettingContainer.style.display = "none";
        stopBettingContainer.style.display = "flex";

        const sizeValues = ["big", "small"];
        if (!size || !sizeValues.includes(size)) return;

        const newAmount = parseInt(amount) || 1;

        checkBalance();
        runAt5thSecond(2000, async (size, amount) => {
            // check for strike count
            const history = await request(`${Heister.CONSTANT.API_URL}/api/webapi/GetMyEmerdList`, "POST", `
                {
                    "pageSize": 20,
                    "pageNo": 1,
                    "typeId": 1,
                    "language": 0
                }
            `);

            const arr = [...history.data.list];
            let strikeCount = 0;
            for (item in arr) {
                if (arr[item].state === 1) strikeCount++
                else if (arr[item].state === 0) {
                    if (strikeCount >= 5) {
                        showNotification(`Strike ${strikeCount}`, `Stop watching anime. Focus on betting`, 'STRIKE')
                    }
                    break;
                };
            };
            const winningPage = document.querySelector("#app > div.WinGo__C > div.WinningTip__C");
            const refreshBtn = document.querySelector(`#app > div.WinGo__C > div.GameList__C > div.GameList__C-item:nth-child(${Heister.APP.RefreshBtnNo})`);
            const historyBtn = document.querySelector("#app > div.WinGo__C > div.RecordNav__C > div:nth-child(3)");
            const gameHistoryBtn = document.querySelector("#app > div.WinGo__C > div.RecordNav__C > div:nth-child(3)");

            try {
                winningPage.click();
                refreshBtn.click();
                historyBtn.click();
            } catch (error) { console.warn(error) }

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

            try {
                refreshBtn.click();
                gameHistoryBtn.click();
                historyBtn.click();
                refreshBtn.click();
            } catch (error) { console.warn(error) }

            checkBalance();
        }, [size, newAmount]);
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
        while (runLoop) {
            console.log(i)
            const res = await request(`${Heister.CONSTANT.API_URL}/api/webapi/GetMyEmerdList`, "POST", `{
                "pageSize": 20,
                "pageNo": ${i++},
                "typeId": 1,
                "language": 0
            }`);

            if (res.data.list.length === 0) break;
            const resDataArr = [...(res.data.list)];
            const todayDate = new Date().getDate();
            resDataArr.forEach((item, index) => {
                const itemDate = new Date(item.addTime).getDate();
                if (itemDate !== todayDate) {
                    runLoop = false;
                    return;
                }

                if (item.state === 1) {
                    if (isLess) {
                        if (item.amount >= amount) return;
                        else strikeCount++;
                    } else {
                        if (item.amount < amount) return;
                        else strikeCount++;
                    }
                }
                else if (item.state === 0) {
                    strikeCount >= 3 && index - 1 >= 0 && strikesFirstPeriod.push({ issueNumber: resDataArr[index - 1].issueNumber, strikeCount });
                    strikeCount >= 3 && index - 1 == -1 && strikesFirstPeriod.push({ issueNumber: parseInt(resDataArr[index].issueNumber) - 1, strikeCount });
                    strikeCount = 0;
                };
            });
        }

        createTableData(strikesFirstPeriod);
        return strikesFirstPeriod;
    }

    function createTableData(data) {
        const tableBody = document.getElementById('tableData');
        tableBody.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');
            const periodCell = document.createElement('td');
            periodCell.textContent = item.issueNumber;
            row.appendChild(periodCell);

            const strikeCountCell = document.createElement('td');
            strikeCountCell.textContent = item.strikeCount;
            row.appendChild(strikeCountCell);

            const copyButton = document.createElement('button');
            copyButton.textContent = "Copy";
            copyButton.classList.add('copy-btn');
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(item.issueNumber);
                console.log("Period copied to clipboard!");
            });
            const copyCell = document.createElement('td');
            copyCell.appendChild(copyButton);
            row.appendChild(copyCell);

            tableBody.appendChild(row);
        });
    }

    function showNotification(title, body = "", tag) {
        const icon = Heister.APP.APP_LOGO_URL;
        navigator.serviceWorker.controller.state
        try {
            if ('Notification' in window) {
                new Notification(title, {
                    body, icon, tag
                });
            } else {
                const message = {
                    action: 'showNotification',
                    title, body, icon, tag
                };
                if(navigator.serviceWorker.controller.state === 'activated') {
                    navigator.serviceWorker.controller.postMessage(message);
                } else {
                    alert("Unable to start Notification in this browser");
                }
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
        return balance.data.amount;
    }

    async function init() {
        Heister.CONSTANT = Object.freeze({
            HOSTNAME: window.location.hostname,
            API_URL: window.CONFIG.VITE_API_URL,
            websites: {
                _91club: ["91club-2.com", "91club-3.com", "91club-4.com", "91club-5.com"],
                _51club: ["55222.in"],
                rajawager: ["rajawager.com"],
                nngames: ["nngames.com", "nngmas33.com", "nngames33.com"],
                in999: ["in999.club"]
            }
        })

        Heister.APP = {
            APP_LOGO_URL: "",
            BALANCE_URL: "api/webapi/GetBalance",
            RefreshBtnNo: 1
        }

        const web = Heister.CONSTANT.websites;
        if (web.nngames.includes(Heister.CONSTANT.HOSTNAME)) {
            Heister.APP.APP_LOGO_URL = 'https://ossimg.nngames-games.com/nngames/other/h5setting_202406071633095vli.png';
        } else if (web.rajawager.includes(Heister.CONSTANT.HOSTNAME)) {
            Heister.APP.APP_LOGO_URL = 'https://ossimg.forpicstore777.top/rajalottery/other/h5setting_202401091624362vtf.png';
        } else if (web._51club.includes(Heister.CONSTANT.HOSTNAME)) {
            Heister.APP.APP_LOGO_URL = 'https://ossimg.91admin123admin.com/91club/other/h5setting_20230714005938hfia.png';
            Heister.APP.RefreshBtnNo = 2;
        } else if (web.in999.includes(Heister.CONSTANT.HOSTNAME)) {
            Heister.APP.APP_LOGO_URL = 'https://ossimg.91admin123admin.com/91club/other/h5setting_20230714005938hfia.png';
            Heister.APP.RefreshBtnNo = 2;
        } else if (web._91club.includes(Heister.CONSTANT.HOSTNAME)) {
            Heister.APP.APP_LOGO_URL = 'https://ossimg.91admin123admin.com/91club/other/h5setting_20230714005938hfia.png';
        }

        // global variables
        Heister.keepRunning = true;

        // intialize Heister
        checkNotification();
        initServiceWorker('service-worker.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.js');

        const liteModal = document.createElement("div");
        liteModal.innerHTML += `
                    <div id="topContainer" class="draggable">
                        <span id="balanceContainer">
                            <span id="balance"></span>
                            <img src="/assets/png/refireshIcon-2bc1b49f.png" alt="gear icon" width="25" onclick="Heister.checkBalance(false)">
                            <span class="timeLeft" id="topContainerheader"></span>
                        </span>
                    </div>
                    <div id="openModalButton">&LeftAngleBracket;</div>

                    <div class="modalContainer" hidden>
                        <div class="modal" hidden>
                            <div class="close" id="modalCloseBtn">&times;</div>
                            <div class="startBettingContainer">
                                <input type="tel" id="betAmount" placeholder="Enter Amount" value="100">
                                <div class="buttons">
                                <button class="startBettingBig" onclick="Heister.startBetting('big')">Big</button>
                                <button class="startBettingSmall" onclick="Heister.startBetting('small')">Small</button>
                                </div>
                            </div>
                            <div class="stopBettingContainer" hidden>
                            <button onclick="Heister.stopBetting()">Stop Betting</button>
                            </div>
                            <div id="strikes">
                                <!-- <button class="strikeBtn" onclick="Heister.findTodayStrikes(true, 100)">See Strikes &lt;</button>    -->
                                <button class="strikeBtn" onclick="Heister.findTodayStrikes(false, 100)">See Strikes &gt;</button>   
                                <input type="text" id="filterInput" placeholder="Filter by Strike Count">
                                <br>
                                <table id="strikeTable">
                                    <thead>
                                        <tr>
                                            <th>Period</th>
                                            <th>Strike Count</th>
                                            <th>Copy</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tableData"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <style>
                        * {
                            box-sizing: border-box;
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
                            gap: 25px;
                            background-color: white;
                            color: black;
                            padding-left: 20px;
                            border-radius: 10px;
                            min-height: .58667rem;
                            line-height: .58667rem;
                            text-align: center;
                            font-weight: 700;
                            font-size: .48rem;
                            overflow: hidden;
                        }

                        .timeLeft {
                            padding: 5px;
                            margin-left: 20px;
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

                        .modal {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            padding: 50px 10px 50px 10px;
                            width: 250px;
                            height: 400px;
                            background-color: whitesmoke;
                            display: flex;
                            flex-direction: column;
                            border-radius: 10px;
                            transform: translate3d(-50%, -50%, 0);
                            font-family: sans-serif;
                            overflow: auto;
                            scrollbar-width: none;
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

                        .startBettingContainer input {
                            width: 100%;
                            padding: 10px;
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
                        }

                        .startBettingBig {
                            background-color: #ffc511;
                            border-radius: 10px 0 0 10px;
                        }

                        .startBettingSmall {
                            background-color: #5cba47;
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
                            margin-top: 10px;
                            background-color: moccasin;
                            border-radius: 10px;
                            padding: 5px 10px;
                        }

                        #strikeTable {
                            margin-top: 10px;
                            width: 100%;
                            height: 20px;
                        }

                        #strikeTable,
                        #strikeTable th,
                        #strikeTable td {
                            border: 1px solid black;
                            border-collapse: collapse;
                            text-align: center;
                            padding: 3px;
                        }

                        #strikeTable>tbody>tr>td:nth-child(2) {
                            width: 30px;
                        }

                        #filterInput {
                            margin-top: 10px;
                            width: 100%;
                            padding: 10px;
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
                        </style>
                    `;
        document.querySelector("#app").appendChild(liteModal);

        // clock related stuff
        const timeLeft = document.querySelector(".timeLeft");
        setInterval(() => {
            const date = new Date();
            timeLeft.innerHTML = 60 - date.getSeconds();
        }, 1000);

        // making top Container draggable
        dragElement(document.getElementById("topContainer"));

        // checking Balance
        checkBalance(false);

        // modal related stuff
        const modalContainer = document.querySelector(".modalContainer");
        const modal = document.querySelector(".modal");
        const closeBtn = document.querySelector("#modalCloseBtn");
        const openModalBtn = document.querySelector("#openModalButton");
        openModalBtn.onclick = () => {
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
        request, createTableData, Tt, runAt5thSecond
    };
}));

Heister.init()

// movable div
// const topContainer = document.querySelector("#topContainer");
// const timeLeftArea = document.querySelector("#timeLeft");
// let isDragging = false;
// let offsetX = 0;
// let offsetY = 0;

// timeLeftArea.addEventListener('mousedown', (event) => {
//     isDragging = true;
//     offsetX = event.clientX - topContainer.offsetLeft;
//     offsetY = event.clientY - topContainer.offsetTop;
// });

// document.addEventListener('mouseup', () => {
//     isDragging = false;
// });

// topContainer.addEventListener('mousemove', (event) => {
//     if (isDragging) {
//         const newX = event.clientX - offsetX;
//         const newY = event.clientY - offsetY;
//         topContainer.style.left = `${newX}px`;
//         topContainer.style.top = `${newY}px`;
//     }
// });