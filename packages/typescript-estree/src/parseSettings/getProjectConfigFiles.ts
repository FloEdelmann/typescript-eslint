import debug from 'debug';
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { TSESTreeOptions } from '../parser-options';
import type { ParseSettings } from './index';

const log = debug(
  'typescript-eslint:typescript-estree:parseSettings:getProjectConfigFiles',
);

/**
 * Checks for a matching TSConfig to a file including its parent directories,
 * permanently caching results under each directory it checks.
 *
 * @remarks
 * We don't (yet!) have a way to attach file watchers on disk, but still need to
 * cache file checks for rapid subsequent calls to fs.existsSync. See discussion
 * in https://github.com/typescript-eslint/typescript-eslint/issues/101.
 */
export function getProjectConfigFiles(
  parseSettings: Pick<
    ParseSettings,
    'filePath' | 'tsconfigMatchCache' | 'tsconfigRootDir'
  >,
  project: TSESTreeOptions['project'],
): string[] | null {
  if (project !== true) {
    if (project == null || project === false) {
      return null;
    }
    if (Array.isArray(project)) {
      return project;
    }
    return [project];
  }

  log('Looking for tsconfig.json at or above file: %s', parseSettings.filePath);
  let directory = path.dirname(parseSettings.filePath);
  const checkedDirectories = [directory];

  do {
    log('Checking tsconfig.json path: %s', directory);
    const tsconfigPath = path.join(directory, 'tsconfig.json');
    const cached =
      parseSettings.tsconfigMatchCache.get(directory) ??
      (fs.existsSync(tsconfigPath) && tsconfigPath);

    if (cached) {
      for (const directory of checkedDirectories) {
        parseSettings.tsconfigMatchCache.set(directory, cached);
      }
      return [cached];
    }

    directory = path.dirname(directory);
    checkedDirectories.push(directory);
  } while (
    directory.length > 1 &&
    directory.length >= parseSettings.tsconfigRootDir.length
  );

  throw new Error(
    `project was set to \`true\` but couldn't find any tsconfig.json relative to '${parseSettings.filePath}' within '${parseSettings.tsconfigRootDir}'.`,
  );
}
