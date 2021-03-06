/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import Hapi from 'hapi';
import { initPlugin as initSlack } from './slack_simulation';
import { initPlugin as initWebhook } from './webhook_simulation';
import { initPlugin as initPagerduty } from './pagerduty_simulation';

const NAME = 'actions-FTS-external-service-simulators';

export enum ExternalServiceSimulator {
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  PAGERDUTY = 'pagerduty',
}

export function getExternalServiceSimulatorPath(service: ExternalServiceSimulator): string {
  return `/api/_${NAME}/${service}`;
}

export function getAllExternalServiceSimulatorPaths(): string[] {
  return Object.values(ExternalServiceSimulator).map(service =>
    getExternalServiceSimulatorPath(service)
  );
}

// eslint-disable-next-line import/no-default-export
export default function(kibana: any) {
  return new kibana.Plugin({
    require: ['actions'],
    name: NAME,
    init: (server: Hapi.Server) => {
      server.plugins.xpack_main.registerFeature({
        id: 'actions',
        name: 'Actions',
        app: ['actions', 'kibana'],
        privileges: {
          all: {
            savedObject: {
              all: ['action', 'action_task_params'],
              read: [],
            },
            ui: [],
            api: ['actions-read', 'actions-all'],
          },
          read: {
            savedObject: {
              all: ['action_task_params'],
              read: ['action'],
            },
            ui: [],
            api: ['actions-read'],
          },
        },
      });

      initSlack(server, getExternalServiceSimulatorPath(ExternalServiceSimulator.SLACK));
      initWebhook(server, getExternalServiceSimulatorPath(ExternalServiceSimulator.WEBHOOK));
      initPagerduty(server, getExternalServiceSimulatorPath(ExternalServiceSimulator.PAGERDUTY));
    },
  });
}
