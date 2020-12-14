/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { pollSearch } from './poll_search';
import { AbortError } from '../../../../../src/plugins/kibana_utils/common';

describe('EnhancedSearchInterceptor', () => {
  function getMockedSearch$(resolveOnI = 1, finishWithError = false) {
    let counter = 0;
    return jest.fn().mockImplementation(() => {
      counter++;
      const lastCall = counter === resolveOnI;
      return new Promise((resolve) => {
        if (lastCall) {
          resolve({
            isRunning: false,
            isPartial: finishWithError,
          });
        } else {
          resolve({
            isRunning: true,
            isPartial: true,
          });
        }
      });
    });
  }

  test('Resolves immediatelly', async () => {
    const searchFn = getMockedSearch$(1);
    const cancelFn = jest.fn();
    await pollSearch(searchFn, cancelFn).toPromise();
    expect(searchFn).toBeCalledTimes(1);
    expect(cancelFn).toBeCalledTimes(1);
  });

  test('Resolves when complete', async () => {
    const searchFn = getMockedSearch$(3);
    const cancelFn = jest.fn();
    await pollSearch(searchFn, cancelFn).toPromise();
    expect(searchFn).toBeCalledTimes(3);
    expect(cancelFn).toBeCalledTimes(1);
  });

  test('Throws AbortError on error', async () => {
    const searchFn = getMockedSearch$(2, true);
    const cancelFn = jest.fn();
    const poll = pollSearch(searchFn, cancelFn).toPromise();
    await expect(poll).rejects.toThrow(AbortError);
    expect(searchFn).toBeCalledTimes(2);
    expect(cancelFn).toBeCalledTimes(1);
  });

  test('Throws AbortError on external abort', async () => {
    const searchFn = getMockedSearch$(20);
    const cancelFn = jest.fn();
    const abortController = new AbortController();
    const poll = pollSearch(searchFn, cancelFn, {
      pollInterval: 2000,
      abortSignal: abortController.signal,
    }).toPromise();

    await new Promise((resolve) => setTimeout(resolve, 500));
    abortController.abort();

    await expect(poll).rejects.toThrow(AbortError);
    expect(searchFn).toBeCalledTimes(1);
    expect(cancelFn).toBeCalledTimes(1);
  });

  test('Cleans up and stops on unsubscribe', async () => {
    const searchFn = getMockedSearch$(20);
    const cancelFn = jest.fn();
    const subscription = pollSearch(searchFn, cancelFn, { pollInterval: 2000 }).subscribe(() => {});

    await new Promise((resolve) => setTimeout(resolve, 500));
    subscription.unsubscribe();

    expect(searchFn).toBeCalledTimes(1);
    expect(cancelFn).toBeCalledTimes(1);
  });
});
