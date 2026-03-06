import { AppLayout } from "@/components/AppLayout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">{children}</div>
      </main>
    </AppLayout>
  );
}
