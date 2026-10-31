import { useEffect } from "react";

export interface PageSeoOptions {
  title: string;
  description?: string;
  image?: string;
  canonicalPath?: string;
}

export function usePageSeo({ title, description, image, canonicalPath }: PageSeoOptions) {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title.includes("KishanVaani") || title.includes("किसान वाणी")
      ? title
      : `${title} | किसान वाणी (KishanVaani)`;
    document.title = formattedTitle;

    // Helper to set or create meta tag
    const setMetaTag = (attribute: string, key: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    if (description) {
      setMetaTag("name", "description", description);
      setMetaTag("property", "og:description", description);
      setMetaTag("name", "twitter:description", description);
    }

    setMetaTag("property", "og:title", formattedTitle);
    setMetaTag("name", "twitter:title", formattedTitle);

    if (image) {
      setMetaTag("property", "og:image", image);
      setMetaTag("name", "twitter:image", image);
    }

    if (canonicalPath) {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", `${window.location.origin}${canonicalPath}`);
    }
  }, [title, description, image, canonicalPath]);
}

export default usePageSeo;
