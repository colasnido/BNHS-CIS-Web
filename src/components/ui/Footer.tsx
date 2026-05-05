import Link from "next/link";
import Image from "next/image";
import { NAV_LINKS, ROUTES } from "@/constants/routes";
import { Container } from "@/components/ui/Container";
import logoAsset from "./logo.png";

const LOGO_SRC = logoAsset;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <Container>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          {/* Brand & description */}
          <div className="lg:col-span-5">
            <Link
              href={ROUTES.HOME}
              className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8a85c]"
            >
              <Image
                src={LOGO_SRC}
                alt="BNHS"
                width={36}
                height={36}
                className="h-9 w-9 rounded-sm"
              />
              <span className="font-serif text-base font-semibold text-white">
                Badiang National High School
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              A public secondary school under the Department of Education,
              committed to excellence in education and character formation since
              1969.
            </p>
          </div>

          {/* Sitemap */}
          <nav className="lg:col-span-3" aria-label="Footer sitemap">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Explore
            </h3>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            <address className="mt-4 space-y-2 text-sm not-italic text-slate-400">
              <p>Anda Pronicial Road Purok 3, Barangay Badiang</p>
              <p>Region VII, Philippines</p>
              <p className="pt-2">
                <a
                  href="tel:+6300000000"
                  className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
                >
                  +63 (000) 000-0000
                </a>
              </p>
              <p>
                <a
                  href="mailto:info@bnhs.edu.ph"
                  className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
                >
                  info@bnhs.edu.ph
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="border-t border-slate-800 py-6">
          <p className="text-center text-xs text-slate-500">
            © {year} Badiang National High School. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
