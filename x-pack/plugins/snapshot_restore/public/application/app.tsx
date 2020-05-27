/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { EuiPageContent } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';

import { APP_REQUIRED_CLUSTER_PRIVILEGES } from '../../common';
import {
  useAuthorizationContext,
  SectionError,
  WithPrivileges,
  NotAuthorizedSection,
} from '../shared_imports';
import { SectionLoading } from './components';
import { BASE_PATH, DEFAULT_SECTION, Section } from './constants';
import {
  RepositoryAdd,
  RepositoryEdit,
  RestoreSnapshot,
  SnapshotRestoreHome,
  PolicyAdd,
  PolicyEdit,
} from './sections';
import { useConfig } from './app_context';

export const App: React.FunctionComponent = () => {
  const { slm_ui: slmUi } = useConfig();
  const { apiError } = useAuthorizationContext();

  const sections: Section[] = ['repositories', 'snapshots', 'restore_status'];

  if (slmUi.enabled) {
    sections.push('policies' as Section);
  }

  const sectionsRegex = sections.join('|');

  return apiError ? (
    <SectionError
      title={
        <FormattedMessage
          id="xpack.snapshotRestore.app.checkingPrivilegesErrorMessage"
          defaultMessage="Error fetching user privileges from the server."
        />
      }
      error={apiError}
    />
  ) : (
    <WithPrivileges privileges={APP_REQUIRED_CLUSTER_PRIVILEGES.map((name) => `cluster.${name}`)}>
      {({ isLoading, hasPrivileges, privilegesMissing }) =>
        isLoading ? (
          <SectionLoading>
            <FormattedMessage
              id="xpack.snapshotRestore.app.checkingPrivilegesDescription"
              defaultMessage="Checking privileges…"
            />
          </SectionLoading>
        ) : hasPrivileges ? (
          <div data-test-subj="snapshotRestoreApp">
            <Switch>
              <Route exact path={`${BASE_PATH}/add_repository`} component={RepositoryAdd} />
              <Route
                exact
                path={`${BASE_PATH}/edit_repository/:name*`}
                component={RepositoryEdit}
              />
              <Route
                exact
                path={`${BASE_PATH}/:section(${sectionsRegex})/:repositoryName?/:snapshotId*`}
                component={SnapshotRestoreHome}
              />
              <Redirect
                exact
                from={`${BASE_PATH}/restore/:repositoryName`}
                to={`${BASE_PATH}/snapshots`}
              />
              <Route
                exact
                path={`${BASE_PATH}/restore/:repositoryName/:snapshotId*`}
                component={RestoreSnapshot}
              />
              {slmUi.enabled && (
                <Route exact path={`${BASE_PATH}/add_policy`} component={PolicyAdd} />
              )}
              {slmUi.enabled && (
                <Route exact path={`${BASE_PATH}/edit_policy/:name*`} component={PolicyEdit} />
              )}
              <Redirect from={`${BASE_PATH}`} to={`${BASE_PATH}/${DEFAULT_SECTION}`} />
            </Switch>
          </div>
        ) : (
          <EuiPageContent>
            <NotAuthorizedSection
              title={
                <FormattedMessage
                  id="xpack.snapshotRestore.app.deniedPrivilegeTitle"
                  defaultMessage="You're missing cluster privileges"
                />
              }
              message={
                <FormattedMessage
                  id="xpack.snapshotRestore.app.deniedPrivilegeDescription"
                  defaultMessage="To use Snapshot and Restore, you must have {privilegesCount,
                    plural, one {this cluster privilege} other {these cluster privileges}}: {missingPrivileges}."
                  values={{
                    missingPrivileges: privilegesMissing.cluster!.join(', '),
                    privilegesCount: privilegesMissing.cluster!.length,
                  }}
                />
              }
            />
          </EuiPageContent>
        )
      }
    </WithPrivileges>
  );
};
