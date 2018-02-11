export const Actions = {
  'ON_ARRIVE': 'ON_ARRIVE',
  'CLEAR': 'CLEAR',
  'FILTER': 'FILTER',
  'SEARCH': 'SEARCH'
};

export function onArrive (request) {
  return function (dispatch) {
    dispatch({
      type: Actions.ON_ARRIVE,
      data: request
    });
  };
}

export function clearAll () {
  return dispatch => {
    dispatch({
      type: Actions.CLEAR
    });
  };
}

export function filterType (type) {
  return dispatch => {
    dispatch({
      type: Actions.FILTER,
      data: type
    });
  };
}

export function filterKeys (keys) {
  return dispatch => {
    dispatch({
      type: Actions.SEARCH,
      keys: keys
    })
  }
}