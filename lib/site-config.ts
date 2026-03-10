/**
 * Verified site configuration for Property Pros Muncie.
 * All data sourced directly from propertyprosmuncie.com — do NOT fabricate.
 */
export const siteConfig = {
  name: "Property Pros Muncie",
  legalName: "Property Pros",
  url: "https://www.propertyprosmuncie.com",
  blogUrl:
    process.env.NEXT_PUBLIC_SITE_URL || "https://blog.propertyprosmuncie.com",
  phone: "765-400-PROS",
  phoneFormatted: "(765) 400-7767",
  address: {
    street: "2560 W Kilgore Ave",
    city: "Muncie",
    state: "IN",
    zip: "47304",
  },
  hours: "Mon - Fri: 8:00 am - 5:00 pm",
  tagline: "Your dream home starts here",
  description:
    "Premier General Contractor in Muncie, IN — Licensed, Insured, Local",

  /**
   * Entity Bridge — sameAs array for LocalBusiness schema.
   * Links the blog subdomain back to the verified business entity.
   */
  sameAs: [
    "https://www.google.com/maps?cid=12767127311539766294",
    "https://www.facebook.com/PropertyProsMuncie",
    "https://www.linkedin.com/company/property-pros-muncie",
  ],

  /** Verified service areas from the website */
  serviceAreas: [
    "Muncie",
    "Anderson",
    "New Castle",
    "Hartford City",
    "Yorktown",
    "Daleville",
    "Albany",
    "Delaware County",
    "East Central Indiana",
  ],

  /**
   * Muncie neighborhoods / hyper-local areas for geo-anchor footer links.
   * Used by the Service Area Footer component for geographic silhouette SEO.
   */
  neighborhoods: [
    { name: "Near Northside", city: "Muncie" },
    { name: "Westside", city: "Muncie" },
    { name: "South Muncie", city: "Muncie" },
    { name: "Whitely", city: "Muncie" },
    { name: "Industry", city: "Muncie" },
    { name: "Normal City", city: "Muncie" },
    { name: "Shedtown", city: "Muncie" },
    { name: "Downtown Muncie", city: "Muncie" },
    { name: "Yorktown", city: "Yorktown" },
    { name: "Daleville", city: "Daleville" },
    { name: "Albany", city: "Albany" },
    { name: "Eaton", city: "Eaton" },
    { name: "Selma", city: "Selma" },
    { name: "Gaston", city: "Gaston" },
    { name: "Cowan", city: "Cowan" },
  ],

  /**
   * Verified service pages — URLs confirmed from site navigation.
   * Use ONLY these URLs for internal linking in blog posts.
   */
  services: {
    roofing: {
      label: "Roofing",
      url: "https://www.propertyprosmuncie.com/roofing/",
      subpages: {
        inspections:
          "https://www.propertyprosmuncie.com/roof-inspections/",
        repairs: "https://www.propertyprosmuncie.com/roof-repairs/",
        maintenance:
          "https://www.propertyprosmuncie.com/roof-maintenance-services/",
        replacement:
          "https://www.propertyprosmuncie.com/roof-replacement/",
      },
    },
    remodeling: {
      label: "Interior Remodel",
      url: "https://www.propertyprosmuncie.com/home-remodel/",
      subpages: {},
    },
    siding: {
      label: "Siding",
      url: "https://www.propertyprosmuncie.com/siding/",
      subpages: {},
    },
    gutters: {
      label: "Gutters",
      url: "https://www.propertyprosmuncie.com/gutters/",
      subpages: {},
    },
    construction: {
      label: "Construction",
      url: "https://www.propertyprosmuncie.com/construction/",
      subpages: {},
    },
    fencing: {
      label: "Fencing",
      url: "https://www.propertyprosmuncie.com/fencing/",
      subpages: {},
    },
  },

  /** Key pages for internal linking */
  pages: {
    home: "https://www.propertyprosmuncie.com/",
    about: "https://www.propertyprosmuncie.com/about-us/",
    services: "https://www.propertyprosmuncie.com/services/",
    gallery: "https://www.propertyprosmuncie.com/gallery/",
    testimonials: "https://www.propertyprosmuncie.com/testimonials/",
    contact: "https://www.propertyprosmuncie.com/contact-us/",
    blog: "https://www.propertyprosmuncie.com/blog/",
  },

  social: {
    facebook: "https://www.facebook.com/PropertyProsMuncie",
    linkedin: "https://www.linkedin.com/company/property-pros-muncie",
  },
} as const;

/** Weather-to-service mapping for content generation */
export const weatherServiceMap: Record<
  string,
  { services: string[]; priority: number }
> = {
  storm: { services: ["roofing", "siding", "gutters"], priority: 1 },
  storm_damage: { services: ["roofing", "siding", "gutters"], priority: 1 },
  high_wind: { services: ["roofing", "siding", "fencing"], priority: 1 },
  wind_damage: { services: ["roofing", "siding", "fencing"], priority: 1 },
  heavy_rain: { services: ["gutters", "roofing"], priority: 2 },
  water_damage: { services: ["gutters", "roofing"], priority: 2 },
  hail: { services: ["roofing", "siding"], priority: 1 },
  hail_damage: { services: ["roofing", "siding"], priority: 1 },
  freeze_thaw: {
    services: ["roofing", "fencing", "construction"],
    priority: 2,
  },
  snow_ice: { services: ["roofing", "gutters"], priority: 2 },
  extreme_heat: { services: ["roofing", "siding"], priority: 3 },
  mild: { services: ["remodeling", "fencing", "construction"], priority: 4 },
};
