const _91club = ["91club-2.com", "91club-3.com", "91club-4.com", "91club-5.com"],
_51club = ["55222.in"],
rajawager = ["rajawager.com"],
nngames = ["nngames.com", "nngmas33.com", "nngames33.com"];

const HOSTNAME = window.location.hostname;
const API_URL = window.CONFIG.VITE_API_URL;
let APP_LOGO_URL = "",
BALANCE_URL = "api/webapi/GetBalance",
RefreshBtnNo = 1;

if(nngames.includes(HOSTNAME)) {
    APP_LOGO_URL = 'https://ossimg.nngames-games.com/nngames/other/h5setting_202406071633095vli.png';
} else if (rajawager.includes(HOSTNAME)) {
    APP_LOGO_URL = 'https://ossimg.forpicstore777.top/rajalottery/other/h5setting_202401091624362vtf.png';
} else if (_51club.includes(HOSTNAME)) {
    APP_LOGO_URL = 'https://ossimg.91admin123admin.com/91club/other/h5setting_20230714005938hfia.png';
    RefreshBtnNo = 2;
} else if (_91club.includes(HOSTNAME)) {
    APP_LOGO_URL = 'https://ossimg.91admin123admin.com/91club/other/h5setting_20230714005938hfia.png';
}

// importing spark md5
async function loadScript(src) {
    const script = document.createElement('script'); 
    script.src = src; 
    document.head.appendChild(script);

    return new Promise((resolve, reject) => {
        script.addEventListener('load', resolve);
        script.addEventListener('error', reject);
    });
}

function hashWithMD5(data) {
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

// creating signature from data
async function request(url, method, body) {
    // const random = Tt();
    const data = {
        random: Tt(),
        ...JSON.parse(`${body}`)
    }

    const i = JSON.parse(JSON.stringify(data));
    const d = ["signature", "track", "xosoBettingData"];
    const r = {}
    let l = Object.keys(data);
    l = l.sort();
    l.forEach(m => {
        i[m] !== null && i[m] !== "" && !d.includes(m) && (r[m] = i[m] === 0 ? 0 : i[m])
    })

    const signature = hashWithMD5(JSON.stringify(r));
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

// check for notification permission
if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
} else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
            // const notification = new Notification("Notification Functionality started", {
            //     body: "You can now start betting",
            //     icon: APP_LOGO_URL,
            //     tag: "notification",
            //     renotify: true
            // });
        } else alert("Notification permission is necessary");
    });
}

// ❓❓❓❓❓ main data start from here

// global variables
let keepRunning = true;

loadScript('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.js').then(() => {
    console.log("Script Loaded");
});
const liteModal = document.createElement("div");
liteModal.innerHTML += `
            <div id="topContainer">
                <span id="balanceContainer">
                    <span id="balance"></span>
                    <img src="/assets/png/refireshIcon-2bc1b49f.png" alt="gear icon" width="25" onclick="checkBalance(false)">
                    <span id="timeLeft"></span>
                </span>
            </div>
            <div id="openModalButton">&LeftAngleBracket;</div>

            <div class="modalContainer" hidden>
                <div class="modal" hidden>
                    <div class="close" id="modalCloseBtn">&times;</div>
                    <div class="startBettingContainer">
                        <input type="tel" id="betAmount" placeholder="Enter Amount" value="100">
                        <div class="buttons">
                        <button class="startBettingBig" onclick="startBetting('big')">Big</button>
                        <button class="startBettingSmall" onclick="startBetting('small')">Small</button>
                        </div>
                    </div>
                    <div class="stopBettingContainer" hidden>
                    <button onclick="stopBetting()">Stop Betting</button>
                    </div>
                    <div id="strikes">
                        <button class="strikeBtn" onclick="findTodayStrikes(true, 100)">See Strikes &lt;</button>   
                        <button class="strikeBtn" onclick="findTodayStrikes(false, 100)">See Strikes &gt;</button>   
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

        #timeLeft {
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

        #strikeTable, #strikeTable th, #strikeTable td {
            border: 1px solid black;
            border-collapse: collapse;
            text-align: center;
            padding: 3px;
        }
        
        #strikeTable > tbody > tr > td:nth-child(2) {
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
            width:100%;
            padding: 1px 3px;
        }
    </style>
`;
document.querySelector("#app").appendChild(liteModal)

// clock related stuff
const timeLeft = document.querySelector("#timeLeft");
setInterval(() => {
    const date = new Date();
    timeLeft.innerHTML = 60 - date.getSeconds();
}, 1000);

// movable div
const topContainer = document.querySelector("#topContainer");
const timeLeftArea = document.querySelector("#timeLeft");
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

timeLeftArea.addEventListener('mousedown', (event) => {
    isDragging = true;
    offsetX = event.clientX - topContainer.offsetLeft;
    offsetY = event.clientY - topContainer.offsetTop;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

topContainer.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const newX = event.clientX - offsetX;
        const newY = event.clientY - offsetY;
        topContainer.style.left = `${newX}px`;
        topContainer.style.top = `${newY}px`;
    }
});

// modal related stuff
const modalContainer = document.querySelector(".modalContainer");
const modal = document.querySelector(".modal");
const closeBtn = document.querySelector("#modalCloseBtn");
const openModalBtn = document.querySelector("#openModalButton");
const startBettingContainer = document.querySelector(".startBettingContainer");
const stopBettingContainer = document.querySelector(".stopBettingContainer");
openModalBtn.onclick = () => {
    modalContainer.style.display = "flex";
}
closeBtn.onclick = () => modalContainer.style.display = "none";
modalContainer.onclick = (event) => (event.target === modalContainer) ? modalContainer.style.display = 'none' : "";

// functions
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
    keepRunning = false;
    stopBettingContainer.style.display = "none";
    startBettingContainer.style.display = "flex";
}

async function startBetting(size, amount = document.querySelector("#betAmount").value) {
    keepRunning = true;
    startBettingContainer.style.display = "none";
    stopBettingContainer.style.display = "flex";

    const sizeValues = ["big", "small"];
    if (!size || !sizeValues.includes(size)) return;

    const newAmount = parseInt(amount) || 1;

    checkBalance();
    runAt5thSecond(2000, async (size, amount) => {
        // check for strike count
        const history = await request(`${API_URL}/api/webapi/GetMyEmerdList`, "POST", `
            {
                "pageSize": 20,
                "pageNo": 1,
                "typeId": 1,
                "language": 0
            }
        `);

        const arr = [...history.data.list];
        let strikeCount = 0;
        for(item in arr) {
            if (arr[item].state === 1) strikeCount++
            else if (arr[item].state === 0){
                if (strikeCount >= 5) {
                    new Notification("Strike " + strikeCount, {
                        body: "Stop watching anime. Focus on betting.",
                    })
                }
                break;
            };
        };
        const winningPage = document.querySelector("#app > div.WinGo__C > div.WinningTip__C");
        const refreshBtn = document.querySelector(`#app > div.WinGo__C > div.GameList__C > div.GameList__C-item:nth-child(${RefreshBtnNo})`);
        const historyBtn = document.querySelector("#app > div.WinGo__C > div.RecordNav__C > div:nth-child(3)");
        const gameHistoryBtn = document.querySelector("#app > div.WinGo__C > div.RecordNav__C > div:nth-child(3)");
        
        try {
            winningPage.click();
            refreshBtn.click();
            historyBtn.click();
        } catch (error) { console.warn(error) }
        
        const sizeCode = size === "big" ? 13 : 14;
        const issueNumber = await getCurrentPeriod();
        const res = await request(`${API_URL}/api/webapi/GameBetting`, "POST", `
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
        res.msgCode !== 402 ? new Notification("Unable to bet on " + size, {
            body: res.msgCode + " " + res.msg,
        }) : "";

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
    const res = await request(`${API_URL}/api/webapi/GetGameIssue`, "POST", `{
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
        const res = await request(`${API_URL}/api/webapi/GetMyEmerdList`, "POST", `{
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
                if(isLess){
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

const tableBody = document.getElementById('tableData');
const filterInput = document.getElementById('filterInput');

function createTableData(data) {
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

filterInput.addEventListener('keyup', function () {
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

async function checkBalance(showMessage = true) {
    const balance = await request(`${API_URL}/${BALANCE_URL}`, "POST", `{"language": 0}`)
    if(showMessage){
        balance.data.amount < 200 ? new Notification("Balance is less than 200", {
            body: "Please top up your account./ncurrent balance: " + balance.data.amount,
            icon: APP_LOGO_URL
        }) : "";
        if (balance.data.amount < 100) new Notification("You can't bet further " + balance.data.amount);
    }
    
    const balStr = parseFloat(balance.data.amount).toLocaleString('en-US', { style: 'currency', currency: 'INR' });
    document.getElementById("balance").innerHTML = balStr;
    try {
        document.querySelector("div.Wallet__C-balance-l1 > div").innerText = balStr;
    } catch (error) { }
    return balance.data.amount;
}

setTimeout(async () => {
    checkBalance();
    // console.clear();
})