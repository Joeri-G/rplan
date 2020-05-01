import axios from "axios";
// import axios and export a configured version
export default axios.create({
  baseURL: `${process.env.PUBLIC_URL}/api/v2`,
  responseType: 'json',
  headers: {
    Authorization: (typeof localStorage.api_key === 'string') ? ('Bearer ' + localStorage.api_key) : null
  }
});
