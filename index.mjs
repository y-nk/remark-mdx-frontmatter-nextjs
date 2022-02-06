import { parse as parseAst } from "acorn";
import { load as parseYaml } from "js-yaml";
import { parse as parseToml } from "toml";

// stolen from remcohaszing/remark-mdx-frontmatter
const getValue = (node) => {
  const { type, value } = node;

  if (type === "yaml") {
    return parseYaml(value);
  } else if (node.type === "toml") {
    return parseToml(value);
  }
};

// the idea is to trust the people not to be stupid about it.

// another possible returned value could be:
// `MDXContent.frontmatterData = ${JSON.stringify(data)}`
const defaultRenderer = (data, node) => {
  return `
    export const getStaticProps = async () => {
      return { props: ${JSON.stringify(data)} }
    }
  `;
};

// eslint-disable-next-line import/no-anonymous-default-export
export default (renderer = defaultRenderer) =>
  (ast) => {
    const metadata = [];

    ast.children = ast.children.map((node) => {
      const data = getValue(node);
      if (!data) return node;

      // we help the common mogul not to deal with ast.
      // let them create a valid stringified javascript
      // representation of what they want, and inject
      // back the correctly parsed tree into the ast
      const renderedString = renderer(data, node);
      const { body } = parseAst(renderedString, { sourceType: "module" });

      return {
        type: "mdxjsEsm",
        data: {
          estree: {
            type: "Program",
            sourceType: "module",
            body,
          },
        },
      };
    });
  };
