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
            dark: "vitesse-black",
            light: "vitesse-light",
          },
          keepBackground: true,
          defaultLang: "solidity",
        },
      ],
    ],
  },
})

export const docs = defineDocs({
  dir: "../LPs",
})
