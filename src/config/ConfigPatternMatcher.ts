/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {ConfigurationError} from '../HazelcastError';

export class ConfigPatternMatcher {

    /**
     *
     * @param configPatterns
     * @param itemName
     * @throws
     * @returns `null` if there is no matching pattern
     *          the best matching pattern otherwis
     */
    matches(configPatterns: string[], itemName: string): string {
        let bestMatchingPoint = -1;
        let matchingPattern: string = null;
        let duplicatePattern: string = null;
        configPatterns.forEach((pattern: string) => {
            const currentPoint = this.getMatchingPoint(pattern, itemName);
            if (currentPoint > bestMatchingPoint) {
                bestMatchingPoint = currentPoint;
                matchingPattern = pattern;
                duplicatePattern = null;
            } else if (currentPoint === bestMatchingPoint && matchingPattern != null) {
                duplicatePattern = matchingPattern;
                matchingPattern = pattern;
            }
        });
        if (duplicatePattern != null) {
            throw new ConfigurationError('Found ambiguous configurations for item ' + itemName + ': "' + matchingPattern +
                '" vs "' + duplicatePattern + '". Please specify your configuration.');
        }
        return matchingPattern;
    }

    getMatchingPoint(pattern: string, itemName: string): number {
        const index = pattern.indexOf('*');
        if (index === -1) {
            return -1;
        }
        const firstPart = pattern.substring(0, index);
        if (!itemName.startsWith(firstPart)) {
            return -1;
        }
        const secondPart = pattern.substring(index + 1);
        if (!itemName.endsWith(secondPart)) {
            return -1;
        }
        return firstPart.length + secondPart.length;
    }
}
