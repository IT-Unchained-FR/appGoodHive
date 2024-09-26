import client from "./sanity";

export async function getAllPosts() {
  const posts = await client.fetch(`*[_type == "post"]{
  title,
  _id,
  slug,
  mainImage {
      asset->{
        _id,
        url
      }
    },
  categories,
  publishedAt,
  body,
  author -> {
    name,
    image {
      asset->{
        _id,
        url
      }
    },
    bio
  }
}`);
  return posts;
}
