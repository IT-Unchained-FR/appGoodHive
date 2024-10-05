// components/CustomPortableTextComponents.tsx
import Image from "next/legacy/image";
import Link from "next/link";
import urlBuilder from "@sanity/image-url";
import { getImageDimensions } from "@sanity/asset-utils";

// Import your Sanity project configuration
import { client } from "@/lib/sanity"; // Adjust this import based on where you've defined your Sanity client

export const CustomPortableTextComponents = {
  types: {
    image: ({ value }: any) => {
      const { width, height } = getImageDimensions(value);
      return (
        <div className="my-8 relative" style={{ aspectRatio: width / height }}>
          <Image
            src={urlBuilder(client).image(value).url()}
            alt={value.alt || " "}
            layout="fill"
            objectFit="contain"
            className="rounded-lg"
          />
          {value.caption && (
            <p className="text-center text-sm text-gray-500 mt-2">
              {value.caption}
            </p>
          )}
        </div>
      );
    },
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc pl-6 my-4">{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal pl-6 my-4">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => <li className="mb-2">{children}</li>,
    number: ({ children }: any) => <li className="mb-2">{children}</li>,
  },
  marks: {
    link: ({ children, value }: any) => {
      const rel = !value.href.startsWith("/")
        ? "noreferrer noopener"
        : undefined;
      return (
        <Link
          href={value.href}
          rel={rel}
          className="text-blue-500 hover:underline"
        >
          {children}
        </Link>
      );
    },
  },
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-semibold mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-semibold mt-6 mb-3">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-xl font-semibold mt-4 mb-2">{children}</h4>
    ),
    normal: ({ children }: any) => <p className="mb-4">{children}</p>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
        {children}
      </blockquote>
    ),
  },
};
