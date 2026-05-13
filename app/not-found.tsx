import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-6xl">🔍</p>
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground text-sm">요청하신 페이지가 존재하지 않습니다.</p>
      <Link
        href="/"
        className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        홈으로 이동
      </Link>
    </div>
  )
}
