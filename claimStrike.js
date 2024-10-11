// some important URLs
// https://nngamesservice.in
// https://55clubservice.in
// https://in999service.in
// https://rajalottoservice.in

const express = require("express");
const router = express.Router();

router.use(express.json());

router.post("/claim", async (req, res) => {
    // check for required fields
    if (!req.body.apiUrl || !req.body.uid || !req.body.period || !req.body.template) {
        return res.send({ code: -1, message: "apiUrl, period, uid and template are required" });
    }

    // getting wingo strike activity data from the server
    let activityDataRes = await getStrikeActivityNo(req.body.apiUrl, req.body.template);
    let activityData = activityDataRes.data;

    // check for error
    if(activityDataRes.code === -1) {
        return res.send({ code: -1, message: activityDataRes.message });
    }

    // claiming the bonus
    let data = await claim(req.body.apiUrl, activityData, req.body.uid, req.body.period);

    // send response received from server
    res.send({ ...data });
})

router.post("/claimAll", async (req, res) => {
    // check for required fields
    if (!req.body.apiUrl || !req.body.uid || !req.body.periodList) {
        return res.send({ code: -1, message: "apiUrl, period and uid are required" });
    }

    // getting wingo strike activity data from the server
    let activityDataRes = await getStrikeActivityNo(req.body.apiUrl);
    let activityData = activityDataRes.data;

    // check for error
    if(activityDataRes.code === -1) {
        return res.send({ code: -1, message: activityDataRes.message });
    }

    // sorting the period list
    const periodList = req.body.periodList;
    let newList = periodList.sort((a, b) => b.issueNumber - a.issueNumber);
    console.log(periodList, newList);

    // claiming the bonus
    let responseList = [];
    periodList.forEach(async (period) => {
        let data = await claim(req.body.apiUrl, activityData, req.body.uid, period);
        console.log(data);
        responseList.push(data);
    });

    // send response received from server
    res.send({ responseList });
})

router.post("/data", async (req, res) => {
    // check for required fields
    if (!req.body.apiUrl || !req.body.uid) {
        return res.send({ code: -1, message: "apiUrl and uid are required" });
    }

    // getting wingo strike activity data from the server
    let activityDataRes = await getStrikeActivityNo(req.body.apiUrl);
    let activityData = activityDataRes.data;

    // check for error
    if(activityDataRes.code === -1) {
        return res.send({ code: -1, message: activityDataRes.message });
    }

    // getting bonus data from the server
    let data = await getBonusData(req.body.apiUrl, activityData.activityNo, req.body.uid);

    // check for error
    if(data.code === -1) {
        return res.send({ ...data });
    }

    // checking whether we have data or not
    if(data.result.length === 0) {
        return res.send({ ...data });
    }

    // filter data for today and only send today's data
    let today = new Date().getDate();
    for(const [index, bonusData] of data.result.entries()) {
        let d = new Date(bonusData.submitDate) - (2.5 * 60 * 60 * 1000); // changing UTC +8 to +5:30
        let date = new Date(d).getDate();
        if (date !== today) {
            data.result = data.result.slice(0, index);
            break;
        }
    }
    return res.send({ code: 0, ...data });
})

async function getStrikeActivityNo(apiUrl, template) {
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
                "Referer": `${apiUrl}/wap/index${template}.jsp`,
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": `pageId=1&template=${template}`,
            "method": "POST"
        });
        const validActivities = await validActivitiesRes.json();
        if(validActivities.code === -1) {
            throw new Error(validActivities.message);
        }
        let winstreakActivityIndex = 0;
        validActivities.result.forEach((data, index) => {
            const arr = data.activity.activityName.toLowerCase().split(" ");
            if ((arr.includes("winstreak") || arr.includes("wingo")) && arr.includes("bonus")) {
                winstreakActivityIndex = index;
            }
        });
        return {
            code: 0,
            data: { 
                activityNo: validActivities.result[winstreakActivityIndex].activity.activityNo, activityDataId: validActivities.result[winstreakActivityIndex].activityDatas[0].id 
            }
        };
    } catch (err) {
        return {code: -1, message: err.message};
    }
}

async function claim(apiUrl, activityData, uid, period) {
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
            "body": `pageId=1&activityNo=${activityData.activityNo}&verify=&clientAccount=${uid}&clientPhone=&smsOtpCode=&dFieldsJson=%5B%7B%22activityDataId%22%3A%22${activityData.activityDataId}%22%2C%22value%22%3A%22${period}%22%7D%5D`,
            "method": "POST"
        });
        return await res.json();
    } catch (err) {
        return {code: -1, message: err};
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
        return { code: -1, message: error };
    }
}

module.exports = router;