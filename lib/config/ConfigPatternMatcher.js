"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigPatternMatcher = void 0;
/** @internal */
class ConfigPatternMatcher {
    /**
     *
     * @param configPatterns
     * @param itemName
     * @throws TypeError when config patterns create ambiguity for the config item
     * @returns `null` if there is no matching pattern;
     *          the best matching pattern otherwise
     */
    matches(configPatterns, itemName) {
        let bestMatchingPoint = -1;
        let matchingPattern = null;
        let duplicatePattern = null;
        configPatterns.forEach((pattern) => {
            const currentPoint = this.getMatchingPoint(pattern, itemName);
            if (currentPoint > bestMatchingPoint) {
                bestMatchingPoint = currentPoint;
                matchingPattern = pattern;
                duplicatePattern = null;
            }
            else if (currentPoint === bestMatchingPoint && matchingPattern != null) {
                duplicatePattern = matchingPattern;
                matchingPattern = pattern;
            }
        });
        if (duplicatePattern != null) {
            throw new TypeError('Found ambiguous configurations for item ' + itemName + ': "' + matchingPattern +
                '" vs "' + duplicatePattern + '". Please specify your configuration.');
        }
        return matchingPattern;
    }
    getMatchingPoint(pattern, itemName) {
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
exports.ConfigPatternMatcher = ConfigPatternMatcher;
//# sourceMappingURL=ConfigPatternMatcher.js.map