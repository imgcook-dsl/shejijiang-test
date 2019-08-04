const co = require('co');
const xtpl = require('xtpl');
const fs = require('fs');
const thunkify = require('thunkify');
const path = require('path');
const prettier = require('prettier');
const { NodeVM } = require('vm2');
const _ = require('lodash');
// const data = require('./data');
// const originData = require('./origin-data');
const parser = require('../src/index');
const getData = require('../test/get-data');

const vm = new NodeVM({
  console: 'inherit',
  sandbox: {}
});

co(function*() {
  const xtplRender = thunkify(xtpl.render);
  // const code = fs.readFileSync(
  //   path.resolve(__dirname, '../src/index.js'),
  //   'utf8'
  // );
  // const renderInfo = vm.run(code)(data, {
  //   prettier: prettier,
  //   _: _,
  //   originData: originData
  // });

  const { data } = yield getData();

  const renderInfo = parser(data, {
    prettier: prettier,
    _: _,
  });
  const renderData = renderInfo.renderData;

  console.log(renderData.import);
  console.log(renderData.modClass);
  console.log(renderData.style);


  // const ret = yield xtplRender(
  //   path.resolve(__dirname, '../src/template.xtpl'),
  //   renderData,
  //   {}
  // );

  // console.log(ret);
  // console.log(
  //   prettier.format(ret, {
  //     printWidth: 120
  //   })
  // );
});
