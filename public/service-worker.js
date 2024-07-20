self.addEventListener('message', function(event) {
    const data = event.data;
    if (data && data.action === 'showNotification') {
      const options = {
        body: data.body,
        icon: data.icon,
        tag: data.tag
      };
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    }
  });