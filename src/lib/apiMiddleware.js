import { callApi } from './apiClient';

export const API_CALL = 'API_CALL';

/**
 * Default preferences for apiMiddleware
 * @type {{getAuthToken: null}}
 */
export const defaultPrefs = {
  getAuthToken: null,
};

/**
 * Enum for action types that we use when dealing with the remote api.
 * @type {{SUCCESS: string, ERROR: string, LOADING: string}}
 */
export const apiActionType = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  LOADING: 'LOADING',
};

/**
 * Create 3 action types that we use when working with the remote api.
 * This object should be passed to apiMiddleware, which automatically
 * dispatches action types based on the request state.
 * @param actionName
 * @returns {{LOADING: string, SUCCESS: string, ERROR: string, actionName: *}}
 */
export const createApiActionSet = actionName => ({
  LOADING: `${actionName}_${apiActionType.LOADING}`,
  SUCCESS: `${actionName}_${apiActionType.SUCCESS}`,
  ERROR: `${actionName}_${apiActionType.ERROR}`,
  actionName,
});

/**
 * Create a SUCCESS action, which indicates that remote api request has
 * succeeded. This function is used by apiMiddleware to create
 * actions based on the request state.
 * This should also be used when unit testing the store.
 * @param action The Redux action type
 * @param response JSON response received from the remote api
 * @param meta Any additional parameters could be passed here
 * @returns {{type: *, apiActionType: string, response: *}}
 */
export const createSuccessAction = (action, response, meta) => ({
  type: action,
  apiActionType: apiActionType.SUCCESS,
  response,
  ...meta,
});

/**
 * Create an ERROR action, which indicates that remote api request has failed.
 * This function is used by apiMiddleware to create
 * actions based on the request state.
 * This should also be used when unit testing the store.
 * @param action The Redux action type
 * @param error The error message parsed from the response
 * @param meta Any additional parameters could be passed here
 * @returns {{type: *, apiActionType: string, rawError: *, error: string}}
 */
export const createErrorAction = (action, error, meta) => ({
  type: action,
  apiActionType: apiActionType.ERROR,
  rawError: error,
  error: error.toString(),
  ...meta,
});

/**
 * Create a LOADING action, which indicates that remote api request is pending.
 * This function is used by apiMiddleware to create
 * actions based on the request state.
 * This should also be used when unit testing the store.
 * @param action The Redux action type
 * @param meta Any additional parameters could be passed here
 * @returns {{type: *, apiActionType: string}}
 */
export const createLoadingAction = (action, meta) => ({
  type: action,
  apiActionType: apiActionType.LOADING,
  ...meta,
});

/**
 * Api middleware that takes an action which contains API_CALL property and
 * dispatches 3 action types based on the request status. Api call property
 * should at least contain endpoint url and action set, which is created by a
 * helper function createApiActionSet.
 * @returns {function(*=): Function}
 */
export const apiMiddleware = () => store => next => action => {
  const apiCall = action[API_CALL];

  // Ignore all non api-related actions
  if (typeof apiCall === 'undefined') {
    return next(action);
  }

  const getAuthToken = () => store.getState().auth.accessToken;

  const {
    url,
    body,
    actions,
    meta,
    method,
    options,
    authenticated = true,
  } = apiCall;

  if (typeof url !== 'string') {
    throw new Error('Api call action does not contain url string');
  }

  if (!actions) {
    throw new Error('Api call action does not contain action group');
  }

  if (!actions.SUCCESS || !actions.ERROR || !actions.LOADING) {
    throw new Error(
      'Api call does not contain a correct action group. ' +
        'Please use createApiActionSet to create actions.',
    );
  }

  let apiOptions = { ...options };

  if (authenticated && getAuthToken) {
    apiOptions = {
      ...apiOptions,
      headers: {
        ...apiOptions.headers,
        Authorization: `Bearer ${getAuthToken()}`,
      },
    };
  }

  // Dispatch loading action
  next(createLoadingAction(actions.LOADING, meta));

  return callApi(url, body, method, apiOptions).then(
    response => next(createSuccessAction(actions.SUCCESS, response, meta)),
    error => {
      if (error.unauthorized) {
        // Dispatch LOGOUT action here
      }
      return next(createErrorAction(actions.ERROR, error, meta));
    },
  );
};
