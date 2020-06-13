/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';

import { TemplateDeserialized } from '../../../../common';
import { serializeLegacyTemplate } from '../../../../common/lib';
import { RouteDependencies } from '../../../types';
import { addBasePath } from '../index';
import { templateSchema } from './validate_schemas';

const bodySchema = templateSchema;

export function registerCreateRoute({ router, license, lib }: RouteDependencies) {
  router.post(
    { path: addBasePath('/index_templates'), validate: { body: bodySchema } },
    license.guardApiRoute(async (ctx, req, res) => {
      const { callAsCurrentUser } = ctx.core.elasticsearch.legacy.client;
      const template = req.body as TemplateDeserialized;
      const {
        _kbnMeta: { isLegacy },
      } = template;

      if (!isLegacy) {
        return res.badRequest({ body: 'Only legacy index templates can be created.' });
      }

      const serializedTemplate = serializeLegacyTemplate(template);
      const { order, index_patterns, version, settings, mappings, aliases } = serializedTemplate;

      // Check that template with the same name doesn't already exist
      const templateExists = await callAsCurrentUser('indices.existsTemplate', {
        name: template.name,
      });

      if (templateExists) {
        return res.conflict({
          body: new Error(
            i18n.translate('xpack.idxMgmt.createRoute.duplicateTemplateIdErrorMessage', {
              defaultMessage: "There is already a template with name '{name}'.",
              values: {
                name: template.name,
              },
            })
          ),
        });
      }

      try {
        // Otherwise create new index template
        const response = await callAsCurrentUser('indices.putTemplate', {
          name: template.name,
          order,
          body: {
            index_patterns,
            version,
            settings,
            mappings,
            aliases,
          },
        });

        return res.ok({ body: response });
      } catch (e) {
        if (lib.isEsError(e)) {
          return res.customError({
            statusCode: e.statusCode,
            body: e,
          });
        }
        // Case: default
        return res.internalError({ body: e });
      }
    })
  );
}
