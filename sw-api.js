const express = require("express");
const router = express.Router();

const webpush = require("web-push");

const apiKeys = {
    public: "BEUHB1ebqAkHNLf6aXXXi-Q2rnOChY1zsty4a9C07RvmRpNPjp18Uk7nt-o-8ET7JXoRKJxQ6pP00KM9_rammlo",
    private: "_74K4YDO8adRgfEQDvUqWp0VVFm3c9-7dwWu46cMJFA"
}
webpush.setVapidDetails(
    "mailto:pawangame.com@gmail.com",
    apiKeys.public,
    apiKeys.private
)

router.use(express.json());

const subDatabase = [];

router.get("/", (req, res) => {
    res.send({status: "success", message: "helo world!!"});
})

router.post("/save-subscription", (req, res) => {
    subDatabase.push(req.body);
    console.log(subDatabase);
    res.send({ success: true, message: "Subsription Saved" });
})

router.post("/send-notification", (req, res) => {
    let data;
    console.log(req.body);
    try {
        data = JSON.parse(JSON.stringify(req.body));
    } catch(e) {
        res.send({status: "error", message: "data not valid"});
        return;
    }
    webpush.sendNotification(subDatabase[0], JSON.stringify({title: data.title, body: data.body, tag: data.tag, icon: data.icon, website: data.website}));
    res.send({status: "success", message: "message send to push service"});
})

router.post("/apply-strike", (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    res.send({status: "success", message: "strike applied", data: data});
})

module.exports = router;