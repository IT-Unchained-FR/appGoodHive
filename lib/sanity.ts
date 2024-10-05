import sanityClient from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const client = sanityClient({
  projectId: "bk6p174g",
  dataset: "production",
  apiVersion: "2021-03-25", // use a date that's compatible with your Sanity version
  useCdn: false, // `false` if you want to ensure fresh data
});

export const urlFor = (source: any) => imageUrlBuilder(client).image(source);
