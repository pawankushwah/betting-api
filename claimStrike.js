const express = require("express");
const router = express.Router();

router.use(express.json());

router.post("/claim", async (req, res) => {
    if (!req.body.apiUrl || !req.body.uid) {
        return res.send({ message: "apiUrl, period and uid are required", result: [] });
    }
    let activityNo = await getStrikeActivityNo(req.body.apiUrl);
    console.log(req.body.apiUrl, activityNo);
    let data = await claim(req.body.apiUrl, activityNo, req.body.uid, req.body.period);
    res.send({ ...data });
})

router.post("/data", async (req, res) => {
    if (!req.body.apiUrl || !req.body.uid) {
        return res.send({ message: "apiUrl and uid are required", result: [] });
    }
    let activityNo = await getStrikeActivityNo(req.body.apiUrl);
    let data = await getBonusData(req.body.apiUrl, activityNo, req.body.uid);
    let today = new Date().getDate();
    if(data.result.length === 0) {
        return res.send({ ...data });
    }
    for(const [index, bonusData] of data.result.entries()) {
        let d = new Date(bonusData.submitDate) - (2.5 * 60 * 60 * 1000);
        let date = new Date(d).getDate();
        if (date !== today) {
            data.result = data.result.slice(0, index);
            break;
        }
    }
    res.send({ ...data });
})

async function getStrikeActivityNo(apiUrl) {
    // getting winstreak activity No. from the server
    try {
        const validActivitiesRes = await fetch(`${apiUrl}/activityApi/getValidActivities.zv`, {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-US,en;q=0.9,en-IN;q=0.8",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Microsoft Edge\";v=\"127\", \"Chromium\";v=\"127\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "Referer": `${apiUrl}/wap/indexE.jsp`,
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": "pageId=1&template=E",
            "method": "POST"
        });
        const validActivities = await validActivitiesRes.json();
        let winstreakActivityIndex = 0;
        validActivities.result.forEach((data, index) => {
            const arr = data.activity.activityName.toLowerCase().split(" ");
            if (arr.includes("winstreak") || arr.includes("bonus") || arr.includes("wingo")) {
                winstreakActivityIndex = index;
            }
        });
        return validActivities.result[winstreakActivityIndex].activity.activityNo;
    } catch (err) {
        return err;
    }
}

async function claim(apiUrl, activityNo, uid, period) {
    try {
        let res = await fetch(`${apiUrl}/activityApi/sendApply.zv`, {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-US,en;q=0.9,en-IN;q=0.8",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Microsoft Edge\";v=\"127\", \"Chromium\";v=\"127\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "Referer": `${apiUrl}/wap/indexE.jsp`,
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": `pageId=1&activityNo=${activityNo}&verify=&clientAccount=${uid}&clientPhone=&smsOtpCode=&dFieldsJson=%5B%7B%22activityDataId%22%3A%2227%22%2C%22value%22%3A%22${period}%22%7D%5D`,
            "method": "POST"
        });
        return await res.json();
    } catch (err) {
        return err;
    }
}

async function getBonusData(apiUrl, activityNo, uid) {
    // getting winstreak activity No. from the server
    try {
        let res = await fetch(`${apiUrl}/activityApi/queryApply.zv`, {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-US,en;q=0.9,en-IN;q=0.8",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Microsoft Edge\";v=\"127\", \"Chromium\";v=\"127\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest"
            },
            "referrer": `${apiUrl}/wap/indexE.jsp`,
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": `pageId=1&activityNo=${activityNo}&verify=&clientAccount=${uid}`,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
        return await res.json();
    } catch (error) {
        return error;
    }
}

module.exports = router;