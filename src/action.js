export const Actions = {
  'ON_ARRIVE': 'ON_ARRIVE',
  'CLEAR': 'CLEAR'
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
  'use strict';
  return dispatch => {
    dispatch({
      type: Actions.CLEAR
    });
  };
}
