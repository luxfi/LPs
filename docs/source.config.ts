import {
  defineConfig,
  defineDocs,
} from "fumadocs-mdx/config"
import rehypePrettyCode from "rehype-pretty-code"

export default defineConfig({
  mdxOptions: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: {
            dark: "one-dark-pro",
            light: "github-light",
          },
          keepBackground: false,
          defaultLang: "solidity",
        },
      ],
    ],
  },
})

export const docs = defineDocs({
  dir: "../LPs",
})
