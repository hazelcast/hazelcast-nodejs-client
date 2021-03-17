/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** @ignore *//** */

import {IndexConfig, InternalIndexConfig} from '../config/IndexConfig';
import {IndexType} from '../config/IndexType';
import {UniqueKeyTransformation, InternalBitmapIndexOptions} from '../config/BitmapIndexOptions';
import {tryGetEnum} from '../util/Util';

/**
 * Maximum number of attributes allowed in the index.
 */
const MAX_ATTRIBUTES = 255;

/**
 * Pattern to stripe away "this." prefix.
 */
const THIS_PATTERN = new RegExp('^this\\.');

/** @internal */
export class IndexUtil {

    /**
     * Validates provided index config and normalizes its name and attribute names.
     *
     * @param mapName Name of the map
     * @param config User-provided index config.
     * @return Normalized index config.
     * @throws TypeError If index configuration is invalid.
     */
    static validateAndNormalize(mapName: string, config: IndexConfig): InternalIndexConfig {
        // Validate attributes
        const originalAttributeNames = config.attributes;

        if (originalAttributeNames.length === 0) {
            throw new TypeError('Index must have at least one attribute: ' + config);
        }

        if (originalAttributeNames.length > MAX_ATTRIBUTES) {
            throw new TypeError('Index cannot have more than ' + MAX_ATTRIBUTES + ' attributes: ' + config);
        }

        let type = InternalIndexConfig.DEFAULT_TYPE;
        if (config.type) {
            type = tryGetEnum(IndexType, config.type);
        }
        if (type === IndexType.BITMAP && originalAttributeNames.length > 1) {
            throw new TypeError('Composite bitmap indexes are not supported: ' + config);
        }

        const normalizedAttributeNames = new Array<string>(originalAttributeNames.length);
        for (let i = 0; i < originalAttributeNames.length; i++) {
            let originalAttributeName = originalAttributeNames[i];
            this.validateAttribute(config.name, originalAttributeName);

            originalAttributeName = originalAttributeName.trim();
            const normalizedAttributeName = this.canonicalizeAttribute(originalAttributeName);

            const existingIdx = normalizedAttributeNames.indexOf(normalizedAttributeName);

            if (existingIdx !== -1) {
                const duplicateOriginalAttributeName = originalAttributeNames[existingIdx];

                if (duplicateOriginalAttributeName === originalAttributeName) {
                    throw new TypeError('Duplicate attribute name [attributeName= '
                        + originalAttributeName + ', indexConfig=' + config + ']');
                } else {
                    throw new TypeError('Duplicate attribute names [attributeName1='
                        + duplicateOriginalAttributeName + ', attributeName2='
                        + originalAttributeName + ', indexConfig=' + config + ']');
                }
            }

            normalizedAttributeNames[i] = normalizedAttributeName;
        }

        // Construct final index
        let name = config.name;
        if (name != null && name.trim().length === 0) {
            name = null;
        }

        const normalizedConfig = this.buildNormalizedConfig(mapName, type, name, normalizedAttributeNames);
        if (type === IndexType.BITMAP) {
            let uniqueKey = config.bitmapIndexOptions.uniqueKey;

            this.validateAttribute(config.name, uniqueKey);
            uniqueKey = this.canonicalizeAttribute(uniqueKey);

            normalizedConfig.bitmapIndexOptions.uniqueKey = uniqueKey;
            normalizedConfig.bitmapIndexOptions.uniqueKeyTransformation =
                tryGetEnum(UniqueKeyTransformation, config.bitmapIndexOptions.uniqueKeyTransformation);
        }
        return normalizedConfig;
    }

    /**
     * Validate attribute name.
     *
     * @param config Index config.
     * @param attributeName Attribute name.
     */
    static validateAttribute(indexName: string, attributeName: string): void {
        if (attributeName == null) {
            throw new TypeError('Attribute name cannot be null: ' + indexName);
        }
        const attributeName0 = attributeName.trim();
        if (attributeName0.length === 0) {
            throw new TypeError('Attribute name cannot be empty: ' + indexName);
        }
        if (attributeName0.endsWith('.')) {
            throw new TypeError('Attribute name cannot end with dot [config= ' + indexName
                + ', attribute=' + attributeName + ']');
        }
    }

    /**
     * Produces canonical attribute representation by stripping an unnecessary
     * "this." qualifier from the passed attribute, if any.
     *
     * @param attribute the attribute to canonicalize.
     * @return the canonical attribute representation.
     */
    static canonicalizeAttribute(attribute: string): string {
        return attribute.replace(THIS_PATTERN, '');
    }

    private static buildNormalizedConfig(mapName: string,
                                         indexType: IndexType,
                                         indexName: string,
                                         normalizedAttributeNames: string[]): InternalIndexConfig {
        const newConfig = new InternalIndexConfig();
        newConfig.bitmapIndexOptions = new InternalBitmapIndexOptions();
        newConfig.type = indexType;

        let name = indexName == null ? mapName + '_' + this.indexTypeToName(indexType) : null;
        for (const normalizedAttributeName of normalizedAttributeNames) {
            this.validateAttribute(indexName, normalizedAttributeName)
            newConfig.attributes.push(normalizedAttributeName);
            if (name != null) {
                name += '_' + normalizedAttributeName;
            }
        }

        if (name != null) {
            indexName = name;
        }

        newConfig.name = indexName;

        return newConfig;
    }

    private static indexTypeToName(indexType: IndexType): string {
        switch (indexType) {
            case IndexType.SORTED:
                return 'sorted';
            case IndexType.HASH:
                return 'hash';
            case IndexType.BITMAP:
                return 'bitmap';
            default:
                throw new TypeError('Unsupported index type: ' + indexType);
        }
    }

}
