# haircraft-web

The HairCraft storefront, built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.

Right now it serves a single static **Coming soon** page while the NestJS backend and the Angular admin panel are being built.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server             |
| `npm run build` | Create a production build        |
| `npm start`     | Serve the production build       |
| `npm run lint`  | Run ESLint                       |

## Structure

- `src/app/coming-soon.tsx` is the coming-soon page, animated with Framer Motion. `page.tsx` renders it.
- `public/images/logo.png` is the trimmed brand logo (`Hair Craft.png` is the original).
- `src/app/layout.tsx` holds the fonts (Cormorant Garamond + Geist) and the metadata.
- `src/app/globals.css` holds the colour tokens: mint `#edf9e5`, deep green `#16362a` and gold.
- `src/app/icon.svg` is the favicon.
