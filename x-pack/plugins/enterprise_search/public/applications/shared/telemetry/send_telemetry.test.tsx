/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';

import { httpServiceMock } from 'src/core/public/mocks';
import { mountWithKibanaContext } from '../../__mocks__';
import { sendTelemetry, SendAppSearchTelemetry } from './';

describe('Shared Telemetry Helpers', () => {
  const httpMock = httpServiceMock.createSetupContract();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTelemetry', () => {
    it('successfully calls the server-side telemetry endpoint', () => {
      sendTelemetry({
        http: httpMock,
        product: 'enterprise_search',
        action: 'viewed',
        metric: 'setup_guide',
      });

      expect(httpMock.put).toHaveBeenCalledWith('/api/enterprise_search/telemetry', {
        headers: { 'Content-Type': 'application/json' },
        body: '{"action":"viewed","metric":"setup_guide"}',
      });
    });

    it('throws an error if the telemetry endpoint fails', () => {
      const httpRejectMock = sendTelemetry({
        http: { put: () => Promise.reject() },
      } as any);

      expect(httpRejectMock).rejects.toThrow('Unable to send telemetry');
    });
  });

  describe('React component helpers', () => {
    it('SendAppSearchTelemetry component', () => {
      mountWithKibanaContext(<SendAppSearchTelemetry action="clicked" metric="button" />, {
        http: httpMock,
      });

      expect(httpMock.put).toHaveBeenCalledWith('/api/app_search/telemetry', {
        headers: { 'Content-Type': 'application/json' },
        body: '{"action":"clicked","metric":"button"}',
      });
    });
  });
});
