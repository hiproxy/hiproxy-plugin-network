import {Actions} from './action';

const initState = {
  requests: []
};

function HomeReducer (state = initState, action) {
  switch (action.type) {
    case Actions.ON_ARRIVE:

      return Object.assign({}, state, {
        requests: state.requests.concat([action.data]).slice(-200)
      });

      break;
    case Actions.CLEAR:
      return initState;
    default:
      return state;
  }
}

export default HomeReducer;
