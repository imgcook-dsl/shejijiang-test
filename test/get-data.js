const urllib = require('urllib');
const url = 'https://imgcook.taobao.org/api-open/code-acquire';
const reqData = {
  mod_id: 10069,
  dsl_id: 1,
  access_id: 'OsyODioQfabXCMZB'
}
urllib.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  data: reqData
}, (err, data, res) => {
  console.log(JSON.parse(data.toString()).data.moduleData.originjson);
  console.log(JSON.parse(data.toString()).data.moduleData.json);
});




