/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { BatchItem } from './types';
import { AbortError } from '../../../kibana_utils/public';

export function isBatchDone(items: Array<BatchItem<any, any>>): boolean {
  return items.every((item) => item.done);
}

export function getDonePromise(item: BatchItem<any, any>) {
  return new Promise<void>((resolve) => {
    const onDone = () => {
      item.signal?.removeEventListener('abort', onDone);
      resolve();
    };
    item.future.promise.then(onDone, onDone);
    item.signal?.addEventListener('abort', onDone);
  });
}

export function rejectOnAbort(item: BatchItem<any, any>) {
  const cleanup = () => item.signal?.removeEventListener('abort', rejectAborted);
  const rejectAborted = () => {
    item.future.reject(new AbortError());
    cleanup();
  };

  item.signal?.addEventListener('abort', rejectAborted);
  item.future.promise.then(cleanup, cleanup);
}
