import PostEditor from "../_components/PostEditor";

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  return <PostEditor postId={params.id} />;
}
