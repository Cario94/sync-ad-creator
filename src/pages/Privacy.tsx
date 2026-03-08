import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Privacy = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1 pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-3xl mx-auto prose prose-neutral">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground">
          This privacy policy describes how CampaignSync collects, uses, and protects your personal information.
          A full privacy policy will be published before public launch.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
