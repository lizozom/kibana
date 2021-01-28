/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { enhancedEsSearchStrategyProvider } from './es_search_strategy';
import { BehaviorSubject } from 'rxjs';
import { SearchStrategyDependencies } from '../../../../../src/plugins/data/server/search';
import moment from 'moment';

const mockAsyncResponse = {
  body: {
    id: 'foo',
    response: {
      _shards: {
        total: 10,
        failed: 1,
        skipped: 2,
        successful: 7,
      },
    },
  },
};

const mockRollupResponse = {
  body: {
    _shards: {
      total: 10,
      failed: 1,
      skipped: 2,
      successful: 7,
    },
  },
};

describe('ES search strategy', () => {
  const mockApiCaller = jest.fn();
  const mockGetCaller = jest.fn();
  const mockSubmitCaller = jest.fn();
  const mockDeleteCaller = jest.fn();
  const mockLogger: any = {
    debug: () => {},
  };
  const mockDeps = ({
    uiSettingsClient: {
      get: jest.fn(),
    },
    esClient: {
      asCurrentUser: {
        asyncSearch: {
          get: mockGetCaller,
          submit: mockSubmitCaller,
          delete: mockDeleteCaller,
        },
        transport: { request: mockApiCaller },
      },
    },
  } as unknown) as SearchStrategyDependencies;
  const mockLegacyConfig$ = new BehaviorSubject<any>({
    elasticsearch: {
      shardTimeout: {
        asMilliseconds: () => {
          return 100;
        },
      },
    },
  });

  const mockConfig$ = new BehaviorSubject<any>({
    search: {
      sessions: {
        defaultExpiration: moment.duration('1', 'm'),
      },
    },
  });

  beforeEach(() => {
    mockApiCaller.mockClear();
    mockGetCaller.mockClear();
    mockSubmitCaller.mockClear();
    mockDeleteCaller.mockClear();
  });

  it('returns a strategy with `search and `cancel`', async () => {
    const esSearch = await enhancedEsSearchStrategyProvider(
      mockConfig$,
      mockLegacyConfig$,
      mockLogger
    );

    expect(typeof esSearch.search).toBe('function');
  });

  describe('search', () => {
    it('makes a POST request to async search with params when no ID is provided', async () => {
      mockSubmitCaller.mockResolvedValueOnce(mockAsyncResponse);

      const params = { index: 'logstash-*', body: { query: {} } };
      const esSearch = await enhancedEsSearchStrategyProvider(
        mockConfig$,
        mockLegacyConfig$,
        mockLogger
      );

      await esSearch.search({ params }, {}, mockDeps).toPromise();

      expect(mockSubmitCaller).toBeCalled();
      const request = mockSubmitCaller.mock.calls[0][0];
      expect(request.index).toEqual(params.index);
      expect(request.body).toEqual(params.body);
    });

    it('makes a GET request to async search with ID when ID is provided', async () => {
      mockGetCaller.mockResolvedValueOnce(mockAsyncResponse);

      const params = { index: 'logstash-*', body: { query: {} } };
      const esSearch = await enhancedEsSearchStrategyProvider(
        mockConfig$,
        mockLegacyConfig$,
        mockLogger
      );

      await esSearch.search({ id: 'foo', params }, {}, mockDeps).toPromise();

      expect(mockGetCaller).toBeCalled();
      const request = mockGetCaller.mock.calls[0][0];
      expect(request.id).toEqual('foo');
      expect(request).toHaveProperty('wait_for_completion_timeout');
    });

    it('calls the rollup API if the index is a rollup type', async () => {
      mockApiCaller.mockResolvedValueOnce(mockRollupResponse);

      const params = { index: 'foo-程', body: {} };
      const esSearch = await enhancedEsSearchStrategyProvider(
        mockConfig$,
        mockLegacyConfig$,
        mockLogger
      );

      await esSearch
        .search(
          {
            indexType: 'rollup',
            params,
          },
          {},
          mockDeps
        )
        .toPromise();

      expect(mockApiCaller).toBeCalled();
      const { method, path } = mockApiCaller.mock.calls[0][0];
      expect(method).toBe('POST');
      expect(path).toBe('/foo-%E7%A8%8B/_rollup_search');
    });

    it('sets wait_for_completion_timeout and keep_alive in the request', async () => {
      mockSubmitCaller.mockResolvedValueOnce(mockAsyncResponse);

      const params = { index: 'foo-*', body: {} };
      const esSearch = await enhancedEsSearchStrategyProvider(
        mockConfig$,
        mockLegacyConfig$,
        mockLogger
      );

      await esSearch.search({ params }, {}, mockDeps).toPromise();

      expect(mockSubmitCaller).toBeCalled();
      const request = mockSubmitCaller.mock.calls[0][0];
      expect(request).toHaveProperty('wait_for_completion_timeout');
      expect(request).toHaveProperty('keep_alive');
    });
  });

  describe('cancel', () => {
    it('makes a DELETE request to async search with the provided ID', async () => {
      mockDeleteCaller.mockResolvedValueOnce(200);

      const id = 'some_id';
      const esSearch = await enhancedEsSearchStrategyProvider(
        mockConfig$,
        mockLegacyConfig$,
        mockLogger
      );

      await esSearch.cancel!(id, {}, mockDeps);

      expect(mockDeleteCaller).toBeCalled();
      const request = mockDeleteCaller.mock.calls[0][0];
      expect(request).toEqual({ id });
    });
  });

  describe('extend', () => {
    it('makes a GET request to async search with the provided ID and keepAlive', async () => {
      mockGetCaller.mockResolvedValueOnce(mockAsyncResponse);

      const id = 'some_other_id';
      const keepAlive = '1d';
      const esSearch = await enhancedEsSearchStrategyProvider(
        mockConfig$,
        mockLegacyConfig$,
        mockLogger
      );

      await esSearch.extend!(id, keepAlive, {}, mockDeps);

      expect(mockGetCaller).toBeCalled();
      const request = mockGetCaller.mock.calls[0][0];
      expect(request).toEqual({ id, keep_alive: keepAlive });
    });
  });
});
