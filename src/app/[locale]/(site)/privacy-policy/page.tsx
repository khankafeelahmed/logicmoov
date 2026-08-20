import { notFound } from "next/navigation";
import { ShieldCheck, Lock, Mail, FileText, Users, Globe2 } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";

const sections = [
  {
    id: "who-we-are",
    title: "1. Who We Are",
    icon: Users,
    paragraphs: [
      'Taxi LogicMoov ("LogicMoov," "we," "us," or "our") provides taxi, limousine, and passenger transportation booking services in Quebec, Canada. We are committed to protecting the privacy and security of your personal information and to handling it responsibly and transparently.',
      'This Privacy Policy explains what personal information we collect, how we use and protect it, when we may share it, and the rights available to you under applicable privacy laws.',
    ],
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    icon: FileText,
    paragraphs: [
      "Depending on how you use our website and services, we may collect the following categories of information:",
      "Contact Information: Full name, email address, telephone or mobile phone number.",
      "Booking and Trip Information: Pickup and drop-off addresses, pickup date and time, number of passengers, vehicle type or category, special requests or additional service requirements, and other information necessary to fulfill your transportation booking.",
      "Payment Information: Payments may be processed through secure third-party payment service providers. We do not directly store complete payment card numbers on our systems. Payment information may be collected and processed by the applicable payment processor in accordance with its own privacy and security practices.",
      "Technical and Usage Information: When you access our website, we may automatically collect certain technical information, including IP address, browser type and version, device type and operating system, website usage information, date and time of access, and information relating to website security, performance, and analytics.",
    ],
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    icon: ShieldCheck,
    paragraphs: [
      "We may use your personal information for the following purposes:",
      "To receive, process, confirm, and manage transportation bookings.",
      "To arrange transportation services with the appropriate driver or chauffeur.",
      "To communicate with you regarding your booking, including confirmations, changes, reminders, cancellations, and service updates.",
      "To provide receipts, invoices, and other transaction-related communications.",
      "To respond to customer service inquiries and requests.",
      "To improve our website, booking process, transportation services, and customer experience.",
      "To maintain website and system security and prevent fraud, misuse, or unauthorized activity.",
      "To comply with applicable legal, regulatory, accounting, tax, and other obligations.",
      "To establish, exercise, or defend our legal rights where necessary.",
      "We will only use personal information for purposes that are reasonable and appropriate in the circumstances and in accordance with applicable privacy laws.",
    ],
  },
  {
    id: "sharing-and-disclosure",
    title: "4. Sharing and Disclosure of Information",
    icon: Globe2,
    paragraphs: [
      "We may disclose limited personal information when necessary to provide our services or fulfill the purposes described in this Privacy Policy.",
      "For example, we may share relevant booking and contact information with the driver or chauffeur assigned to provide your transportation service, payment processors and financial service providers involved in processing your payment, service providers that assist us with website hosting, technology, communications, security, analytics, or other business operations, and government authorities, regulators, courts, or other parties where disclosure is required or permitted by applicable law.",
      "We do not sell or rent your personal information to third parties.",
      "We take reasonable steps to ensure that service providers who process personal information on our behalf maintain appropriate privacy and security safeguards.",
    ],
  },
  {
    id: "data-retention",
    title: "5. Data Retention",
    icon: FileText,
    paragraphs: [
      "We retain personal information only for as long as reasonably necessary to fulfill the purposes for which it was collected, provide our services, resolve disputes, maintain appropriate business and accounting records, and comply with applicable legal, regulatory, and tax requirements.",
      "Certain booking, financial, and transaction records may be retained for up to seven (7) years, or for another period where required or permitted by applicable law.",
      "Where legally permitted, you may request the deletion of your personal information. Certain information may need to be retained where we have a legal, regulatory, contractual, or legitimate business obligation to do so.",
    ],
  },
  {
    id: "protection",
    title: "6. Protection of Personal Information",
    icon: Lock,
    paragraphs: [
      "We use reasonable administrative, technical, and physical safeguards designed to protect personal information against unauthorized access, use, disclosure, alteration, loss, or destruction.",
      "However, no method of transmitting or storing information electronically can be guaranteed to be completely secure. We therefore cannot guarantee absolute security of information transmitted to or stored by our systems.",
    ],
  },
  {
    id: "rights",
    title: "7. Your Privacy Rights",
    icon: ShieldCheck,
    paragraphs: [
      "Subject to applicable legal requirements and exceptions, you may have the right to request access to personal information we hold about you, request correction of inaccurate or incomplete information, request deletion of personal information where legally permitted, request information about how your personal information is collected, used, or disclosed, withdraw consent where processing is based on consent, subject to applicable limitations, and exercise other rights available under Quebec's privacy legislation and applicable Canadian privacy laws.",
      "To exercise your privacy rights or ask questions about our privacy practices, please contact us at info@logicmoov.ca. We may need to verify your identity before processing certain privacy requests.",
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies and Similar Technologies",
    icon: Globe2,
    paragraphs: [
      "Our website may use cookies and similar technologies that are necessary for website functionality, security, session management, and performance.",
      "We do not use third-party advertising cookies for targeted advertising.",
      "Where applicable, we may use analytics or similar technologies to understand website usage and improve our services. You may be able to manage certain cookie preferences through your browser settings or available website controls.",
    ],
  },
  {
    id: "laws",
    title: "9. Quebec and Canadian Privacy Laws",
    icon: FileText,
    paragraphs: [
      "Taxi LogicMoov operates in Quebec and is committed to complying with applicable privacy legislation, including Quebec's Act respecting the protection of personal information in the private sector, as amended by Law 25, as well as other applicable Canadian privacy requirements.",
      "Our privacy practices may be updated from time to time to reflect changes in our services, technology, legal requirements, or business practices.",
    ],
  },
  {
    id: "changes",
    title: "10. Changes to This Privacy Policy",
    icon: FileText,
    paragraphs: [
      "We may update this Privacy Policy periodically. When changes are made, we will update the 'Effective Date' at the beginning of this policy.",
      "We encourage you to review this Privacy Policy periodically to remain informed about how we protect and use personal information.",
    ],
  },
  {
    id: "contact",
    title: "11. Contact Us",
    icon: Mail,
    paragraphs: [
      "If you have questions, concerns, or requests regarding this Privacy Policy or the handling of your personal information, please contact us:",
      "Taxi LogicMoov",
      "Email: info@logicmoov.ca",
      "Quebec, Canada",
      "We will make reasonable efforts to respond to privacy-related requests within the timeframes required by applicable law.",
    ],
  },
];

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;

  return (
    <>
      <section className="bg-ink-950 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">
            {typedLocale === "fr" ? "Politique de confidentialité" : "Privacy Policy"}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {typedLocale === "fr" ? "Politique de confidentialité" : "Privacy Policy"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-300">
            {typedLocale === "fr"
              ? "Date d’effet : 13 août 2026"
              : "Effective Date: August 13, 2026"}
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-sm text-ink-700">
            <p className="font-semibold text-ink-900">
              {typedLocale === "fr" ? "Vue d’ensemble" : "Overview"}
            </p>
            <p className="mt-2 leading-relaxed">
              {typedLocale === "fr"
                ? "Taxi LogicMoov respecte votre vie privée et collecte uniquement les informations nécessaires pour traiter vos réservations, fournir un service fiable et se conformer aux obligations légales applicables."
                : "Taxi LogicMoov respects your privacy and only collects the information needed to process bookings, provide reliable service, and comply with legal obligations applicable to our operations."}
            </p>
          </div>

          <div className="mt-8 space-y-8">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.id}
                  className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <h2 className="text-2xl font-extrabold text-ink-900">{section.title}</h2>
                      <div className="mt-4 space-y-3 text-base leading-relaxed text-ink-700">
                        {section.paragraphs.map((paragraph, index) => (
                          <p key={`${section.id}-${index}`}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-ink-100 bg-ink-50 p-8">
            <h2 className="text-2xl font-extrabold text-ink-900">
              {typedLocale === "fr" ? "Nous joindre" : "Contact us"}
            </h2>
            <div className="mt-4 space-y-2 text-base text-ink-700">
              <p>
                <strong>Taxi LogicMoov</strong>
              </p>
              <p>
                <a href="mailto:info@logicmoov.ca" className="font-semibold text-brand-600 hover:text-brand-700">
                  info@logicmoov.ca
                </a>
              </p>
              <p>Quebec, Canada</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
