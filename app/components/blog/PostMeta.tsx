interface PostMetaProps {
  authorName: string;
  authorImageUrl: string | null;
  readingMinutes: number;
  size?: "sm" | "md";
}

export default function PostMeta({ authorName, authorImageUrl, readingMinutes, size = "sm" }: PostMetaProps) {
  const avatar = size === "md" ? "h-10 w-10" : "h-7 w-7";

  return (
    <div className={`flex items-center gap-2.5 ${size === "md" ? "text-sm" : "text-xs"} text-gray-500`}>
      {authorImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={authorImageUrl} alt="" className={`${avatar} rounded-full object-cover ring-2 ring-white`} />
      ) : (
        <span
          className={`${avatar} flex items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-800`}
          aria-hidden="true"
        >
          {authorName.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="font-medium text-gray-900">{authorName}</span>
      <span aria-hidden="true" className="text-gray-300">
        •
      </span>
      <span>{readingMinutes} min read</span>
    </div>
  );
}
