/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

// eslint-disable-next-line max-classes-per-file
import { FIELD_ORIGIN } from '../../../../../../common/constants';
import { StyleMeta } from '../../style_meta';
import {
  CategoryFieldMeta,
  GeometryTypes,
  RangeFieldMeta,
  StyleMetaDescriptor,
} from '../../../../../../common/descriptor_types';
import { AbstractField, IField } from '../../../../fields/field';

class MockField extends AbstractField {
  async getLabel(): Promise<string> {
    return this.getName() + '_label';
  }
  supportsFieldMeta(): boolean {
    return true;
  }
}

export const mockField: IField = new MockField({
  fieldName: 'foobar',
  origin: FIELD_ORIGIN.SOURCE,
});

class MockStyle {
  getStyleMeta(): StyleMeta {
    const geomTypes: GeometryTypes = {
      isPointsOnly: false,
      isLinesOnly: false,
      isPolygonsOnly: false,
    };
    const rangeFieldMeta: RangeFieldMeta = { min: 0, max: 100, delta: 100 };
    const catFieldMeta: CategoryFieldMeta = {
      categories: [
        {
          key: 'US',
          count: 10,
        },
        {
          key: 'CN',
          count: 8,
        },
      ],
    };

    const styleMetaDescriptor: StyleMetaDescriptor = {
      geometryTypes: geomTypes,
      fieldMeta: {
        foobar: {
          range: rangeFieldMeta,
          categories: catFieldMeta,
        },
      },
    };

    return new StyleMeta(styleMetaDescriptor);
  }
}

export class MockLayer {
  getStyle() {
    return new MockStyle();
  }

  getDataRequest() {
    return null;
  }
}
