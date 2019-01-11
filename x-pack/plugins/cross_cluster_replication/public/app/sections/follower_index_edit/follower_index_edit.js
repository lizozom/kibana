/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { injectI18n, FormattedMessage } from '@kbn/i18n/react';
import chrome from 'ui/chrome';
import { MANAGEMENT_BREADCRUMB } from 'ui/management';

import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiButton,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiOverlayMask,
  EuiConfirmModal,

} from '@elastic/eui';

import { listBreadcrumb, editBreadcrumb } from '../../services/breadcrumbs';
import routing from '../../services/routing';
import {
  FollowerIndexForm,
  FollowerIndexPageTitle,
  SectionLoading,
  SectionError,
} from '../../components';
import { API_STATUS } from '../../constants';

export const FollowerIndexEdit = injectI18n(
  class extends PureComponent {
    static propTypes = {
      getFollowerIndex: PropTypes.func.isRequired,
      selectFollowerIndex: PropTypes.func.isRequired,
      saveFollowerIndex: PropTypes.func.isRequired,
      clearApiError: PropTypes.func.isRequired,
      apiError: PropTypes.object.isRequired,
      apiStatus: PropTypes.object.isRequired,
      followerIndex: PropTypes.object,
      followerIndexId: PropTypes.string,
    }

    static getDerivedStateFromProps({ followerIndexId }, { lastFollowerIndexId }) {
      if (lastFollowerIndexId !== followerIndexId) {
        return { lastFollowerIndexId: followerIndexId };
      }
      return null;
    }

    state = {
      lastFollowerIndexId: undefined,
      showConfirmModal: false,
    }

    componentDidMount() {
      const { match: { params: { id } }, selectFollowerIndex } = this.props;
      const decodedId = decodeURIComponent(id);

      selectFollowerIndex(decodedId);

      chrome.breadcrumbs.set([ MANAGEMENT_BREADCRUMB, listBreadcrumb, editBreadcrumb ]);
    }

    componentDidUpdate(prevProps, prevState) {
      const { followerIndex, getFollowerIndex } = this.props;
      if (!followerIndex && prevState.lastFollowerIndexId !== this.state.lastFollowerIndexId) {
        // Fetch the auto-follow pattern on the server
        getFollowerIndex(this.state.lastFollowerIndexId);
      }
    }

    componentWillUnmount() {
      this.props.clearApiError();
    }

    saveFollowerIndex = (name, followerIndex) => {
      this.inflightPayload = { name, followerIndex };
      this.showConfirmModal();
    }

    showConfirmModal = () => this.setState({ showConfirmModal: true });

    closeConfirmModal = () => this.setState({ showConfirmModal: false });

    renderLoadingFollowerIndex() {
      return (
        <SectionLoading>
          <FormattedMessage
            id="xpack.crossClusterReplication.followerIndexEditForm.loadingFollowerIndexTitle"
            defaultMessage="Loading follower index..."
          />
        </SectionLoading>
      );
    }

    renderGetFollowerIndexError(error) {
      const { intl } = this.props;
      const title = intl.formatMessage({
        id: 'xpack.crossClusterReplication.followerIndexEditForm.loadingErrorTitle',
        defaultMessage: 'Error loading follower index',
      });

      return (
        <Fragment>
          <SectionError title={title} error={error} />
          <EuiSpacer />
          <EuiFlexGroup justifyContent="spaceAround">
            <EuiFlexItem grow={false}>
              <EuiButton
                {...routing.getRouterLinkProps('/follower_indices')}
                fill
                iconType="plusInCircle"
              >
                <FormattedMessage
                  id="xpack.crossClusterReplication.followerIndexEditForm.viewFollowerIndicesButtonLabel"
                  defaultMessage="View follower indices"
                />
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </Fragment>
      );
    }

    renderConfirmModal = () => {
      const { followerIndexId, intl } = this.props;
      const title = intl.formatMessage({
        id: 'xpack.crossClusterReplication.followerIndexEditForm.confirmModal.title',
        defaultMessage: 'Confirm update follower index \'{id}\'',
      }, { id: followerIndexId });

      const { name, followerIndex } = this.inflightPayload;

      return (
        <EuiOverlayMask>
          <EuiConfirmModal
            title={title}
            onCancel={this.closeConfirmModal}
            onConfirm={() => this.props.saveFollowerIndex(name, followerIndex)}
            cancelButtonText={
              intl.formatMessage({
                id: 'xpack.crossClusterReplication.followerIndexEditForm.confirmModal.cancelButtonText',
                defaultMessage: 'Cancel',
              })
            }
            buttonColor="danger"
            confirmButtonText={
              intl.formatMessage({
                id: 'xpack.crossClusterReplication.followerIndexEditForm.confirmModal.confirmButtonText',
                defaultMessage: 'Update',
              })
            }
          >
            <p>
              <FormattedMessage
                id="xpack.crossClusterReplication.followerIndexEditForm.confirmModal.description"
                defaultMessage="To update the follower index, it will first be paused and then resumed."
              />
            </p>
          </EuiConfirmModal>
        </EuiOverlayMask>
      );
    }

    render() {
      const {
        clearApiError,
        apiStatus,
        apiError,
        followerIndex,
      } = this.props;

      const { showConfirmModal } = this.state;

      /* remove non-editable properties */
      const { shards, ...rest } = followerIndex || {}; // eslint-disable-line no-unused-vars

      return (
        <EuiPage>
          <EuiPageBody>
            <EuiPageContent
              horizontalPosition="center"
              className="ccrPageContent"
            >
              <FollowerIndexPageTitle
                title={(
                  <FormattedMessage
                    id="xpack.crossClusterReplication.followerIndex.editTitle"
                    defaultMessage="Edit follower index"
                  />
                )}
              />

              {apiStatus.get === API_STATUS.LOADING && this.renderLoadingFollowerIndex()}

              {apiError.get && this.renderGetFollowerIndexError(apiError.get)}

              { followerIndex && (
                <FollowerIndexForm
                  followerIndex={rest}
                  apiStatus={apiStatus.save}
                  apiError={apiError.save}
                  saveFollowerIndex={this.saveFollowerIndex}
                  clearApiError={clearApiError}
                />
              ) }

              { showConfirmModal && this.renderConfirmModal() }
            </EuiPageContent>
          </EuiPageBody>
        </EuiPage>
      );
    }
  }
);
