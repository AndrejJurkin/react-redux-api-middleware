import fetchMock from 'fetch-mock';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  API_CALL,
  apiActionType,
  apiMiddleware as middleware,
  createApiActionSet,
  createErrorAction,
  createLoadingAction,
  createSuccessAction,
} from '../apiMiddleware';

const TEST_ACTION = 'TEST_ACTION';

const TEST_EXPECTED_RESPONSE = {
  test: true,
};

const TEST_API_ACTION_SET = createApiActionSet(TEST_ACTION);

const TEST_API_ACTION = {
  [API_CALL]: {
    url: '/test',
    actions: TEST_API_ACTION_SET,
  },
};

const prefs = {
  getAuthToken: () => 'test_token',
};

const mockStore = configureMockStore([thunk, middleware(prefs)]);

const mockStoreWithoutSettings = configureMockStore([thunk, middleware()]);

const create = () => {
  const next = jest.fn();
  const invoke = action => middleware(prefs)()(next)(action);
  return { next, invoke };
};

const createTestAction = () => ({ type: 'TEST' });

describe('apiMiddleware.js', () => {
  afterEach(() => {
    fetchMock.reset();
    fetchMock.restore();
  });
  it('passes through a non-api related action', () => {
    const { next, invoke } = create();
    const action = createTestAction();
    invoke(action);
    expect(next).toHaveBeenCalledWith(action);
  });
  it('invokes LOADING and SUCCESS from api action set', () => {
    fetchMock.mock('/test', {
      body: TEST_EXPECTED_RESPONSE,
    });
    const store = mockStore({});
    const actionSet = createApiActionSet(TEST_ACTION);
    const loadingAction = createLoadingAction(actionSet.LOADING);
    const successAction = createSuccessAction(
      actionSet.SUCCESS,
      TEST_EXPECTED_RESPONSE,
    );
    const expectedActions = [loadingAction, successAction];
    return store.dispatch(TEST_API_ACTION).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
  it('invokes LOADING and ERROR from api action set', () => {
    fetchMock.mock('/test', { body: TEST_EXPECTED_RESPONSE, status: 400 });
    const store = mockStore({});
    const actionSet = createApiActionSet(TEST_ACTION);
    const loadingAction = createLoadingAction(actionSet.LOADING);
    const errorAction = createErrorAction(
      actionSet.ERROR,
      TEST_EXPECTED_RESPONSE,
    );
    const expectedActions = [loadingAction, errorAction];
    return store.dispatch(TEST_API_ACTION).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
  it('invokes fetch with options', () => {
    fetchMock.mock('/test', 200);
    const action = {
      [API_CALL]: {
        url: '/test',
        actions: TEST_API_ACTION_SET,
      },
    };
    const expectedOptions = {
      headers: {
        Authorization: 'Bearer test_token',
      },
      method: 'GET',
    };
    const store = mockStore({});
    return store.dispatch(action).then(() => {
      expect(fetchMock.lastCall('/test')[1]).toEqual(expectedOptions);
    });
  });
  it('invokes fetch without auth options if !authenticated', () => {
    fetchMock.mock('/test', 200);
    const action = {
      [API_CALL]: {
        url: '/test',
        actions: TEST_API_ACTION_SET,
        authenticated: false,
      },
    };
    const expectedOptions = {
      method: 'GET',
    };
    const store = mockStore({});
    return store.dispatch(action).then(() => {
      expect(fetchMock.lastCall('/test')[1]).toEqual(expectedOptions);
    });
  });
  it('invokes fetch without auth options if store does not provide settings', () => {
    fetchMock.mock('/test', 200);
    const action = {
      [API_CALL]: {
        url: '/test',
        actions: TEST_API_ACTION_SET,
        authenticated: false,
      },
    };
    const expectedOptions = {
      method: 'GET',
    };
    const store = mockStoreWithoutSettings({});
    return store.dispatch(action).then(() => {
      expect(fetchMock.lastCall('/test')[1]).toEqual(expectedOptions);
    });
  });
});

describe('apiMiddleware.js, error handling', () => {
  it('throws exception if url is undefined', done => {
    const { invoke } = create();
    try {
      const incorrectApiAction = {
        [API_CALL]: {
          body: {},
          actions: {},
        },
      };
      invoke(incorrectApiAction);
    } catch (e) {
      done();
    }
  });
  it('throws exception if actions are undefined', done => {
    const { invoke } = create();
    try {
      const incorrectApiAction = {
        [API_CALL]: {
          url: 'test',
          body: {},
        },
      };
      invoke(incorrectApiAction);
    } catch (e) {
      done();
    }
  });
  it('throws exception if action group is incorrect', done => {
    const { invoke } = create();
    try {
      const incorrectApiAction = {
        [API_CALL]: {
          url: 'test',
          body: {},
          actions: {},
        },
      };
      invoke(incorrectApiAction);
    } catch (e) {
      done();
    }
  });
});

const createTestActionSet = () => {
  const actionName = 'TEST_ACTION';
  const actionSet = createApiActionSet(actionName);
  return { actionName, actionSet };
};

describe('apiMiddleware.js, apiActionType', () => {
  it('should provide SUCCESS, LOADING and ERROR types', () => {
    expect(apiActionType.SUCCESS).toEqual('SUCCESS');
    expect(apiActionType.ERROR).toEqual('ERROR');
    expect(apiActionType.LOADING).toEqual('LOADING');
  });
});

describe('apiMiddleware.js, createActionSet', () => {
  it('should create a valid action set', () => {
    const { actionName, actionSet } = createTestActionSet();
    expect(actionSet.LOADING).toEqual(`${actionName}_${apiActionType.LOADING}`);
    expect(actionSet.SUCCESS).toEqual(`${actionName}_${apiActionType.SUCCESS}`);
    expect(actionSet.ERROR).toEqual(`${actionName}_${apiActionType.ERROR}`);
  });
});

describe('apiMiddleware.js, createSuccessAction', () => {
  const { actionSet } = createTestActionSet();
  const testResponse = { testResponse: 'test' };
  const meta = { firstName: 'John', lastName: 'Doe' };
  const successAction = createSuccessAction(
    actionSet.SUCCESS,
    testResponse,
    meta,
  );
  it('should have a correct action type ', () => {
    expect(successAction.type).toEqual(actionSet.SUCCESS);
  });
  it('should have a correct apiActionType', () => {
    expect(successAction.apiActionType).toEqual(apiActionType.SUCCESS);
  });
  it('should contain a response', () => {
    expect(successAction.response).toEqual(testResponse);
  });
  it('should contain metadata', () => {
    expect(successAction.firstName).toEqual('John');
    expect(successAction.lastName).toEqual('Doe');
  });
});

describe('apiMiddleware.js, createErrorAction', () => {
  const { actionSet } = createTestActionSet();
  const testError = { testResponse: 'Test Error' };
  const meta = { firstName: 'John', lastName: 'Doe' };
  const errorAction = createErrorAction(actionSet.ERROR, testError, meta);
  it('should have a correct action type ', () => {
    expect(errorAction.type).toEqual(actionSet.ERROR);
  });
  it('should have a correct apiActionType', () => {
    expect(errorAction.apiActionType).toEqual(apiActionType.ERROR);
  });
  it('should contain an error message', () => {
    expect(errorAction.error).toEqual(testError.toString());
  });
  it('should contain metadata', () => {
    expect(errorAction.firstName).toEqual('John');
    expect(errorAction.lastName).toEqual('Doe');
  });
});
