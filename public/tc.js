(function (factory) {
    var glob;

    try {
        glob = window;
    } catch (e) {
        glob = self;
    }

    glob.tc = { ...glob.tc, ...factory() };
}(function () {
    let glob = {
        keepRunning: false,
        intervalIds: []
    };

    function d() {
        showPageLoading();
        var t = $("#game").val();
        let a = parseInt($("#my_bet_current_page").val());
        makePostRequest("/user/getTodayBets", {
            game: t,
            page: a,
            limit: 10
        }, function(t) {
            if (hidePageLoading(),
            1 === t.code) {
                var e = t.data.page + "/" + t.data.pageCount;
                $("#my_bet_page_num").text(e),
                $("#my_bet_page_count").val(t.data.pageCount),
                1 < a ? $("#my_bet_pre_page").addClass("action") : $("#my_bet_pre_page").removeClass("action"),
                a < t.data.pageCount ? $("#my_bet_next_page").addClass("action") : $("#my_bet_next_page").removeClass("action");
                {
                    e = t.data.list;
                    let a = "";
                    e.forEach( (t, e) => {
                        a += '<div class="reportItem">' + t.html + "</div>"
                    }
                    ),
                    "" === a ? ($("#my_bet_empty").show(),
                    $(".my-bet-content-show").hide(),
                    $("#my_bet_list").empty()) : ($("#my_bet_empty").hide(),
                    $(".my-bet-content-show").show(),
                    $("#my_bet_list").empty(),
                    $("#my_bet_list").append(a))
                }
            } else
                toast(t.msg)
        })
    }

    function h() {
        $("#vngo-bet-div").removeClass("action"),
        $("#vngo-close-bet-div").hide(),
        g()
    }

    function g() {
        $(".vngo-bet-item").removeClass("action"),
        $("#quick_bet_money_1").addClass("action").siblings().removeClass("action"),
        $("#quantityInput").val(1).trigger("input"),
        $("#dec_quantity").removeClass("action"),
        y()
    }

    function y() {
        let a = "";
        $(".vngo-bet-item.action").each(function() {
            var t = $(this).data("item-title")
              , e = $(this).data("cls");
            a += `<span class="${e}"><span class="txt">${t}</span></span>`
        }),
        $("#select_bet_item_list").empty().append(a);
        var t = $(".vngo-bet-item.action").length
          , e = parseInt($(".c-row.amount-box .li.action").children("span").first().text()) * t * $("#quantityInput").val();
        $("#total_bets").text(t),
        $("#total_amount").text(e)
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
            if (glob.keepRunning) {
                await func()
                const intervalId = setInterval(async () => {
                    if (glob.keepRunning) throttle(async () => { await func() }, 60000)();
                    else clearInterval(intervalId);
                }, 60000);
                glob.intervalIds.push(intervalId);
            }
        }, delay);
    }

    glob.betOn = (bs) => {
        let t = $("#game").val()
          , e = $("#current_period").val()
          , a = []
          , i = []
          , o = parseInt($("#betAmount")[0].value)
          , n = 1
          , s = o * n;
        a.push("bs@" + bs + "@2");
        i.push(s);
        showPageLoading();
        console.log(i, o, n, s);

        makePostRequest("/game/bet", {
            game: t,
            period: e,
            items: a,
            money: i
        }, function(t) {
            hidePageLoading(),
            1 === t.code && (h(),
            $("#balance_span").text(t.data.balance_format),
            $("#tab_my_bet").hasClass("action") && 1 === parseInt($("#my_bet_current_page").val())) && d(),
            toast(t.msg)
        });
    }

    glob.startBetting = (type) => {
        // changing start button to stop button
        const startBettingContainer = document.querySelector(".startBettingContainer");
        const stopBettingContainer = document.querySelector(".stopBettingContainer");
        glob.keepRunning = true;
        startBettingContainer.style.display = "none";
        stopBettingContainer.style.display = "flex";

        if (type === "big") {
            runAt5thSecond(5000, () => glob.betOn("big"));
        } else if (type === "small") {
            runAt5thSecond(5000, () => glob.betOn("small"));
        } else {
            glob.stopBetting();
            toast("invalid bet type");
        }

        console.log("started betting", glob.keepRunning);
        // console.log(glob.keepRunning);
    }

    glob.stopBetting = () => {
        const startBettingContainer = document.querySelector(".startBettingContainer");
        const stopBettingContainer = document.querySelector(".stopBettingContainer");
        glob.keepRunning = false;
        glob.intervalIds.forEach(id => clearInterval(id));
        glob.intervalIds = [];
        stopBettingContainer.style.display = "none";
        startBettingContainer.style.display = "flex";
        console.log("stopped betting", glob.keepRunning);
        // console.log(glob.keepRunning);
    }

    glob.init = () => {
        if (window.location.pathname + window.location.search !== "/game?game=vngo1") {
            window.location.href = window.location.origin + "/game?game=vngo1";
        }

        if (!$("#tc101")[0]) {
            let dd = document.createElement("div");
            dd.id = "tc101";
            $("#vngo-bet-div")[0].insertBefore(dd, $("#vngo-bet-div > div:nth-child(2)")[0]);
            $("#vngo-bet-div")[0].style.transform = "translate(-50%, 70%)"; // adjust the position of the div

        }

        // HTML and CSS
        $("#tc101")[0].innerHTML = `
        <!-- betting start and stop related -->
            <div class="startBettingContainer">
                <div class="buttons">
                    <button id="btn_big" onclick="tc.startBetting('big')">Big</button>
                    <input type="tel" id="betAmount" placeholder="Enter Amount" value="100">
                    <button id="btn_small" onclick="tc.startBetting('small')">Small</button>
                </div>
            </div>
            <div class="stopBettingContainer" hidden>
            <button onclick="tc.stopBetting()">Stop Betting</button>
            </div>

            <style>
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

                .buttons button {
                    width: 50%;
                    padding: 10px;
                    color: white;
                    border: none;
                    cursor: pointer;
                    font-size: 15px;
                }

                .buttons input {
                    color: black;
                }

                #btn_big {
                    background-color: #e3af0d;
                    border-radius: 10px 0 0 10px;
                }

                #btn_small {
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
            </style>

            <div class="c-line"></div>
        `;
    }

    return glob;
}));

tc.init();