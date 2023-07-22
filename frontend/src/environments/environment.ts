// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  openvidu_url: '',
  openvidu_secret: '',
  NODE_BASE_URL: 'http://localhost:5000',
    interval:2000,
  keepAliveInterval:60000,
  //NODE_BASE_URL: 'https://eb-vc-dev.trilloapps.com',
   firebaseConfig : {
    apiKey: "AIzaSyAjLayeeFhbyMbySCxb4XWmQwHdR3vekws",
    authDomain: "energibizz.firebaseapp.com",
    projectId: "energibizz",
    storageBucket: "energibizz.appspot.com",
    messagingSenderId: "250460958134",
    appId: "1:250460958134:web:b6842450d909002ccc2517",
    measurementId: "G-KNEWJ3KZLS"
  }
  
};
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
