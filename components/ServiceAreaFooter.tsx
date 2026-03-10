import type { ServiceAreaLink } from "@/lib/types";
import { siteConfig } from "@/lib/site-config";

/**
 * Service Area Geo-Link Footer — geographic anchor consistency component.
 *
 * Renders hyper-local anchor text links at the bottom of each blog post.
 * Each link pairs a service keyword with a specific neighborhood or city,
 * creating a "geographic silhouette" that reinforces local relevance.
 *
 * Example: "Roof Repair in Muncie's Near Northside"
 *
 * The links point to the relevant service page on the main site,
 * building topical + geographic authority for the parent domain.
 */

interface ServiceAreaFooterProps {
  /** Array of geo-anchor links from the post frontmatter */
  links: ServiceAreaLink[];
}

export default function ServiceAreaFooter({ links }: ServiceAreaFooterProps) {
  if (!links || links.length === 0) return null;

  return (
    <section className="service-area-footer mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-xl font-bold text-brand-dark mb-4">
        Serving Muncie &amp; Surrounding Communities
      </h3>
      <p className="text-sm text-brand-dark-secondary mb-4">
        {siteConfig.name} proudly serves homeowners across{" "}
        {siteConfig.address.city} and East Central Indiana. Find our services
        near you:
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            className="inline-block text-sm bg-gray-100 hover:bg-brand-orange-light text-brand-dark-secondary hover:text-brand-orange px-3 py-1.5 rounded-full transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400">
        📍 {siteConfig.address.street}, {siteConfig.address.city},{" "}
        {siteConfig.address.state} {siteConfig.address.zip} |{" "}
        <a
          href={`tel:${siteConfig.phoneFormatted.replace(/\D/g, "")}`}
          className="text-brand-orange hover:underline"
        >
          {siteConfig.phone}
        </a>
      </p>
    </section>
  );
}
