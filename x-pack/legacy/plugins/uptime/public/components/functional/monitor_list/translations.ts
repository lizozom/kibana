/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';

export const STATUS_COLUMN_LABEL = i18n.translate('xpack.uptime.monitorList.statusColumnLabel', {
  defaultMessage: 'Status',
});

export const NAME_COLUMN_LABEL = i18n.translate('xpack.uptime.monitorList.nameColumnLabel', {
  defaultMessage: 'Name',
});

export const HISTORY_COLUMN_LABEL = i18n.translate(
  'xpack.uptime.monitorList.monitorHistoryColumnLabel',
  {
    defaultMessage: 'Downtime history',
  }
);

export const getExpandDrawerLabel = (id: string) => {
  return i18n.translate('xpack.uptime.monitorList.expandDrawerButton.ariaLabel', {
    defaultMessage: 'Expand row for monitor with ID {id}',
    description: 'The user can click a button on this table and expand further details.',
    values: {
      id,
    },
  });
};

export const getDescriptionLabel = (itemsLength: number) => {
  return i18n.translate('xpack.uptime.monitorList.table.description', {
    defaultMessage:
      'Monitor Status table with columns for Status, Name, URL, IP, Downtime History and Integrations. The table is currently displaying {length} items.',
    values: { length: itemsLength },
  });
};

export const NO_MONITOR_ITEM_SELECTED = i18n.translate(
  'xpack.uptime.monitorList.noItemForSelectedFiltersMessage',
  {
    defaultMessage: 'No monitors found for selected filter criteria',
    description:
      'This message is show if there are no monitors in the table and some filter or search criteria exists',
  }
);

export const NO_DATA_MESSAGE = i18n.translate('xpack.uptime.monitorList.noItemMessage', {
  defaultMessage: 'No uptime monitors found',
  description: 'This message is shown if the monitors table is rendered but has no items.',
});
