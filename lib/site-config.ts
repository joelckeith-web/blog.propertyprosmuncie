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
  high_wind: { services: ["roofing", "siding", "fencing"], priority: 1 },
  heavy_rain: { services: ["gutters", "roofing"], priority: 2 },
  hail: { services: ["roofing", "siding"], priority: 1 },
  freeze_thaw: {
    services: ["roofing", "fencing", "construction"],
    priority: 2,
  },
  snow_ice: { services: ["roofing", "gutters"], priority: 2 },
  extreme_heat: { services: ["roofing", "siding"], priority: 3 },
  mild: { services: ["remodeling", "fencing", "construction"], priority: 4 },
};
