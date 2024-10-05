import { client } from "./sanity";

export async function getAllPosts() {
  try {
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
      previewText,
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

    console.log("Fetched posts:", JSON.stringify(posts, null, 2));
    console.log("Number of posts:", posts.length);
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
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
    { slug },
  );
  return post;
}
