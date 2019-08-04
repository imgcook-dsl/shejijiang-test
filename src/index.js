function casHandler(str, value) {
  var casArr = str.split('.');
  var casObj = {};

  if (casArr.length == 0) {
    casObj[str] = value;
  }

  casArr.reverse().forEach(function(cas) {
    if (cas.indexOf('[') == -1) {
      casObj[cas] = value;
    } else {
      var newCasObj = {};
      var key = cas.split('[')[0];
      newCasObj[key] = [casObj];
      casObj = newCasObj;
    }
  });
  return casObj;
}

module.exports = function(layoutData, options) {
  const renderData = {};
  const prettier = options.prettier;
  const _ = options._;
  const raxImport = {};
  const style = {};
  let mock = {};

  function json2jsx(json) {
    var result = '';

    if (!!json.length && typeof json != 'string') {
      json.forEach(function(node) {
        result += json2jsx(node);
      });
    } else if (typeof json == 'object') {
      var type = json.componentType;
      var className = json.attrs.className;

      switch (type) {
        case 'text':
          var lines = json.style.lines;
          var innerText;

          if (json.tpl) {
            innerText = `{dataSource.${json.tpl}}`;
            mock = _.merge(mock, casHandler(json.tpl, json.innerText));
          } else {
            innerText = json.innerText;
          }

          result += `<Text className='${className}' >${innerText}</Text>`;

          if (!raxImport[type]) {
            raxImport[type] = `import { Text } from '@tarojs/components';`;
          }

          if (json.style.lines == 1) {
            delete json.style.width;
            delete json.style.height;
          }

          delete json.style.fontFamily;
          delete json.style.lines;
          break;
        case 'view':
          if (json.children && json.children.length > 0) {
            result += `<View className='${className}'>${json2jsx(
              json.children
            )}</View>`;
          } else {
            result += `<View className='${className}'/>`;
          }
          if (!raxImport[type]) {
            raxImport[type] = `import { View } from '@tarojs/components';`;
          }
          break;
        case 'picture':
          var source;

          if (json.tpl) {
            source = `dataSource.${json.tpl}`;
            mock = _.merge(mock, casHandler(json.tpl, json.attrs.src));
          } else {
            source = `'${json.attrs.src}'`;
          }
          result += `<Image className='${className}' src='${source}' />`;

          if (!raxImport[type]) {
            raxImport[type] = `import { Image } from '@tarojs/components';`;
          }
          break;
      }

      // 构建样式数组
      style[className] = json.style;
    } else {
      return json
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    return result;
  }

  // transform json
  var jsx = `${json2jsx(layoutData)}`;
  var dataBinding =
    Object.keys(mock).length > 0
      ? 'var dataSource = this.props.dataSource;'
      : '';

  renderData.modClass = `
    class Mod extends Component {
      render() {
        ${dataBinding}
        return (
          ${jsx}
        );
      }
    }
  `;

  renderData.import = Object.keys(raxImport)
    .map(key => {
      return raxImport[key];
    })
    .join('\n');
  renderData.mockData = `var mock = ${JSON.stringify(mock)}`;
  renderData.export = `render(<Mod dataSource={mock} />);`;

  // renderData.style = `var styles = ${JSON.stringify(style)}`;
  let stylesStr = '';
  for (let styleName in style) {
    let styleStr = '';
    for (let className in style[styleName]) {
      const classNameLow = camelTranslate(className);
      const classValue = valueTranslate(classNameLow, style[styleName][className]);
      let classStr = `${classNameLow}: ${classValue};`;
      styleStr = `${styleStr}${classStr}`;
    }
    styleStr = `.${styleName} {${styleStr}}`;
    stylesStr = `${stylesStr}\n${styleStr}`;
  }
  renderData.style = stylesStr;

  const prettierOpt = {
    printWidth: 120,
    singleQuote: true
  };

  return {
    renderData: renderData,
    xml: prettier.format(jsx, prettierOpt),
    style: renderData.style,
    // style: prettier.format(renderData.style, prettierOpt),
    prettierOpt: prettierOpt
  };
};

function camelTranslate(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function valueTranslate(classNameLow, classValue) {
  switch (classNameLow) {
    case 'font-size':
    case 'margin-left':
    case 'margin-top':
    case 'margin-right':
    case 'margin-bottom':
    case 'padding-left':
    case 'padding-top':
    case 'padding-right':
    case 'padding-bottom':
    case 'width':
    case 'height':
    case 'border-radius':
    case 'top':
    case 'left':
    case 'right':
    case 'bottom':
    case 'line-height':
    case 'max-width':
    case 'border-width':
    case 'border-top-width':
    case 'border-right-width':
    case 'border-bottom-width':
    case 'border-left-width':
    case 'border-bottom-right-radius':
    case 'border-bottom-left-radius':
    case 'border-top-right-radius':
    case 'border-top-left-radius':
      if (typeof classValue == 'number') {
        classValue = classValue + 'px';
      } else if (typeof classValue == 'string') {
        classValue = classValue.replace(/(px)|(rem)/, '');
        classValue = classValue + 'px';
      }
      break;
    case 'color':
    case 'background-color':
      let rgb = classValue.match(
        /^rgb[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
      );
      let rgba = /^rgba\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(.+))?\)$/.exec(
        classValue
      );
      if (rgb && rgb.length === 4) {
        classValue =
          '#' +
          ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2);
      }
      if (rgba && rgba[4]) {
        if (Number(rgba[4]) === 1) {
          classValue =
            '#' +
            ('0' + parseInt(rgba[1], 10).toString(16)).slice(-2) +
            ('0' + parseInt(rgba[2], 10).toString(16)).slice(-2) +
            ('0' + parseInt(rgba[3], 10).toString(16)).slice(-2);
        } else {
          classValue =
            'rgba(' +
            rgba[1] +
            ',' +
            rgba[2] +
            ',' +
            rgba[3] +
            ',' +
            Number(rgba[4]).toFixed(2) +
            ')';
        }
      }
      break;
    default:
      break;
  }
  return classValue;
}
