
import axios from 'axios';

export const instance = axios.create({
  baseURL: 'http://192.168.179.184:8080/api/v1', 
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
});

