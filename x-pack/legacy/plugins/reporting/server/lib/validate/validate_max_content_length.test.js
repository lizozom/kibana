/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import sinon from 'sinon';
import { validateMaxContentLength } from './validate_max_content_length';

const FIVE_HUNDRED_MEGABYTES = 524288000;
const ONE_HUNDRED_MEGABYTES = 104857600;

describe('Reporting: Validate Max Content Length', () => {
  const elasticsearch = {
    legacy: {
      client: {
        callAsInternalUser: () => ({
          defaults: {
            http: {
              max_content_length: '100mb',
            },
          },
        }),
      },
    },
  };

  const logger = {
    warning: sinon.spy(),
  };

  beforeEach(() => {
    logger.warning.resetHistory();
  });

  it('should log warning messages when reporting has a higher max-size than elasticsearch', async () => {
    const config = { get: sinon.stub().returns(FIVE_HUNDRED_MEGABYTES) };
    const elasticsearch = {
      legacy: {
        client: {
          callAsInternalUser: () => ({
            defaults: {
              http: {
                max_content_length: '100mb',
              },
            },
          }),
        },
      },
    };

    await validateMaxContentLength(config, elasticsearch, logger);

    sinon.assert.calledWithMatch(
      logger.warning,
      `xpack.reporting.csv.maxSizeBytes (524288000) is higher`
    );
    sinon.assert.calledWithMatch(
      logger.warning,
      `than ElasticSearch's http.max_content_length (104857600)`
    );
    sinon.assert.calledWithMatch(
      logger.warning,
      'Please set http.max_content_length in ElasticSearch to match'
    );
    sinon.assert.calledWithMatch(
      logger.warning,
      'or lower your xpack.reporting.csv.maxSizeBytes in Kibana'
    );
  });

  it('should do nothing when reporting has the same max-size as elasticsearch', async () => {
    const config = { get: sinon.stub().returns(ONE_HUNDRED_MEGABYTES) };

    expect(
      async () => await validateMaxContentLength(config, elasticsearch, logger.warning)
    ).not.toThrow();
    sinon.assert.notCalled(logger.warning);
  });
});
