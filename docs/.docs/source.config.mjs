// source.config.ts
import {
  defineConfig,
  defineDocs
} from "@hanzo/mdx/config";
import rehypePrettyCode from "rehype-pretty-code";
var source_config_default = defineConfig({
  mdxOptions: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: {
            dark: "github-dark",
            light: "github-light"
          },
          keepBackground: false,
          defaultLang: "solidity"
        }
      ]
    ]
  }
});
var docs = defineDocs({
  dir: "../LPs"
});
export {
  source_config_default as default,
  docs
};
