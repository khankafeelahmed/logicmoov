import { notFound } from "next/navigation";
import {
  Accessibility,
  Eye,
  Mail,
  Users,
  ShieldCheck,
  HandHelping,
  MessageSquareText,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";

const sections = [
  {
    id: "commitment",
    title: "1. Our Commitment to Accessibility",
    icon: ShieldCheck,
    paragraphs: [
      'Taxi LogicMoov ("LogicMoov," "we," "us," or "our") is committed to providing an accessible and inclusive experience for all customers, including people with disabilities.',
      "We strive to make our website, online booking platform, customer communications, and transportation services as accessible and user-friendly as reasonably possible.",
      "Our goal is to ensure that customers can access information, request transportation services, make bookings, and communicate with us without unnecessary barriers.",
    ],
  },
  {
    id: "website-accessibility",
    title: "2. Accessible Website and Digital Services",
    icon: Eye,
    paragraphs: [
      "We are working to improve the accessibility of our website and digital services by incorporating accessibility principles and recognized web accessibility practices.",
      "Where reasonably possible, we aim to provide clear and easy-to-understand website content, keyboard-accessible navigation, appropriate headings and page structure, descriptive labels for forms and booking fields, alternative text for meaningful images, sufficient text readability and visual contrast, accessible buttons, links, and interactive elements, accessible booking and contact forms, compatibility with commonly used assistive technologies, and clear error messages and instructions when information is missing or entered incorrectly.",
      "We are continuing to review and improve our website as technology, accessibility standards, and customer needs evolve.",
    ],
  },
  {
    id: "transportation-accessibility",
    title: "3. Transportation Accessibility",
    icon: Users,
    paragraphs: [
      "We recognize that accessibility requirements may vary depending on the passenger's individual needs and the vehicle available.",
      "If you require an accessible vehicle or have specific mobility, communication, or other accessibility requirements, please contact us before completing your booking whenever possible.",
      "We will make reasonable efforts to identify an appropriate vehicle or transportation solution based on availability and the requirements provided.",
      "Please note that accessible vehicle availability may vary depending on the pickup location, destination, date, time, vehicle category, and other operational circumstances.",
    ],
  },
  {
    id: "service-animals",
    title: "4. Service Animals",
    icon: CheckCircle2,
    paragraphs: [
      "Service animals may accompany passengers where permitted by applicable law.",
      "Passengers traveling with a service animal are encouraged to inform us of their requirements when making a booking so that we can provide appropriate assistance and make reasonable arrangements.",
    ],
  },
  {
    id: "booking-assistance",
    title: "5. Assistance During Booking",
    icon: HandHelping,
    paragraphs: [
      "If you experience difficulty using our website or online booking system because of an accessibility barrier, you may contact us for assistance.",
      "Our team will make reasonable efforts to assist you with making or modifying a booking, understanding information displayed on our website, providing information in an alternative format where reasonably possible, and communicating accessibility-related requirements to the appropriate driver or service provider.",
    ],
  },
  {
    id: "feedback",
    title: "6. Feedback and Accessibility Requests",
    icon: MessageSquareText,
    paragraphs: [
      "We welcome feedback from customers regarding accessibility. If you encounter an accessibility barrier or have a suggestion for improving our website or transportation services, please contact us.",
      "Email: info@logicmoov.ca",
      "When reporting an accessibility issue, please provide as much information as reasonably possible, including the webpage or service where you experienced the issue, a description of the accessibility barrier, the type of assistance you require, if applicable, and any other information that may help us investigate the issue.",
      "You are not required to provide unnecessary personal or sensitive information when submitting accessibility feedback.",
    ],
  },
  {
    id: "alternative-access",
    title: "7. Alternative Ways to Access Our Services",
    icon: ArrowRight,
    paragraphs: [
      "If you are unable to use a particular feature of our website or online booking platform, please contact us at info@logicmoov.ca.",
      "We will make reasonable efforts to provide assistance or an alternative method of accessing the requested service, subject to availability and applicable requirements.",
    ],
  },
  {
    id: "ongoing-improvements",
    title: "8. Ongoing Improvements",
    icon: ShieldCheck,
    paragraphs: [
      "Accessibility is an ongoing process. We periodically review our website and digital services to identify and address potential accessibility barriers.",
      "We may update this Accessibility Statement as our services, website, technology, or applicable accessibility requirements change.",
    ],
  },
  {
    id: "contact-us",
    title: "9. Contact Us",
    icon: Mail,
    paragraphs: [
      "For accessibility assistance, feedback, or questions, please contact Taxi LogicMoov at info@logicmoov.ca.",
      "Quebec, Canada",
      "We appreciate your feedback and are committed to continually improving the accessibility and inclusiveness of the LogicMoov experience.",
    ],
  },
];

export default async function AccessibilityStatementPage({
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
            {typedLocale === "fr" ? "Déclaration d’accessibilité" : "Accessibility Statement"}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {typedLocale === "fr" ? "Déclaration d’accessibilité" : "Accessibility Statement"}
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
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <Accessibility className="h-5 w-5" />
              </span>
              <p className="font-semibold text-ink-900">
                {typedLocale === "fr" ? "Notre engagement" : "Our commitment"}
              </p>
            </div>
            <p className="mt-3 leading-relaxed">
              {typedLocale === "fr"
                ? "Taxi LogicMoov s’engage à offrir une expérience accessible et inclusive pour tous nos clients, y compris les personnes en situation de handicap."
                : "Taxi LogicMoov is committed to providing an accessible and inclusive experience for all customers, including people with disabilities."}
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
