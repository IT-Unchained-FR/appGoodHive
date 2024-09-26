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

export async function getPostBySlug(slug: string) {
  const post = await client.fetch(
    `*[_type == "post" && slug.current == $slug]{
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
}[0]`,
    { slug }
  );
  return post;
}
