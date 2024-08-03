const urlBase64ToUint8Array = base64String => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

const saveSubscription = async (subscription) => {
    const response = await fetch('http://localhost:9001/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-type': "application/json" },
        body: JSON.stringify(subscription)
    })

    return response.json()
}

const sendNotification = async (data) => {
    const response = await fetch('http://localhost:9001/api/send-notification', {
        method: 'POST',
        headers: { 'Content-type': "application/json" },
        body: JSON.stringify(data)
    })

    return response.json()
}

self.addEventListener("activate", async (e) => {
    const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array("BEUHB1ebqAkHNLf6aXXXi-Q2rnOChY1zsty4a9C07RvmRpNPjp18Uk7nt-o-8ET7JXoRKJxQ6pP00KM9_rammlo")
    });

    await saveSubscription(subscription);
})

self.addEventListener("push", (e) => {
    const data = JSON.parse(e.data.text());
    self.registration.showNotification(`(${data.website}) ${data.title}`, { body: data.body, tag: data.tag, icon: data.icon });
})

self.addEventListener("message", async (e) => {
    if (e.data.type === "activate") {
        const subscription = await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array("BEUHB1ebqAkHNLf6aXXXi-Q2rnOChY1zsty4a9C07RvmRpNPjp18Uk7nt-o-8ET7JXoRKJxQ6pP00KM9_rammlo")
        });
    
        await saveSubscription(subscription);
    }
})