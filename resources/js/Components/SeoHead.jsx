import React from 'react';
import { Head } from '@inertiajs/react';

export default function SeoHead({ seo, fallbackTitle = 'PhotOS', fallbackDescription = '' }) {
    if (seo?.enabled === false) {
        return (
            <Head title={fallbackTitle}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
        );
    }

    const computed = seo?.computed || {};
    const title = computed.title || fallbackTitle;
    const description = computed.description || fallbackDescription;
    const canonical = computed.canonical_url;
    const ogTitle = computed.og_title || title;
    const ogDescription = computed.og_description || description;
    const ogImage = computed.og_image_url;
    const robots = computed.robots || 'index, follow, max-image-preview:large';
    const jsonLd = computed.json_ld || [];

    const ogLocale = seo?.og_locale || 'es_PA';
    const ogSiteName = seo?.og_site_name || seo?.business_name || fallbackTitle;
    const ogImageAlt = seo?.og_image_alt || ogTitle;
    const ogImageWidth = seo?.og_image_width || '1200';
    const ogImageHeight = seo?.og_image_height || '630';
    const ogImageType = seo?.og_image_type || 'image/webp';
    const twitterSite = seo?.twitter_site || null;
    const twitterCreator = seo?.twitter_creator || twitterSite;

    return (
        <Head title={title}>
            {description && <meta name="description" content={description} />}
            {seo?.keywords && <meta name="keywords" content={seo.keywords} />}
            <meta name="robots" content={robots} />
            {seo?.google_site_verification && (
                <meta name="google-site-verification" content={seo.google_site_verification} />
            )}
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:locale" content={ogLocale} />
            <meta property="og:site_name" content={ogSiteName} />
            <meta property="og:title" content={ogTitle} />
            {ogDescription && <meta property="og:description" content={ogDescription} />}
            {canonical && <meta property="og:url" content={canonical} />}
            {ogImage && (
                <>
                    <meta property="og:image" content={ogImage} />
                    <meta property="og:image:secure_url" content={ogImage} />
                    <meta property="og:image:type" content={ogImageType} />
                    <meta property="og:image:width" content={ogImageWidth} />
                    <meta property="og:image:height" content={ogImageHeight} />
                    <meta property="og:image:alt" content={ogImageAlt} />
                </>
            )}

            {/* Twitter / X Card */}
            <meta name="twitter:card" content={seo?.twitter_card || 'summary_large_image'} />
            <meta name="twitter:title" content={ogTitle} />
            {ogDescription && <meta name="twitter:description" content={ogDescription} />}
            {ogImage && <meta name="twitter:image" content={ogImage} />}
            {ogImage && <meta name="twitter:image:alt" content={ogImageAlt} />}
            {twitterSite && <meta name="twitter:site" content={twitterSite} />}
            {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}

            {/* JSON-LD Structured Data */}
            {jsonLd.map((schema, index) => (
                <script
                    key={`seo-json-ld-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </Head>
    );
}
