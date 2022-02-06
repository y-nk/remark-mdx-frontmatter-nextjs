# remark-mdx-frontmatter-nextjs

## What is it?

Yet another plugin to parse frontmatter data and expose it to the crowd. I know there's a much more popular [remark-mdx-frontmatter](https://github.com/remcohaszing/remark-mdx-frontmatter) out there, but i couldn't make it do what I wanted. I'm preparing a PR on the side and hopefully this package will be soon archived.

## How to use it?

1. `npm i -S remark-mdx-frontmatter-nextjs`

2. In your `next.config.mjs`, add:

  ```js
  import withMdx from "@next/mdx";
  import remarkFrontmatter from "remark-frontmatter";
  import remarkMdxFrontmatter from "remark-mdx-frontmatter-nextjs";

  const confMdx = withMdx({
    extension: /\.mdx$/,
    options: {
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
      ],
      rehypePlugins: [],
    },
  });

  export default confMdx({
    pageExtensions: ["mdx"],
  });
  ```

3. By default, the frontmatter metadata will be passed in `pageProps`, so that you can catch them in `_app` and use `next/head` directly there. Here's my own, in case you want some boilerplate

  ```tsx
  import '../styles/globals.css'

  // https://stackoverflow.com/a/67464299/335243
  import type { AppProps as NextAppProps } from "next/app";

  import Head from 'next/head'

  type AppProps<P = any> = {
    pageProps: P;
  } & Omit<NextAppProps<P>, "pageProps">;

  // from MDX
  type PageMeta = {
    title?: string;
    description?: string;
    timestamp?: number;
    tags?: string[];
    layout?: boolean;
  };

  const AUTHOR = 'Julien Barbay'
  const HANDLE = '@y_nk'

  export default function App({ Component, router, pageProps }: AppProps<PageMeta>) {
    const { pathname } = router;
    const { title, description, tags, timestamp } = pageProps;

    return (
      <>
        <Head>
          <title>{title}</title>
          <meta name="author" content={AUTHOR} />
          <meta name="description" content={description} />
          {tags && <meta name="keywords" content={tags.join(",")} />}

          <meta name="twitter:creator" content={HANDLE} />
          <meta name="twitter:card" content="summary" />

          <meta property="article:author" content={AUTHOR} />
          <meta property="article:published_time" content={`${timestamp}`} />

          <meta property="og:title" content={title} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={pathname} />
          <meta property="og:description" content={description} />
        </Head>

        <Component {...pageProps} />
      </>
    );
  }
  ```

## Customisation

The plugin allows ONE option to help inject your frontmatter object into your NextJS application. The default renderer is:

```js
const defaultRenderer = (data, node) => {
  return `
    export const getStaticProps = async () => {
      return { props: ${JSON.stringify(data)} }
    }
  `;
};
```

As you can guess, that's why the frontmatter data are coming back as `pageProps` in your `_app` now.

If you already use `getStaticProps` in your mdx it is obvious  that you'll have a problem of duplicate declaration, but there's a plan B: you can pass another renderer of your choice instead. A suitable example can be:

```js
const customRenderer = (data, node) => {
  return `MDXContent.frontmatterData = ${JSON.stringify(data)}`
};
```

And then in your app, you'll have to catch your data like this:

```js
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  const { frontmatterData } = Component

  return (
    <div>
      <Component {...pageProps} />
    </div>
  );
}
```

## More about the package

### Why another package?

I just arrived in the NextJS game and I wanted to make a simple blog with mdx support and use frontmatter data to decorate my pages with `next/head`, yet I didn't want to write an overly verbose header everytime I write a blog post. Layouts are supposed to be for that reason, right?

### The existing solutions

1. There's [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote) but it doesn't allow imports within your mdx file, which was a no-go for me.

2. There's [next-mdx-enhanced](https://github.com/hashicorp/next-mdx-enhanced) but the repo itself says you shouldn't use it because there's issue at scale (and it's way too opinionated anyway)

3. There's also [mdx-bundler](https://github.com/kentcdodds/mdx-bundler) but [after reading quick hands on, i got scared](https://hackernoon.com/how-to-use-mdx-bundler-with-nextjs) - the dependency to esbuild seems a bit overkill to what i wanted to achieve

4. The only other way to load mdx is to use `@next/mdx` but [there's no built-in support for frontmatter, you gotta use remark plugins for that](https://nextjs.org/docs/advanced-features/using-mdx#frontmatter). Just using the [remark-frontmatter](https://github.com/remarkjs/remark-frontmatter) will simply strip out the metadata from the page, but the values will be lost. Finally, there's [remark-mdx-frontmatter](https://github.com/remcohaszing/remark-mdx-frontmatter) but it does not allow to customise the exports smoothly enough to exploit them in NextJS.

I came to the conclusion that `remark-mdx-frontmatter` was too narrow to be useful, yet it was a perfect base for me to tinker (thank you).
