import {Actions} from './action';
const initState = {
  requests: [],
  showType: 'All',
  fileFilterKey: '',
  resource: []
};
const files = [
  'css', 'file', 'html', 'javascript',
  'jpg', 'png', 'pdf', 'json', 'svg', 'gif', 'ico',
  'txt', 'xml', 'zip'
];

const filterType = {
  'All': [
    'css', 'file', 'html', 'javascript',
    'jpg', 'png', 'pdf', 'json', 'svg', 'gif', 'ico',
    'txt', 'xml', 'zip', 'text',
    'ssl-error'
  ],
  'JS': ['javascript'],
  'CSS': ['css'],
  'XHR': ['json'],
  'Img': ['jpg', 'png', 'gif', 'svg', 'ico'],
  'Other': ['txt', 'xml', 'zip', 'pdf']
};

function HomeReducer (state = initState, action) {
  switch (action.type) {
    case Actions.ON_ARRIVE:
      action.data.fileType = getFileType(action.data);
      let needPush = filterType[state.showType].includes(action.data.fileType); // 过滤文件类型
      if (needPush && action.data.url.path.includes(state.fileFilterKey)) { // 过滤关键字
        return Object.assign({}, state, {
          requests: state.requests.concat([action.data]).slice(-200),
          resource: state.resource.concat([action.data]).slice(-200)
        });
      } else {
        return Object.assign({}, state, {
          resource: state.resource.concat([action.data]).slice(-200)
        });
      }

    case Actions.CLEAR:
      return initState;

    case Actions.SEARCH:
      let target = state.resource.filter(req => req.url.path.includes(action.keys));
      let result = target.filter(item => filterType[state.showType].includes(item.fileType));

      return Object.assign({}, state, {
        requests: result,
        fileFilterKey: action.keys
      });

    case Actions.FILTER:
      let requests = state.resource.filter(item => filterType[action.data].includes(item.fileType));
      return Object.assign({}, state, {showType: action.data}, {requests});

    default:
      return state;
  }
}

function getFileType (t) {
  let {resHeaders = {}} = t;
  let contentType = resHeaders['content-type'] || '';
  let fileType = contentType.split(';')[0].split('/')[1] || '';
  if (t.type === 'connect') {
    return 'ssl-error';
  }

  fileType = fileType.trim();

  if (fileType.indexOf('+')) {
    fileType = fileType.split('+')[0];
  }

  if (fileType === 'jpeg') {
    fileType = 'jpg';
  } else if (fileType === 'x-javascript') {
    fileType = 'javascript';
  } else if (fileType === 'x-ico' || fileType === 'x-icon') {
    fileType = 'ico';
  }

  if (files.indexOf(fileType) === -1) {
    fileType = 'text';
  }

  return fileType;
}

export default HomeReducer;
