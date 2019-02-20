/* eslint-disable no-unused-vars */
import fetchMock from 'fetch-mock';
import { callApi } from '../apiClient';

const mockExpectedResponse = {
  test: true,
};

describe('apiClient.js', () => {
  afterEach(() => {
    fetchMock.reset();
    fetchMock.restore();
  });
  it('returns json response when fetch request was successful', () => {
    fetchMock.mock('*', mockExpectedResponse);
    return callApi('/test').then(response => {
      expect(response).toEqual(mockExpectedResponse);
    });
  });
  it('returns unauthorized flag when fetch request returns status code 401', () => {
    fetchMock.mock('*', 401);
    return callApi('/test').then(
      response => {},
      error => {
        expect(error.unauthorized).toEqual(true);
      },
    );
  });
  it('returns error object as a string if fetch request failed', () => {
    fetchMock.mock('*', { body: mockExpectedResponse, status: 400 });
    return callApi('/test').then(
      response => {},
      error => {
        expect(error).toEqual(mockExpectedResponse);
      },
    );
  });
});
