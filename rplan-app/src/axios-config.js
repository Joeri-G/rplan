import axios from "axios";
// import axios and export a configured version
console.log((typeof localStorage.api_key === 'string') ? ('Bearer: ' + localStorage.api_key) : null);
export default axios.create({
  baseURL: 'http://localhost/rplan/html/api/v2',
  responseType: 'json',
  headers: {
    Authorization: (typeof localStorage.api_key === 'string') ? ('Bearer: ' + localStorage.api_key) : null
  }
});
