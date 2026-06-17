import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import AnnouncementBar from '@/components/store/AnnouncementBar';
import ScrollRevealInit from '@/components/store/ScrollRevealInit';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sl-theme min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="relative z-0 flex-1">{children}</main>
      <Footer />
      <ScrollRevealInit />
    </div>
  );
}
