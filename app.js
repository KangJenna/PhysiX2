if('serviceWorker' in navigator) {
                navigator.serviceWorker.register('./sw.js',{scope: '/'})
                .then(function(registration) {
                    console.log('Service Worker registrado ');
                });

                navigator.serviceWorker.ready.then( function(registration) {
                    console.log('Service Worker listo');
                });
            }

if ('Notification' in window && 'serviceWorker' in navigator) {
  Notification.requestPermission(permission => {
    if (permission === 'granted') {
      console.log('Permission to receive notifications granted!');

      new Notification('Bienvenido a PhisiXtheraphy', {
        body: 'App dirigida a estudiantes',
        icon: 'icn/icon01.png'
      });
    } else {
      console.error('Notification permission denied!');
    }
  });
}

