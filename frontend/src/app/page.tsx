import Link from "next/link";

export default function HomePage() {
  return (
    <div className="h-screen flex items-center justify-center">
      <Link href="/login" className="bg-black text-white px-6 py-3 rounded-lg">
        Login
      </Link>
    </div>
  );
}
