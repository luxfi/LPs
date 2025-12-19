// @ts-nocheck
import { dynamic } from '@hanzo/docs/mdx/runtime/dynamic';
import * as Config from '../source.config';

const create = await dynamic<typeof Config, import("@hanzo/mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>(Config, {"configPath":"source.config.ts","environment":"next","outDir":".docs"}, {"doc":{"passthroughs":["extractedReferences"]}});