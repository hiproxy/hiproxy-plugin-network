export const Actions = {
    'ON_ARRIVE': 'ON_ARRIVE'
};

export function onArrive(request) {
    return function (dispatch) {
        dispatch({
            type: Actions.ON_ARRIVE,
            data: request
        });
    }
}
