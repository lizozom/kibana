/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Observable, ReplaySubject, Subscription } from 'rxjs';
import { IKibanaSearchResponse } from '../../../../../src/plugins/data/public';

interface ResponseCacheItem {
  response: ReplaySubject<IKibanaSearchResponse<any>>;
  size: number;
}

export const CACHE_MAX_SIZE_MB = 10;

export class SearchResponseCache {
  private responseCache: Map<string, ResponseCacheItem>;
  private cacheSize = 0;

  constructor(private maxItems: number, private maxCacheSizeMB: number) {
    this.responseCache = new Map();
  }

  private byteToMb(size: number) {
    return size / (1024 * 1024);
  }

  private deleteItem(key: string) {
    const item = this.responseCache.get(key);
    if (item) {
      this.cacheSize -= item.size;
      this.responseCache.delete(key);
    }
  }

  private setItem(key: string, item: ResponseCacheItem) {
    // The deletion of the key will move it to the end of the Map's entries.
    this.deleteItem(key);
    this.cacheSize += item.size;
    this.responseCache.set(key, item);
  }

  public clear() {
    this.responseCache.clear();
  }

  private shrink() {
    while (
      this.responseCache.size > this.maxItems ||
      this.byteToMb(this.cacheSize) > this.maxCacheSizeMB
    ) {
      const [key] = this.responseCache.entries().next().value as [string, ResponseCacheItem];
      this.deleteItem(key);
    }
  }

  public set(key: string, response: Observable<IKibanaSearchResponse<any>>) {
    const sub = new ReplaySubject<IKibanaSearchResponse<any>>(1);
    const item = {
      response: sub,
      size: 0,
    };

    this.setItem(key, item);

    const subscriptions = new Subscription();
    subscriptions.add(
      response.subscribe({
        next: (r) => {
          const newSize = JSON.stringify(r).length;

          if (this.byteToMb(newSize) < this.maxCacheSizeMB) {
            this.setItem(key, {
              ...item,
              size: newSize,
            });
            this.shrink();
          } else {
            // Single item is too large to be cached, evict and ignore
            this.deleteItem(key);
          }
        },
      })
    );
    subscriptions.add(response.subscribe(sub));

    this.shrink();
  }

  public get(key: string) {
    const item = this.responseCache.get(key);
    if (item) {
      // touch the item, and move it to the end of the map's entries
      this.setItem(key, item);
      return item?.response;
    }
  }
}
