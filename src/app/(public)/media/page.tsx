import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Media",
};

export default function MediaPage() {
  return (
    <>
      <Container>
        <PageHeader
          title="Media"
          description="Photos and videos capturing life at Badiang National High School."
        />
      </Container>
      <Container>
        <div className="py-12">
          <p className="text-slate-600">Media gallery coming soon.</p>
        </div>
      </Container>
    </>
  );
}
