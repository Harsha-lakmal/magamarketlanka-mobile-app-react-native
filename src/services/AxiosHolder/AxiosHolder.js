
//   import axios from 'axios';

// export const instance = axios.create({
//   baseURL: 'http://192.168.6.184:8080/api/v1', 
//   timeout: 1000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });



// import axios from 'axios';

// export const instance = axios.create({
//   baseURL: 'http://192.168.73.184:8080/api/v1', 
//   timeout: 1000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });




import axios from 'axios';

export const instance = axios.create({
  baseURL: 'http://192.168.166.184:8080/api/v1', 
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
});