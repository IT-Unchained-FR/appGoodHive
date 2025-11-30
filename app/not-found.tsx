export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">404 - Not Found</h2>
      <p className="text-gray-600">The page you're looking for doesn't exist.</p>
      <a href="/" className="mt-4 text-blue-600 hover:underline">
        Go back home
      </a>
    </div>
  );
}
