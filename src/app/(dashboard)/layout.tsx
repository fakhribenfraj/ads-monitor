import { AppLayout } from "@/components/AppLayout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <div className="container mx-auto px-4">{children}</div>
    </AppLayout>
  );
}
