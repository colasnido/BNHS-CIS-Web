import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <>
      <Container>
        <PageHeader
          title="About"
          description="Our mission, history, and what makes Badiang National High School special."
        />
      </Container>
      <Container>
        <div className="py-12">
          <p className="text-slate-600">About content coming soon.</p>
        </div>
      </Container>
    </>
  );
}
