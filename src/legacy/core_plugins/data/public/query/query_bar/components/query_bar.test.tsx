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

import { mockPersistedLogFactory } from './query_bar_input.test.mocks';

import React from 'react';
import { shallowWithIntl } from 'test_utils/enzyme_helpers';
import './query_bar.test.mocks';
import { QueryBar } from './query_bar';

const noop = () => {
  return;
};

const kqlQuery = {
  query: 'response:200',
  language: 'kuery',
};

const createMockWebStorage = () => ({
  clear: jest.fn(),
  getItem: jest.fn(),
  key: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
  length: 0,
});

const createMockStorage = () => ({
  store: createMockWebStorage(),
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
});

const mockIndexPattern = {
  id: '1234',
  title: 'logstash-*',
  fields: [
    {
      name: 'response',
      type: 'number',
      esTypes: ['integer'],
      aggregatable: true,
      filterable: true,
      searchable: true,
    },
  ],
};

describe('QueryBar', () => {
  const QUERY_BAR_SELECTOR = 'InjectIntl(QueryBarInputUI)';
  const TIMEPICKER_SELECTOR = 'EuiSuperDatePicker';
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should render the given query', () => {
    const component = shallowWithIntl(
      <QueryBar.WrappedComponent
        query={kqlQuery}
        onSubmit={noop}
        appName={'discover'}
        screenTitle={'Another Screen'}
        indexPatterns={[mockIndexPattern]}
        store={createMockStorage()}
        intl={null as any}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('Should create a unique PersistedLog based on the appName and query language', () => {
    shallowWithIntl(
      <QueryBar.WrappedComponent
        query={kqlQuery}
        onSubmit={noop}
        appName={'discover'}
        screenTitle={'Another Screen'}
        indexPatterns={[mockIndexPattern]}
        store={createMockStorage()}
        disableAutoFocus={true}
        intl={null as any}
      />
    );

    expect(mockPersistedLogFactory.mock.calls[0][0]).toBe('typeahead:discover-kuery');
  });

  it('Should render empty', () => {
    const component = shallowWithIntl(
      <QueryBar.WrappedComponent
        onSubmit={noop}
        appName={'discover'}
        screenTitle={'Another Screen'}
        indexPatterns={[mockIndexPattern]}
        store={createMockStorage()}
        intl={null as any}
      />
    );

    expect(component.find(QUERY_BAR_SELECTOR).length).toBe(0);
  });

  it('Should render query input bar', () => {
    const component = shallowWithIntl(
      <QueryBar.WrappedComponent
        query={kqlQuery}
        onSubmit={noop}
        appName={'discover'}
        screenTitle={'Another Screen'}
        indexPatterns={[mockIndexPattern]}
        store={createMockStorage()}
        intl={null as any}
      />
    );

    expect(component.find(QUERY_BAR_SELECTOR).length).toBe(1);
  });

  it('Should NOT render query input bar if disabled', () => {
    const component = shallowWithIntl(
      <QueryBar.WrappedComponent
        query={kqlQuery}
        onSubmit={noop}
        appName={'discover'}
        screenTitle={'Another Screen'}
        indexPatterns={[mockIndexPattern]}
        store={createMockStorage()}
        intl={null as any}
        showQueryInput={false}
      />
    );

    expect(component.find(QUERY_BAR_SELECTOR).length).toBe(0);
  });

  it('Should NOT render timepicker, if options not provided', () => {
    const component = shallowWithIntl(
      <QueryBar.WrappedComponent
        onSubmit={noop}
        appName={'discover'}
        screenTitle={'Another Screen'}
        indexPatterns={[mockIndexPattern]}
        store={createMockStorage()}
        intl={null as any}
        showDatePicker={true}
      />
    );

    expect(component.find(QUERY_BAR_SELECTOR).length).toBe(0);
    expect(component.find(TIMEPICKER_SELECTOR).length).toBe(0);
  });

  it('Should NOT render timepicker, if options are provided, but showDatePicker is not specified', () => {
    const component = shallowWithIntl(
      <QueryBar.WrappedComponent
        onSubmit={noop}
        appName={'discover'}
        screenTitle={'Another Screen'}
        indexPatterns={[mockIndexPattern]}
        store={createMockStorage()}
        intl={null as any}
        dateRangeFrom={'now-7d'}
        dateRangeTo={'now'}
      />
    );

    expect(component.find(QUERY_BAR_SELECTOR).length).toBe(0);
    expect(component.find(TIMEPICKER_SELECTOR).length).toBe(0);
  });

  it('Should render timepicker', () => {
    const component = shallowWithIntl(
      <QueryBar.WrappedComponent
        onSubmit={noop}
        appName={'discover'}
        screenTitle={'Another Screen'}
        indexPatterns={[mockIndexPattern]}
        store={createMockStorage()}
        intl={null as any}
        showDatePicker={true}
        dateRangeFrom={'now-7d'}
        dateRangeTo={'now'}
      />
    );

    expect(component.find(QUERY_BAR_SELECTOR).length).toBe(0);
    expect(component.find(TIMEPICKER_SELECTOR).length).toBe(1);
  });
});
