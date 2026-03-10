"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <>
      {/* Top bar — phone + hours */}
      <div className="bg-brand-dark text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <span className="hidden sm:inline">{siteConfig.hours}</span>
          <a
            href={`tel:${siteConfig.phoneFormatted.replace(/\D/g, "")}`}
            className="font-semibold hover:text-brand-orange transition-colors"
          >
            📞 {siteConfig.phone}
          </a>
        </div>
      </div>

      {/* Main navigation */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo / Brand */}
            <Link
              href={siteConfig.url}
              className="flex items-center space-x-2 shrink-0"
            >
              <div className="w-10 h-10 bg-brand-orange rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xl">PP</span>
              </div>
              <div>
                <span className="text-brand-dark font-bold text-lg leading-tight block">
                  Property Pros
                </span>
                <span className="text-brand-dark-secondary text-xs leading-tight block">
                  Muncie, IN
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center space-x-1">
              <NavLink href={siteConfig.pages.home} label="Home" />
              <NavLink href={siteConfig.pages.about} label="About Us" />

              {/* Services dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
              >
                <a
                  href={siteConfig.pages.services}
                  className="px-3 py-2 text-brand-dark-secondary hover:text-brand-orange font-medium transition-colors inline-flex items-center"
                >
                  Services
                  <svg
                    className="ml-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </a>

                {servicesOpen && (
                  <div className="absolute top-full left-0 w-56 bg-white shadow-lg rounded-b-lg border-t-2 border-brand-orange py-2 z-50">
                    {Object.values(siteConfig.services).map((service) => (
                      <a
                        key={service.url}
                        href={service.url}
                        className="block px-4 py-2 text-sm text-brand-dark-secondary hover:bg-brand-orange-light hover:text-brand-orange transition-colors"
                      >
                        {service.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <NavLink href={siteConfig.pages.gallery} label="Gallery" />
              <NavLink
                href={siteConfig.pages.testimonials}
                label="Testimonials"
              />
              <NavLink href="/" label="Blog" isActive />
              <NavLink href={siteConfig.pages.contact} label="Contact" />

              <a
                href={siteConfig.pages.contact}
                className="ml-4 btn-primary text-sm"
              >
                Get a Free Estimate
              </a>
            </nav>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 text-brand-dark"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-2">
              <MobileLink href={siteConfig.pages.home} label="Home" />
              <MobileLink href={siteConfig.pages.about} label="About Us" />
              <MobileLink href={siteConfig.pages.services} label="Services" />
              {Object.values(siteConfig.services).map((service) => (
                <a
                  key={service.url}
                  href={service.url}
                  className="block pl-6 py-2 text-sm text-brand-dark-secondary hover:text-brand-orange"
                >
                  {service.label}
                </a>
              ))}
              <MobileLink href={siteConfig.pages.gallery} label="Gallery" />
              <MobileLink href={siteConfig.pages.testimonials} label="Testimonials" />
              <MobileLink href="/" label="Blog" isActive />
              <MobileLink href={siteConfig.pages.contact} label="Contact" />
              <a href={siteConfig.pages.contact} className="block mt-4 btn-primary text-center text-sm">
                Get a Free Estimate
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function NavLink({
  href,
  label,
  isActive = false,
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  const isExternal = href.startsWith("http");
  const className = `px-3 py-2 font-medium transition-colors ${
    isActive
      ? "text-brand-orange"
      : "text-brand-dark-secondary hover:text-brand-orange"
  }`;

  if (isExternal) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function MobileLink({
  href,
  label,
  isActive = false,
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  const className = `block py-2 font-medium ${
    isActive ? "text-brand-orange" : "text-brand-dark-secondary"
  }`;
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
