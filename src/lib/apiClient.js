/* eslint-disable no-unused-vars */
/**
 * Handle server responses with status code between 200 and 300.
 * This will pass a JSON response to apiMiddleware, which will then create
 * a SUCCESS Redux action.
 */
export const handleSuccessfulResponse = response => response.json();

/**
 * Handle server response with status code of 401.
 * This will reject a promise with unauthorized object, which should dispatch
 * a LOGOUT action from apiMiddleware.
 */
export const handleUnauthorizedResponse = () => {
  const error = new Error('401 - Unauthorized');
  error.unauthorized = true;
  return Promise.reject(error);
};

/**
 * Reject a promise with error response, which will then dispatch an ERROR
 * action from apiMiddleware.
 */
export const handleErrorResponse = response =>
  response.json().then(res => Promise.reject(res));

/**
 * Create a remote api call which is used by api.js middleware to handle all
 * remote api calls and dispatch Redux actions based on the request state.
 * @param url The api call endpoint
 * @param body Optional request body
 * @param method The request type, which defaults to POST if not provided
 * @param options fetch options,
 *  ref: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Supplying_request_options
 * @returns {Promise<Response | never>}
 */
export const callApi = (url, body, method = 'GET', options = {}) => {
  const params = {
    ...options,
    method,
  };

  if (method === 'POST') {
    params.body = body && JSON.stringify(body);
    params.headers = {
      ...params.headers,
      'Content-Type': 'application/json;',
    };
  }

  return fetch(url, params).then(response => {
    if (response.status >= 200 && response.status < 300) {
      return handleSuccessfulResponse(response);
    }
    if (response.status === 401) {
      return handleUnauthorizedResponse();
    }
    return handleErrorResponse(response);
  });
};
