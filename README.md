# Redux API Middleware
Loading - Success - Error, Redux pattern. Just a little bit less boilerplate.

## How does it work
1. Create a Redux action and specify network request details.
```
const FETCH_USERS = createActionSet('FETCH_USERS');

const action = {
  [API_CALL]: {
    url: '/some/endpoint',
    method: 'GET',
    actions: FETCH_USERS,
  },
};

```
2. Once you dispatch an action, middleware will perform a network request and dispatch Loading, Success or Error actions.
```
function userReducer(state, action) {
  switch(action.type) {
    case: FETCH_USERS.LOADING:
      // Do something with the loading state
      return state;
    case FETCH_USERS.SUCESS: {
      // Do something with the response
      return {
        ...state,
        users: action.response,
      }
    }
    case FETCH_USERS.ERROR: {
      return {
        ...state,
        someErrorMessage: action.error,
      }
    }
    ...
  }
}
```
3. Profit
