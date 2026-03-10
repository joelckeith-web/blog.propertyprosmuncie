import { getAllPosts } from "@/lib/blog";
import BlogCard from "@/components/BlogCard";
import { BreadcrumbSchema } from "@/components/SchemaMarkup";
import { siteConfig } from "@/lib/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Home Improvement Blog | ${siteConfig.name}`,
  description: `Expert tips on roofing, siding, gutters, fencing, and home remodeling in Muncie, IN. Weather-informed advice from ${siteConfig.name}.`,
};

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Blog", url: siteConfig.blogUrl },
        ]}
      />

      {/* Hero section */}
      <section className="bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Muncie Home Improvement Blog
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Expert advice on protecting and improving your home — powered by
              real local weather data for{" "}
              {siteConfig.address.city},{" "}
              {siteConfig.address.state} and surrounding areas.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.values(siteConfig.services).map((service) => (
                <a
                  key={service.url}
                  href={service.url}
                  className="text-sm bg-white/10 hover:bg-brand-orange px-3 py-1.5 rounded-full transition-colors"
                >
                  {service.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog posts grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-brand-dark mb-2">
              Blog Coming Soon
            </h2>
            <p className="text-brand-dark-secondary max-w-md mx-auto">
              We&apos;re preparing expert home improvement content for Muncie
              homeowners. Check back soon for weather-informed tips and guides.
            </p>
            <a
              href={siteConfig.pages.contact}
              className="inline-block mt-6 btn-primary"
            >
              Contact Us Today
            </a>
          </div>
        )}
      </section>

      {/* CTA section */}
      <section className="bg-brand-orange-light">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-brand-dark mb-3">
            Need Help With Your Home?
          </h2>
          <p className="text-brand-dark-secondary mb-6 max-w-2xl mx-auto">
            From storm damage repairs to complete home renovations,{" "}
            {siteConfig.name} is your trusted local contractor in{" "}
            {siteConfig.address.city}, {siteConfig.address.state}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={siteConfig.pages.contact} className="btn-primary">
              Get a Free Estimate
            </a>
            <a
              href={`tel:${siteConfig.phoneFormatted.replace(/\D/g, "")}`}
              className="btn-secondary"
            >
              Call {siteConfig.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
