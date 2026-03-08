import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Terms = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1 pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-3xl mx-auto prose prose-neutral">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground">
          These terms govern your use of the CampaignSync platform.
          Full terms of service will be published before public launch.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
