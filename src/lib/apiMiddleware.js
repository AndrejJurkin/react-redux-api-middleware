import { callApi } from './apiClient';

export const API_CALL = 'API_CALL';

export const defaultConfig = {};

/**
 * Api middleware that takes an action which contains API_CALL property and
 * dispatches 3 action types based on the request status. Api call property
 * should at least contain endpoint url and action set, which is created by a
 * helper function createApiActionSet.
 * @returns {function(*=): Function}
 */
export const apiMiddleware = (
  config = defaultConfig,
) => store => next => action => {
  const apiCall = action[API_CALL];

  // Ignore all non api-related actions
  if (typeof apiCall === 'undefined') {
    return next(action);
  }

  const { getAuthToken } = config;

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
        Authorization: `Bearer ${getAuthToken(store)}`,
      },
    };
  }

  // Dispatch loading action
  next(createLoadingAction(actions, meta));

  return callApi(url, body, method, apiOptions).then(
    response => next(createSuccessAction(actions, response, meta)),
    error => {
      if (error.unauthorized) {
        // Dispatch LOGOUT action here
      }
      return next(createErrorAction(actions, error, meta));
    },
  );
};

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
 * @param actions The ActionSet
 * @param response JSON response received from the remote api
 * @param meta Any additional parameters could be passed here
 * @returns {{type: *, apiActionType: string, response: *}}
 */
export const createSuccessAction = (actions, response, meta) => ({
  type: actions.SUCCESS,
  apiActionType: apiActionType.SUCCESS,
  actionName: actions.actionName,
  response,
  ...meta,
});

/**
 * Create an ERROR action, which indicates that remote api request has failed.
 * This function is used by apiMiddleware to create
 * actions based on the request state.
 * This should also be used when unit testing the store.
 * @param actions The ActionSet
 * @param error The error message parsed from the response
 * @param meta Any additional parameters could be passed here
 * @returns {{type: *, apiActionType: string, rawError: *, error: string}}
 */
export const createErrorAction = (actions, error, meta) => ({
  type: actions.ERROR,
  apiActionType: apiActionType.ERROR,
  rawError: error,
  error: error.toString(),
  actionName: actions.actionName,
  ...meta,
});

/**
 * Create a LOADING action, which indicates that remote api request is pending.
 * This function is used by apiMiddleware to create
 * actions based on the request state.
 * This should also be used when unit testing the store.
 * @param actions The action set
 * @param meta Any additional parameters could be passed here
 * @returns {{type: *, apiActionType: string}}
 */
export const createLoadingAction = (actions, meta) => ({
  type: actions.LOADING,
  apiActionType: apiActionType.LOADING,
  actionName: actions.actionName,
  ...meta,
});
